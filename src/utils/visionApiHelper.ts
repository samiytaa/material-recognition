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
 * 调用视觉API进行截图预识别、底色定位和icon匹配
 * @param config API配置
 * @param screenshotBase64 截图的base64（不含前缀）
 * @param iconLibrary icon库数组，每个包含base64
 * @param onLog 日志回调函数
 * @param maxIconsPerCall 每批次最大icon数量，默认12
 * @returns 匹配结果
 */
export async function runVisionMatching(
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

  const totalBatches = Math.ceil(iconLibrary.length / maxIconsPerCall);

  onLog('[开始] 一键识别：先分析截图icon区域和圆形底色');
  if (iconLibrary.length > maxIconsPerCall) {
    onLog(`[信息] icon库共 ${iconLibrary.length} 个，将分 ${totalBatches} 批次进行识别`);
  }

  try {
    const recognitionPrompt = `你是一个游戏素材分析专家。请分析这张游戏UI截图，严格按以下JSON格式输出（不要输出多余解释）：
{
  "icon_region": "描述icon所在区域位置，例如左上角/中央偏右，以及icon主体形状/轮廓特征(例如圆形徽章、方形武器、角色头像边框等)",
  "icon_circle_background_color": "只识别目标icon所在圆形/徽章区域的底色，描述颜色和大致十六进制猜测；不要把截图页面背景、卡片背景、文字底板、边框或阴影当成该底色",
  "icon_circle_background_notes": "说明你如何区分icon圆形底色和其他UI背景，例如圆形边界、渐变、描边、遮挡、透明度",
  "page_or_card_background_color": "截图中icon区域以外的页面/卡片/列表背景主色，仅用于排除，不用于匹配icon底色",
  "item_name": "只提取物品/角色的核心名称，例如'心纸【孙辅】'、'头像框【菌子不器】'、'美食图纸·汤饼棚'等，不要包含描述文字、拥有数量、属性说明等额外信息",
  "ocr_full_text": "截图中所有可见的文字内容，用于辅助识别",
  "icon_visual_semantic": "描述该icon视觉细节：主要颜色、内部图案、纹理、是否武器/道具/角色等，便于匹配透明底icon库"
}
特别注意：
1. item_name字段必须只包含物品名称本身，不要包含"用于"、"拥有"、"通过"等描述性文字
2. 常见名称格式：心纸【角色名】、头像框【名称】、美食图纸·名称、道具名称等
3. 目标是icon本体背后的圆形底色，通常紧贴icon轮廓或位于圆形徽章内部；不要识别整张截图背景、装备格子背景、弹窗背景、列表底色或文字区域底色
如果看不到icon、圆形底色或文字就如实说明。只输出JSON。`;

    const recognitionReply = await callVisionApi(
      config,
      recognitionPrompt,
      [{ mimeType: 'image/png', base64: screenshotBase64 }],
      900
    );

    onLog(`[预识别AI响应] ${recognitionReply}`);

    let recognitionData: RecognitionData;
    try {
      recognitionData = extractJsonObject(recognitionReply) as RecognitionData;
    } catch {
      recognitionData = { raw: recognitionReply };
    }

    const colorSource = [
      recognitionData.icon_circle_background_color,
      recognitionData.icon_circle_background_notes
    ].filter(Boolean).join(' ');
    const color = detectBaseMapColor(colorSource);

    onLog(`[预识别] icon区域: ${recognitionData.icon_region || '未描述'}`);
    onLog(`[预识别] icon圆形底色: ${recognitionData.icon_circle_background_color || '未识别'}`);
    onLog(`[预识别] 物品名称: ${recognitionData.item_name || '未识别'}`);
    if (recognitionData.ocr_full_text) {
      onLog(`[预识别] 完整文字: ${recognitionData.ocr_full_text.substring(0, 100)}...`);
    }

    if (!color) {
      const error = `未能根据AI返回底色定位到底图: ${colorSource || '空'}`;
      onLog(`[错误] ${error}`);
      return { success: false, error, rawResponse: recognitionReply };
    }

    onLog(`[底图] 已定位底色图: ${color}`);

    // 分批处理所有icon
    const allBatchCandidates: Array<{ batchIndex: number; candidate: any; confidence: number; iconIndex: number; iconName: string }> = [];

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * maxIconsPerCall;
      const endIdx = Math.min(startIdx + maxIconsPerCall, iconLibrary.length);
      const iconsToCompare = iconLibrary.slice(startIdx, endIdx);

      onLog(`[批次 ${batchIndex + 1}/${totalBatches}] 开始识别 icon ${startIdx} 到 ${endIdx - 1}，共 ${iconsToCompare.length} 个`);

      const iconCandidates = buildIconCandidatesForPrompt(iconsToCompare);
      const recognitionHint = `

截图预识别结果（必须用于定位目标icon区域和圆形底色，最终匹配仍以视觉比较为准）：
${JSON.stringify(recognitionData, null, 2)}`;

      const matchingPrompt = `你是一个严谨的跨图像 icon 匹配器。你的任务是判断游戏截图中带背景的 icon，与哪一张透明背景候选 icon 是同一个图案。

输入图片顺序：
1. screenshot：第一张图片，是游戏内参考截图，其中目标 icon 已经叠在彩色背景上，可能存在缩放、压缩、阴影、UI 边框或轻微遮挡。
2. icon_0...icon_n：后续图片，是透明背景的解包 icon 候选，顺序与候选清单一致。

候选 icon 清单：
${JSON.stringify(iconCandidates, null, 2)}

匹配规则：
- 只比较 icon 本体图案，不要把截图中的彩色背景、边框、文字当成 icon 特征。
- 需要单独识别并报告截图中目标 icon 区域的圆形/徽章底色；该底色通常位于 icon 本体背后、圆形边界以内，不能与页面背景、卡片背景、装备格子背景、文字区域背景混淆。
- 圆形底色可用于帮助定位目标icon区域，但匹配透明候选时不要把底色误当成候选icon图案的一部分。
- 重点比较轮廓、主体结构、内部图案、装饰细节、明暗区域和颜色分布。
- 允许截图中的 icon 比候选图更小、更模糊、有压缩伪影。
- 文件名无业务含义，不能根据文件名猜测。
- 如果截图中的 icon 被背景影响，要在视觉上剥离背景后再比较。
- 如果无法可靠判断，不要强行高置信度，仍需给出最可能候选和原因。
${recognitionHint}

请输出严格 JSON，不要输出 Markdown，不要输出多余文字：
{
  "best_icon_id": "icon_0",
  "best_icon_filename": "",
  "best_match_index": 0,
  "confidence": 0.0,
  "decision": "accept/review/reject",
  "top_candidates": [
    {
      "icon_id": "icon_0",
      "filename": "",
      "index": 0,
      "score": 0.0,
      "matching_features": [],
      "mismatching_features": []
    }
  ],
  "screenshot_icon_features": {
    "icon_circle_background_color": "",
    "icon_circle_background_evidence": "",
    "shape": [],
    "main_colors": [],
    "distinctive_details": [],
    "possible_occlusions_or_noise": []
  },
  "reason": ""
}

decision 判定：
- accept：confidence >= 0.85，且 top1 明显优于 top2。
- review：0.60 <= confidence < 0.85，或 top1/top2 接近，需要人工确认。
- reject：confidence < 0.60，说明当前候选集中可能没有匹配项或截图不可判读。`;

      iconsToCompare.forEach((icon, index) => onLog(`[批次${batchIndex + 1}-候选${index}] ${icon.name}`));

      const matchingReply = await callVisionApi(
        config,
        matchingPrompt,
        [
          { mimeType: 'image/png', base64: screenshotBase64 },
          ...iconsToCompare.map(icon => ({ mimeType: 'image/png', base64: icon.base64 }))
        ],
        1200
      );

      onLog(`[批次${batchIndex + 1}] AI响应: ${matchingReply.substring(0, 200)}...`);

      try {
        const matchingData = extractJsonObject(matchingReply);
        const localIconIndex = resolveMatchIndex(matchingData, iconsToCompare);

        if (Number.isInteger(localIconIndex) && localIconIndex >= 0 && localIconIndex < iconsToCompare.length) {
          const globalIconIndex = startIdx + localIconIndex;
          const confidence = matchingData.confidence || 0;
          
          allBatchCandidates.push({
            batchIndex,
            candidate: matchingData,
            confidence,
            iconIndex: globalIconIndex,
            iconName: iconLibrary[globalIconIndex].name
          });

          onLog(`[批次${batchIndex + 1}] 候选结果: ${iconLibrary[globalIconIndex].name}, 置信度: ${confidence}`);
        } else {
          onLog(`[批次${batchIndex + 1}] 该批次未找到有效匹配`);
        }
      } catch (error) {
        onLog(`[批次${batchIndex + 1}] 解析响应失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 汇总所有批次结果，选出最佳候选
    if (allBatchCandidates.length === 0) {
      const error = '所有批次均未找到有效匹配';
      onLog(`[错误] ${error}`);
      return { success: false, error };
    }

    onLog(`[汇总] 共收集到 ${allBatchCandidates.length} 个候选结果，开始最终比较`);

    // 按置信度排序，选择最佳
    allBatchCandidates.sort((a, b) => b.confidence - a.confidence);
    
    const bestCandidate = allBatchCandidates[0];
    const finalIconIndex = bestCandidate.iconIndex;

    onLog('[开始] 最终汇总识别');

    // 如果有多个候选，再次调用AI进行最终比较
    if (allBatchCandidates.length > 1) {
      const topCandidates = allBatchCandidates.slice(0, Math.min(6, allBatchCandidates.length));
      const topIcons = topCandidates.map(c => iconLibrary[c.iconIndex]);
      
      onLog(`[最终比较] 从 ${allBatchCandidates.length} 个候选中选出前 ${topCandidates.length} 个进行最终对比`);
      topCandidates.forEach((c, idx) => onLog(`[最终候选${idx}] ${c.iconName}, 批次置信度: ${c.confidence}`));

      const finalMatchingPrompt = `你是一个严谨的跨图像 icon 匹配器。这是最终比较阶段。

前面已经对所有候选icon分批进行了识别，现在需要你从各批次的最佳候选中选出最终的最佳匹配。

输入图片顺序：
1. screenshot：第一张图片，是游戏内参考截图
2. icon_0...icon_${topIcons.length - 1}：后续图片，是从各批次筛选出的最优候选

候选 icon 清单：
${JSON.stringify(topIcons.map((icon, idx) => ({
  id: `icon_${idx}`,
  filename: icon.name,
  index: idx,
  previous_confidence: topCandidates[idx].confidence
})), null, 2)}

前面预识别结果：
${JSON.stringify(recognitionData, null, 2)}

请严格输出JSON格式，选出最终最佳匹配：
{
  "best_icon_id": "icon_X",
  "best_icon_filename": "",
  "best_match_index": X,
  "confidence": 0.0,
  "decision": "accept/review/reject",
  "reason": "说明为什么这个是最佳匹配"
}`;

      const finalMatchingReply = await callVisionApi(
        config,
        finalMatchingPrompt,
        [
          { mimeType: 'image/png', base64: screenshotBase64 },
          ...topIcons.map(icon => ({ mimeType: 'image/png', base64: icon.base64 }))
        ],
        1000
      );

      onLog(`[最终比较AI响应] ${finalMatchingReply}`);

      try {
        const finalMatchingData = extractJsonObject(finalMatchingReply);
        const finalLocalIndex = resolveMatchIndex(finalMatchingData, topIcons);

        // 检查AI是否拒绝所有候选
        if (finalMatchingData.decision === 'reject' || finalLocalIndex < 0) {
          onLog(`[警告] AI最终比较认为所有候选均不匹配: ${finalMatchingData.reason || '未知原因'}`);
          onLog(`[警告] 将使用批次最高置信度结果，但可能不准确，请人工核查`);
        } else if (Number.isInteger(finalLocalIndex) && finalLocalIndex >= 0 && finalLocalIndex < topIcons.length) {
          const selectedCandidate = topCandidates[finalLocalIndex];
          const name = recognitionData.item_name || recognitionData.ocr_text || finalMatchingData.name || '未识别名称';
          
          onLog('[成功] 一键识别完成');
          onLog(`[结果] 底色: ${color}`);
          onLog(`[结果] 匹配icon: ${selectedCandidate.iconName} (全局索引${selectedCandidate.iconIndex})`);
          onLog(`[结果] 道具名称: ${name}`);
          onLog(`[结果] 最终置信度: ${finalMatchingData.confidence || selectedCandidate.confidence}`);
          if (finalMatchingData.decision) onLog(`[结果] 决策: ${finalMatchingData.decision}`);

          return {
            success: true,
            color,
            iconIndex: selectedCandidate.iconIndex,
            name,
            rawResponse: JSON.stringify({ recognition: recognitionData, finalMatching: finalMatchingData })
          };
        }
      } catch (error) {
        onLog(`[警告] 最终比较解析失败，使用批次最高置信度结果: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 如果只有一个候选或最终比较失败/拒绝，使用最高置信度的结果
    const name = recognitionData.item_name || recognitionData.ocr_text || '未识别名称';
    
    onLog('[成功] 一键识别完成（使用批次最高置信度结果）');
    onLog(`[结果] 底色: ${color}`);
    onLog(`[结果] 匹配icon: ${bestCandidate.iconName} (全局索引${finalIconIndex})`);
    onLog(`[结果] 道具名称: ${name}`);
    onLog(`[结果] 置信度: ${bestCandidate.confidence}`);
    if (bestCandidate.candidate.decision) onLog(`[结果] 决策: ${bestCandidate.candidate.decision}`);

    return {
      success: true,
      color,
      iconIndex: finalIconIndex,
      name,
      rawResponse: JSON.stringify({ recognition: recognitionData, matching: bestCandidate.candidate })
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    onLog(`[错误] 请求失败: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * 新的识别方式：直接将截图和icon图片一起传给AI进行视觉比较
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

  const totalBatches = Math.ceil(iconLibrary.length / maxIconsPerCall);

  onLog('[开始] 直接视觉识别：AI将直接看到参考图和候选icon图片');
  if (iconLibrary.length > maxIconsPerCall) {
    onLog(`[信息] icon库共 ${iconLibrary.length} 个，将分 ${totalBatches} 批次进行识别`);
  }

  try {
    // 第一步：识别截图中的底色和物品名称
    const recognitionPrompt = `你是一个游戏素材分析专家。请仔细观察这张游戏UI截图，识别其中的目标icon。

请严格按以下JSON格式输出（不要输出多余解释）：
{
  "icon_circle_background_color": "目标icon圆形底色，描述颜色（金/紫/蓝/绿/咖之一）",
  "item_name": "物品/角色的核心名称，例如'心纸【孙辅】'、'头像框【菌子不器】'等",
  "icon_description": "描述icon的视觉特征：形状、颜色、图案、是否为武器/道具/角色等"
}

注意：
1. icon_circle_background_color 必须是以下之一：金、紫、蓝、绿、咖
2. 只识别目标icon的圆形底色，不要与页面背景混淆
3. item_name 只包含物品名称本身，不包含描述文字
只输出JSON。`;

    const recognitionReply = await callVisionApi(
      config,
      recognitionPrompt,
      [{ mimeType: 'image/png', base64: screenshotBase64 }],
      500
    );

    onLog(`[步骤1] AI识别截图: ${recognitionReply}`);

    let recognitionData: any;
    try {
      recognitionData = extractJsonObject(recognitionReply);
    } catch {
      recognitionData = { raw: recognitionReply };
    }

    const colorSource = recognitionData.icon_circle_background_color || '';
    const color = detectBaseMapColor(colorSource);

    if (!color) {
      const error = `未能识别底色: ${colorSource || '空'}`;
      onLog(`[错误] ${error}`);
      return { success: false, error, rawResponse: recognitionReply };
    }

    onLog(`[步骤1] 识别结果 - 底色: ${color}, 名称: ${recognitionData.item_name || '未识别'}`);

    // 第二步：分批进行直接视觉比较
    const allBatchCandidates: Array<{ 
      batchIndex: number; 
      confidence: number; 
      iconIndex: number; 
      iconName: string;
      reason: string;
    }> = [];

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * maxIconsPerCall;
      const endIdx = Math.min(startIdx + maxIconsPerCall, iconLibrary.length);
      const iconsToCompare = iconLibrary.slice(startIdx, endIdx);

      onLog(`[批次 ${batchIndex + 1}/${totalBatches}] 比较 icon ${startIdx} 到 ${endIdx - 1}，共 ${iconsToCompare.length} 个`);

      const directMatchingPrompt = `你是一个视觉比较专家。现在你会看到多张图片：

第1张图片：游戏截图，包含一个带彩色圆形底色的icon
第2张图片及之后：透明背景的候选icon，编号从 icon_0 到 icon_${iconsToCompare.length - 1}

候选icon清单：
${JSON.stringify(iconsToCompare.map((icon, idx) => ({
  id: `icon_${idx}`,
  filename: icon.name,
  index: idx
})), null, 2)}

你的任务：
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
  "best_match_index": 最佳匹配的索引数字（0到${iconsToCompare.length - 1}）,
  "best_icon_filename": "最佳匹配的文件名",
  "confidence": 0.0到1.0之间的置信度,
  "reason": "为什么选择这个icon的理由，说明相似之处"
}`;

      const matchingReply = await callVisionApi(
        config,
        directMatchingPrompt,
        [
          { mimeType: 'image/png', base64: screenshotBase64 },
          ...iconsToCompare.map(icon => ({ mimeType: 'image/png', base64: icon.base64 }))
        ],
        800
      );

      onLog(`[批次${batchIndex + 1}] AI响应: ${matchingReply.substring(0, 150)}...`);

      try {
        const matchingData = extractJsonObject(matchingReply);
        const localIconIndex = typeof matchingData.best_match_index === 'number' 
          ? matchingData.best_match_index 
          : parseInt(String(matchingData.best_match_index), 10);

        if (Number.isInteger(localIconIndex) && localIconIndex >= 0 && localIconIndex < iconsToCompare.length) {
          const globalIconIndex = startIdx + localIconIndex;
          const confidence = matchingData.confidence || 0;
          
          allBatchCandidates.push({
            batchIndex,
            confidence,
            iconIndex: globalIconIndex,
            iconName: iconLibrary[globalIconIndex].name,
            reason: matchingData.reason || ''
          });

          onLog(`[批次${batchIndex + 1}] 候选: ${iconLibrary[globalIconIndex].name}, 置信度: ${confidence}`);
        } else {
          onLog(`[批次${batchIndex + 1}] 该批次未找到有效匹配`);
        }
      } catch (error) {
        onLog(`[批次${batchIndex + 1}] 解析失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

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
          const name = recognitionData.item_name || '未识别名称';
          
          onLog('[成功] 直接视觉识别完成');
          onLog(`[结果] 底色: ${color}`);
          onLog(`[结果] 匹配icon: ${selectedCandidate.iconName} (索引${selectedCandidate.iconIndex})`);
          onLog(`[结果] 道具名称: ${name}`);
          onLog(`[结果] 最终置信度: ${finalData.confidence}`);
          onLog(`[结果] 理由: ${finalData.reason}`);

          return {
            success: true,
            color,
            iconIndex: selectedCandidate.iconIndex,
            name,
            rawResponse: JSON.stringify({ recognition: recognitionData, final: finalData })
          };
        }
      } catch (error) {
        onLog(`[警告] 最终比较失败，使用最高置信度结果: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 使用最高置信度结果
    const name = recognitionData.item_name || '未识别名称';
    
    onLog('[成功] 直接视觉识别完成');
    onLog(`[结果] 底色: ${color}`);
    onLog(`[结果] 匹配icon: ${bestCandidate.iconName} (索引${bestCandidate.iconIndex})`);
    onLog(`[结果] 道具名称: ${name}`);
    onLog(`[结果] 置信度: ${bestCandidate.confidence}`);
    onLog(`[结果] 理由: ${bestCandidate.reason}`);

    return {
      success: true,
      color,
      iconIndex: bestCandidate.iconIndex,
      name,
      rawResponse: JSON.stringify({ recognition: recognitionData, matching: bestCandidate })
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    onLog(`[错误] 请求失败: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}
