// 视觉API辅助函数

export interface VisionMatchResult {
  success: boolean;
  color?: string;
  iconIndex?: number;
  name?: string;
  error?: string;
  rawResponse?: string;
}

export interface VisionApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

interface RecognitionData {
  icon_region?: string;
  icon_circle_background_color?: string;
  icon_circle_background_notes?: string;
  page_or_card_background_color?: string;
  item_name?: string;
  ocr_text?: string;
  ocr_full_text?: string;
  icon_visual_semantic?: string;
  raw?: string;
}

interface IconCandidate {
  id: string;
  name: string;
  base64: string;
}

const VALID_COLORS = ['金', '紫', '蓝', '绿', '咖'];

const COLOR_ALIASES: Record<string, string[]> = {
  金: ['金', '金色', '黄', '黄色', '橙黄', '琥珀', '橙色', 'gold', 'yellow', 'amber', 'orange'],
  紫: ['紫', '紫色', '紫红', '粉紫', '洋红', 'violet', 'purple', 'magenta'],
  蓝: ['蓝', '蓝色', '青蓝', '天蓝', '深蓝', '浅蓝', 'cyan', 'blue', 'azure'],
  绿: ['绿', '绿色', '青绿', '草绿', '翠绿', 'green', 'lime'],
  咖: ['咖', '咖色', '咖啡', '棕', '棕色', '褐', '褐色', '土黄', 'brown', 'coffee', 'tan']
};

function buildChatUrl(endpoint: string) {
  return `${endpoint.replace(/\/$/, '')}/chat/completions`;
}

function parseOpenAICompatibleText(data: any) {
  return data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.delta?.content ||
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    '';
}

function extractJsonObject(text: string) {
  const cleaned = String(text || '').trim();
  const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch ? fencedMatch[1].trim() : cleaned;
  const directMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!directMatch) throw new Error('AI响应中没有可解析的JSON对象');
  return JSON.parse(directMatch[0]);
}

function hexToRgb(text: string) {
  const match = String(text || '').match(/#?([0-9a-f]{6}|[0-9a-f]{3})/i);
  if (!match) return null;
  let value = match[1];
  if (value.length === 3) value = value.split('').map(ch => ch + ch).join('');
  const intValue = parseInt(value, 16);
  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255
  };
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  let red = r / 255;
  let green = g / 255;
  let blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta + (green < blue ? 6 : 0)) * 60;
    else if (max === green) hue = ((blue - red) / delta + 2) * 60;
    else hue = ((red - green) / delta + 4) * 60;
  }

  return {
    h: hue,
    s: delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1)),
    l: lightness
  };
}

function detectBaseMapColor(colorText: string) {
  const text = String(colorText || '').toLowerCase();

  for (const color of VALID_COLORS) {
    const aliases = COLOR_ALIASES[color] || [];
    if (aliases.some(alias => text.includes(alias.toLowerCase()))) return color;
  }

  const rgb = hexToRgb(text);
  if (!rgb) return null;

  const { h, s, l } = rgbToHsl(rgb);
  if (s < 0.18 || l < 0.12) return null;
  if (h >= 190 && h < 255) return '蓝';
  if (h >= 70 && h < 170) return '绿';
  if (h >= 255 && h < 325) return '紫';
  if (h >= 15 && h < 48 && l < 0.55) return '咖';
  if ((h >= 35 && h < 70) || h < 15 || h >= 325) return '金';
  return null;
}

function buildImageContent(prompt: string, images: Array<{ mimeType: string; base64: string }>) {
  return [
    { type: 'text', text: prompt },
    ...images.map(image => ({
      type: 'image_url',
      image_url: {
        url: `data:${image.mimeType};base64,${image.base64}`
      }
    }))
  ];
}

async function callVisionApi(
  config: VisionApiConfig,
  prompt: string,
  images: Array<{ mimeType: string; base64: string }>,
  maxTokens: number
) {
  const response = await fetch(buildChatUrl(config.endpoint), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: buildImageContent(prompt, images) }],
      temperature: 0.1,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败: ${response.status} ${response.statusText} ${errorText}`);
  }

  const data = await response.json();
  const content = parseOpenAICompatibleText(data);
  if (!content) throw new Error(`API返回的响应格式不正确: ${JSON.stringify(data)}`);
  return content;
}

function buildIconCandidatesForPrompt(iconLibrary: IconCandidate[]) {
  return iconLibrary.map((icon, index) => ({
    id: `icon_${index}`,
    filename: icon.name,
    index
  }));
}

function resolveMatchIndex(parsed: any, iconLibrary: IconCandidate[]) {
  if (typeof parsed.best_match_index === 'number') return parsed.best_match_index;
  if (typeof parsed.best_match_index === 'string') return parseInt(parsed.best_match_index, 10);
  if (typeof parsed.iconIndex === 'number') return parsed.iconIndex;
  if (typeof parsed.iconIndex === 'string') return parseInt(parsed.iconIndex, 10);

  if (typeof parsed.best_icon_id === 'string') {
    const idMatch = parsed.best_icon_id.match(/icon_(\d+)/);
    if (idMatch) return parseInt(idMatch[1], 10);
  }

  if (typeof parsed.best_icon_filename === 'string') {
    return iconLibrary.findIndex(icon => icon.name === parsed.best_icon_filename);
  }

  return -1;
}



/**
 * 并发控制函数：限制同时执行的Promise数量
 * @param tasks 任务数组，每个任务是一个返回Promise的函数
 * @param limit 最大并发数
 * @returns 所有任务的结果数组
 */
async function runWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let currentIndex = 0;

  // 创建worker函数
  const worker = async () => {
    while (currentIndex < tasks.length) {
      const index = currentIndex++;
      try {
        results[index] = await tasks[index]();
      } catch (error) {
        results[index] = null as any;
      }
    }
  };

  // 创建指定数量的并发worker
  const workers = Array(Math.min(limit, tasks.length))
    .fill(null)
    .map(() => worker());

  // 等待所有worker完成
  await Promise.all(workers);
  return results;
}

/**
 * 新的识别方式：直接将截图和icon图片一起传给AI进行视觉比较（支持并行批次处理）
 * @param config API配置
 * @param screenshotBase64 截图的base64（不含前缀）
 * @param iconLibrary icon库数组，每个包含base64
 * @param onLog 日志回调函数
 * @param maxIconsPerCall 每批次最大icon数量，默认12
 * @returns 匹配结果
 */
export async function runDirectVisionMatching(
  config: VisionApiConfig,
  screenshotBase64: string,
  iconLibrary: IconCandidate[],
  onLog: (message: string) => void,
  maxIconsPerCall: number = 12
): Promise<VisionMatchResult> {
  if (!config.endpoint || !config.apiKey || !config.model) {
    const error = 'API配置不完整，请检查端点、Key和模型';
    onLog(`[错误] ${error}`);
    return { success: false, error };
  }

  if (!screenshotBase64) {
    const error = '请先上传游戏截图';
    onLog(`[错误] ${error}`);
    return { success: false, error };
  }

  if (iconLibrary.length === 0) {
    const error = '请先添加透明icon到库中';
    onLog(`[错误] ${error}`);
    return { success: false, error };
  }

  // 验证并限制批次大小
  if (maxIconsPerCall < 1) maxIconsPerCall = 1;
  if (maxIconsPerCall > 20) maxIconsPerCall = 20;

  // 计算批次分配，尽量均匀分布
  const totalBatches = Math.ceil(iconLibrary.length / maxIconsPerCall);
  
  // 计算每个批次的实际大小，尽量均匀
  const avgBatchSize = Math.floor(iconLibrary.length / totalBatches);
  const remainder = iconLibrary.length % totalBatches;
  
  // 创建批次大小数组：前 remainder 个批次多分配1个icon
  const batchSizes: number[] = [];
  for (let i = 0; i < totalBatches; i++) {
    batchSizes.push(i < remainder ? avgBatchSize + 1 : avgBatchSize);
  }

  onLog('[开始] 直接视觉识别：AI将直接看到参考图和候选icon图片');
  if (iconLibrary.length > maxIconsPerCall) {
    onLog(`[信息] icon库共 ${iconLibrary.length} 个，将分 ${totalBatches} 批次并行识别`);
    onLog(`[优化] 批次大小均匀分配: ${batchSizes.join(', ')} 个icon/批次`);
    onLog(`[优化] 使用并行处理，最大并发数: 3`);
  }

  try {
    // 定义批次候选类型
    type BatchCandidate = {
      batchIndex: number;
      confidence: number;
      iconIndex: number;
      iconName: string;
      reason: string;
      itemName?: string;
      bottomColor?: string;
    };

    // 分批进行直接视觉比较（并行处理）
    const allBatchCandidates: BatchCandidate[] = [];

    let detectedColor: string | null = null;
    let detectedItemName: string | null = null;

    // 创建所有批次的任务
    const batchTasks: (() => Promise<BatchCandidate | null>)[] = [];
    
    // 使用均匀分配的批次大小
    let currentStartIdx = 0;
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchSize = batchSizes[batchIndex];
      const startIdx = currentStartIdx;
      const endIdx = startIdx + batchSize;
      const iconsToCompare = iconLibrary.slice(startIdx, endIdx);
      
      currentStartIdx = endIdx;

      // 创建批次任务（返回Promise的函数）
      const batchTask = async () => {
        onLog(`[批次 ${batchIndex + 1}/${totalBatches}] 开始比较 icon ${startIdx} 到 ${endIdx - 1}，共 ${iconsToCompare.length} 个`);

        const directMatchingPrompt = `你是一个视觉比较专家。现在你会看到多张图片：

第1张图片：游戏截图，包含一个带彩色圆形底色的icon
第2张图片及之后：透明背景的候选icon，编号从 icon_0 到 icon_${iconsToCompare.length - 1}

候选icon清单：
${JSON.stringify(iconsToCompare.map((icon, idx) => ({
  id: `icon_${idx}`,
  filename: icon.name,
  index: idx
})), null, 2)}

你的任务分为两部分：

**第一部分：分析游戏截图**
1. 识别目标icon的圆形底色（必须是以下之一：金、紫、蓝、绿、咖）
2. 提取物品/角色的核心名称（如'心纸【孙辅】'、'头像框【菌子不器】'等，不包含描述文字）
3. 注意区分icon圆形底色与页面背景

**第二部分：视觉比较匹配**
1. 仔细观察第1张截图中的icon图案（忽略圆形底色）
2. 逐一比较后续的透明背景候选icon
3. 找出与截图中icon图案最相似的那个候选icon

比较重点：
- 轮廓形状
- 主体图案
- 颜色分布
- 细节特征
- 整体结构

请输出严格JSON格式（不要输出Markdown代码块）：
{
  "icon_circle_background_color": "底色（金/紫/蓝/绿/咖之一）",
  "item_name": "物品核心名称",
  "best_match_index": 最佳匹配的索引数字（0到${iconsToCompare.length - 1}）,
  "best_icon_filename": "最佳匹配的文件名",
  "confidence": 0.0到1.0之间的置信度,
  "reason": "为什么选择这个icon的理由，说明相似之处"
}`;

        try {
          const matchingReply = await callVisionApi(
            config,
            directMatchingPrompt,
            [
              { mimeType: 'image/png', base64: screenshotBase64 },
              ...iconsToCompare.map(icon => ({ mimeType: 'image/png', base64: icon.base64 }))
            ],
            1000
          );

          onLog(`[批次${batchIndex + 1}] AI响应完成`);

          const matchingData = extractJsonObject(matchingReply);
          const localIconIndex = typeof matchingData.best_match_index === 'number' 
            ? matchingData.best_match_index 
            : parseInt(String(matchingData.best_match_index), 10);

          if (Number.isInteger(localIconIndex) && localIconIndex >= 0 && localIconIndex < iconsToCompare.length) {
            const globalIconIndex = startIdx + localIconIndex;
            const confidence = matchingData.confidence || 0;
            
            const candidate: BatchCandidate = {
              batchIndex,
              confidence,
              iconIndex: globalIconIndex,
              iconName: iconLibrary[globalIconIndex].name,
              reason: matchingData.reason || '',
              itemName: matchingData.item_name,
              bottomColor: matchingData.icon_circle_background_color
            };

            onLog(`[批次${batchIndex + 1}] 候选: ${iconLibrary[globalIconIndex].name}, 置信度: ${confidence}`);
            
            return candidate;
          } else {
            onLog(`[批次${batchIndex + 1}] 该批次未找到有效匹配`);
            return null;
          }
        } catch (error) {
          onLog(`[批次${batchIndex + 1}] 处理失败: ${error instanceof Error ? error.message : String(error)}`);
          return null;
        }
      };

      batchTasks.push(batchTask);
    }

    // 并行执行所有批次任务（最大并发数为3）
    onLog(`[并行处理] 开始执行 ${batchTasks.length} 个批次任务...`);
    const startTime = Date.now();
    
    const batchResults = await runWithConcurrencyLimit<BatchCandidate | null>(batchTasks, 3);
    
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    onLog(`[并行处理] 所有批次完成，总耗时: ${totalTime}秒`);

    // 过滤有效结果
    for (const result of batchResults) {
      if (result) {
        allBatchCandidates.push(result);
        
        // 提取底色（优先使用第一个识别到的）
        if (!detectedColor && result.bottomColor) {
          const colorSource = result.bottomColor;
          detectedColor = detectBaseMapColor(colorSource);
          if (detectedColor) {
            onLog(`[汇总] 从批次${result.batchIndex + 1}识别底色: ${detectedColor}`);
          }
        }
        
        // 提取名称（优先使用第一个识别到的）
        if (!detectedItemName && result.itemName) {
          detectedItemName = result.itemName;
          onLog(`[汇总] 从批次${result.batchIndex + 1}识别名称: ${detectedItemName}`);
        }
      }
    }

    // 检查是否识别到底色
    if (!detectedColor) {
      const error = '所有批次均未能识别底色';
      onLog(`[错误] ${error}`);
      return { success: false, error };
    }

    // 汇总结果
    if (allBatchCandidates.length === 0) {
      const error = '所有批次均未找到有效匹配';
      onLog(`[错误] ${error}`);
      return { success: false, error };
    }

    const finalItemName = detectedItemName || '未识别名称';
    
    onLog(`[汇总] 共收集到 ${allBatchCandidates.length} 个候选结果`);

    // 汇总结果
    if (allBatchCandidates.length === 0) {
      const error = '所有批次均未找到有效匹配';
      onLog(`[错误] ${error}`);
      return { success: false, error };
    }

    onLog(`[汇总] 共收集到 ${allBatchCandidates.length} 个候选结果`);

    // 按置信度排序
    allBatchCandidates.sort((a, b) => b.confidence - a.confidence);
    
    const bestCandidate = allBatchCandidates[0];

    // 如果有多个候选，进行最终比较
    if (allBatchCandidates.length > 1) {
      const topCandidates = allBatchCandidates.slice(0, Math.min(5, allBatchCandidates.length));
      const topIcons = topCandidates.map(c => iconLibrary[c.iconIndex]);
      
      onLog(`[最终比较] 从 ${allBatchCandidates.length} 个候选中选出前 ${topCandidates.length} 个`);

      const finalPrompt = `你是一个视觉比较专家。这是最终选择阶段。

第1张图片：游戏截图
第2张图片及之后：从各批次筛选出的最优候选icon

候选清单（已按前期置信度排序）：
${JSON.stringify(topIcons.map((icon, idx) => ({
  id: `icon_${idx}`,
  filename: icon.name,
  index: idx,
  previous_confidence: topCandidates[idx].confidence
})), null, 2)}

请从这些候选中选出与截图中icon最相似的那个。

输出JSON格式：
{
  "best_match_index": 最终选择的索引（0到${topIcons.length - 1}）,
  "confidence": 0.0到1.0,
  "reason": "最终选择理由"
}`;

      const finalReply = await callVisionApi(
        config,
        finalPrompt,
        [
          { mimeType: 'image/png', base64: screenshotBase64 },
          ...topIcons.map(icon => ({ mimeType: 'image/png', base64: icon.base64 }))
        ],
        600
      );

      onLog(`[最终比较] AI响应: ${finalReply}`);

      try {
        const finalData = extractJsonObject(finalReply);
        const finalLocalIndex = typeof finalData.best_match_index === 'number'
          ? finalData.best_match_index
          : parseInt(String(finalData.best_match_index), 10);

        if (Number.isInteger(finalLocalIndex) && finalLocalIndex >= 0 && finalLocalIndex < topIcons.length) {
          const selectedCandidate = topCandidates[finalLocalIndex];
          
          onLog('[成功] 直接视觉识别完成');
          onLog(`[结果] 底色: ${detectedColor}`);
          onLog(`[结果] 匹配icon: ${selectedCandidate.iconName} (索引${selectedCandidate.iconIndex})`);
          onLog(`[结果] 道具名称: ${finalItemName}`);
          onLog(`[结果] 最终置信度: ${finalData.confidence}`);
          onLog(`[结果] 理由: ${finalData.reason}`);

          return {
            success: true,
            color: detectedColor,
            iconIndex: selectedCandidate.iconIndex,
            name: finalItemName,
            rawResponse: JSON.stringify({ final: finalData })
          };
        }
      } catch (error) {
        onLog(`[警告] 最终比较失败，使用最高置信度结果: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 使用最高置信度结果
    
    onLog('[成功] 直接视觉识别完成');
    onLog(`[结果] 底色: ${detectedColor}`);
    onLog(`[结果] 匹配icon: ${bestCandidate.iconName} (索引${bestCandidate.iconIndex})`);
    onLog(`[结果] 道具名称: ${finalItemName}`);
    onLog(`[结果] 置信度: ${bestCandidate.confidence}`);
    onLog(`[结果] 理由: ${bestCandidate.reason}`);

    return {
      success: true,
      color: detectedColor,
      iconIndex: bestCandidate.iconIndex,
      name: finalItemName,
      rawResponse: JSON.stringify({ matching: bestCandidate })
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    onLog(`[错误] 请求失败: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}
