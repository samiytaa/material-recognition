# Gemini 验证功能提示词设计

本文档用于验证 Gemini API 是否能完成“从游戏截图中的带背景 icon 匹配到解包透明 icon”的关键能力。参考素材目录：

- `参考/icon`: 透明背景游戏 icon，当前 9 张，文件名无业务含义
- `参考/底图`: 合成时使用的背景图，当前 5 张
- `参考/游戏截图`: 游戏内截图，当前 9 张
- `参考/预期合成结果`: 期望合成后的图片，文件名即目标命名格式

## 验证原则

1. 所有提示词都要求 Gemini 只输出 JSON，方便程序自动评分。
2. 验证任务先拆分，再合并：先分别测试区域定位、背景识别、OCR、跨图像匹配，最后做端到端验证。
3. 第 4 项“跨图像匹配”是准入门槛：如果该项不稳定，自动合成流程不应直接全自动化，应改为“AI 推荐 + 人工确认”。
4. 不要求 Gemini 根据文件名推断含义，文件名只能作为候选 ID 返回。

## 推荐输入顺序

调用多图视觉模型时，按以下顺序传入图片：

1. 游戏截图，标记为 `screenshot`
2. 背景候选图，标记为 `background_0...background_n`
3. 透明 icon 候选图，标记为 `icon_0...icon_n`
4. 可选：预期合成结果，仅用于校验阶段，不参与真实生产匹配

程序侧应维护如下候选清单，并在提示词里提供：

```json
{
  "background_candidates": [
    {"id": "background_0", "filename": "道具-金.png"},
    {"id": "background_1", "filename": "道具-咖.png"},
    {"id": "background_2", "filename": "道具-蓝.png"},
    {"id": "background_3", "filename": "道具-绿.png"},
    {"id": "background_4", "filename": "道具-紫.png"}
  ],
  "icon_candidates": [
    {"id": "icon_0", "filename": "icon_s10_zc_jianzhu_081 #71349.png"},
    {"id": "icon_1", "filename": "icon_s10_zc_jianzhu_082 #71072.png"},
    {"id": "icon_2", "filename": "icon_s10_zc_jianzhu_083 #70957.png"},
    {"id": "icon_3", "filename": "icon_s10_zc_jianzhu_091 #16145.png"},
    {"id": "icon_4", "filename": "icon_s10_zc_jianzhu_092 #13143.png"},
    {"id": "icon_5", "filename": "icon_s10_zc_jianzhu_093 #17862.png"},
    {"id": "icon_6", "filename": "icon_s10_zc_jianzhu_101 #4489261.png"},
    {"id": "icon_7", "filename": "icon_s10_zc_jianzhu_102 #4488958.png"},
    {"id": "icon_8", "filename": "icon_s10_zc_jianzhu_103 #4489058.png"}
  ]
}
```

## 提示词 1：截图结构识别

用途：验证区域划分、OCR、背景色初判。只传入 1 张游戏截图。

```text
你是一个严谨的游戏 UI 素材分析器。现在只分析输入的游戏截图。

任务：
1. 找到截图中最主要的物品/建筑 icon 卡片区域。
2. 判断 icon 本体所在区域，不要把名称文字、按钮、边框外的其他 UI 算入 icon。
3. 识别 icon 背后的底图主色。
4. 提取截图中的物品/建筑名称文字，保留中文、间隔点“·”等符号。

重要约束：
- 不要猜测不存在的信息。
- 如果图中有多个相似元素，选择视觉中心最明确、与名称文字关联最强的那个。
- 坐标使用整张截图的像素坐标。若不能精确给出，也要给出近似 bbox。
- 只输出 JSON，不要输出 Markdown，不要解释。

输出 JSON schema：
{
  "has_target": true,
  "icon_bbox": {
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "confidence": 0.0
  },
  "card_bbox": {
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "confidence": 0.0
  },
  "background_color": {
    "name": "金/咖/蓝/绿/紫/未知",
    "visual_description": "",
    "estimated_hex": "",
    "confidence": 0.0
  },
  "ocr_name": {
    "text": "",
    "confidence": 0.0,
    "alternative_texts": []
  },
  "icon_description": {
    "object_type": "建筑/道具/角色/未知",
    "shape_features": [],
    "color_features": [],
    "distinctive_details": []
  },
  "failure_reason": ""
}
```

## 提示词 2：背景候选匹配

用途：验证背景颜色能否映射到预定底图。传入 1 张游戏截图 + 全部底图候选。

```text
你是一个游戏素材背景匹配器。

输入图片顺序：
1. screenshot：游戏截图，里面有一个已经合成了背景的 icon 卡片。
2. background_0...background_n：候选底图图片。

候选底图清单：
{{BACKGROUND_CANDIDATES_JSON}}

任务：
从候选底图中找出 screenshot 里 icon 背景最可能使用的底图。

判断依据：
- 优先比较背景主色、渐变方向、装饰纹理、边框风格。
- 忽略截图中的透明 icon 本体，因为它会遮挡底图。
- 忽略压缩伪影、缩放造成的模糊和 UI 遮挡。
- 如果多个候选颜色接近，给出 top_candidates。

只输出 JSON：
{
  "best_background_id": "background_0",
  "best_background_filename": "",
  "confidence": 0.0,
  "top_candidates": [
    {
      "background_id": "background_0",
      "filename": "",
      "score": 0.0,
      "reason": ""
    }
  ],
  "observed_background": {
    "color_name": "",
    "estimated_hex": "",
    "texture_or_border_notes": ""
  },
  "is_ambiguous": false,
  "ambiguity_reason": ""
}
```

## 提示词 3：透明 icon 跨图像匹配

用途：核心验证。传入 1 张游戏截图 + 全部透明 icon 候选。不要传入预期结果，避免答案泄漏。

```text
你是一个严谨的跨图像 icon 匹配器。你的任务是判断游戏截图中带背景的 icon，与哪一张透明背景候选 icon 是同一个图案。

输入图片顺序：
1. screenshot：游戏内截图，其中目标 icon 已经叠在彩色背景上，可能存在缩放、压缩、阴影、UI 边框或轻微遮挡。
2. icon_0...icon_n：透明背景的解包 icon 候选。

候选 icon 清单：
{{ICON_CANDIDATES_JSON}}

匹配规则：
- 只比较 icon 本体图案，不要把截图中的彩色背景、边框、文字当成 icon 特征。
- 重点比较轮廓、主体结构、内部图案、装饰细节、明暗区域和颜色分布。
- 允许截图中的 icon 比候选图更小、更模糊、有压缩伪影。
- 文件名无业务含义，不能根据文件名猜测。
- 如果截图中的 icon 被背景影响，要在视觉上“剥离背景”后再比较。
- 如果无法可靠判断，不要强行高置信度，仍需给出最可能候选和原因。

请输出严格 JSON：
{
  "best_icon_id": "icon_0",
  "best_icon_filename": "",
  "confidence": 0.0,
  "decision": "accept/review/reject",
  "top_candidates": [
    {
      "icon_id": "icon_0",
      "filename": "",
      "score": 0.0,
      "matching_features": [],
      "mismatching_features": []
    }
  ],
  "screenshot_icon_features": {
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
- reject：confidence < 0.60，说明当前候选集中可能没有匹配项或截图不可判读。
```

## 提示词 4：端到端验证

用途：一次性验证截图能否得到最终合成所需信息。传入 1 张游戏截图 + 全部底图 + 全部 icon。

```text
你是一个游戏 Wiki 图片合成前的素材识别验证器。

输入图片顺序：
1. screenshot：游戏内截图。
2. background_0...background_n：可用于合成的背景图候选。
3. icon_0...icon_n：透明背景 icon 候选。

背景候选清单：
{{BACKGROUND_CANDIDATES_JSON}}

icon 候选清单：
{{ICON_CANDIDATES_JSON}}

目标：
根据 screenshot，识别应该使用哪张透明 icon、哪张背景图，以及最终输出文件名应使用的截图名称文字。

严格要求：
- 不要根据文件名推断答案。
- 输出文件名必须来自 OCR 识别到的截图文字，格式为“名称.png”。
- 如果 OCR 中识别到“寒潭桥·糯雪”这类名称，必须保留中间的“·”。
- 只输出 JSON，不要输出解释。

输出 JSON：
{
  "ocr_name": {
    "text": "",
    "normalized_filename": "",
    "confidence": 0.0,
    "alternative_texts": []
  },
  "background_match": {
    "best_background_id": "",
    "best_background_filename": "",
    "confidence": 0.0,
    "top_candidates": []
  },
  "icon_match": {
    "best_icon_id": "",
    "best_icon_filename": "",
    "confidence": 0.0,
    "decision": "accept/review/reject",
    "top_candidates": []
  },
  "icon_region": {
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "confidence": 0.0
  },
  "overall_decision": "accept/review/reject",
  "blocking_issues": [],
  "reason": ""
}

overall_decision 判定：
- accept：OCR、背景匹配、icon 匹配都达到可自动化阈值。
- review：至少一项需要人工确认，但仍有明确推荐结果。
- reject：无法识别目标、候选集中可能无匹配项，或 OCR 名称不可用。
```

## 提示词 5：带预期结果的离线评分校验

用途：只用于验证 Gemini 能力，不用于生产。传入游戏截图 + Gemini 推荐结果 + 对应预期合成结果，让模型解释差异；程序仍应以文件名和人工标注为准。

```text
你是一个离线验证助手。现在给你：
1. screenshot：游戏内截图。
2. expected_result：人工确认的预期合成结果。
3. model_result_json：上一步模型输出的识别结果。

任务：
比较 expected_result 与 model_result_json 是否一致，指出可能错误来自 OCR、背景匹配、icon 匹配还是区域定位。

只输出 JSON：
{
  "is_consistent": true,
  "error_type": "none/ocr/background/icon/region/multiple/unknown",
  "expected_visual_summary": "",
  "model_result_summary": "",
  "diagnosis": "",
  "recommended_prompt_adjustment": ""
}
```

## 自动评分建议

建议为每张截图维护人工真值表：

```json
{
  "screenshot_filename": "0218a603-c3b4-4906-b24b-2325bdf606e4.png",
  "expected_name": "寒潭桥·糯雪",
  "expected_output_filename": "寒潭桥·糯雪.png",
  "expected_icon_filename": "",
  "expected_background_filename": ""
}
```

评分指标：

- OCR 准确率：`ocr_name.text == expected_name`
- 背景 Top-1 准确率：`best_background_filename == expected_background_filename`
- icon Top-1 准确率：`best_icon_filename == expected_icon_filename`
- icon Top-3 命中率：预期 icon 是否出现在 `top_candidates` 前 3
- 自动化通过率：`overall_decision == accept` 且三项全对
- 人工复核负担：`review` 数量占比

建议准入标准：

- icon Top-1 准确率 >= 90%：可以考虑全自动合成，但保留日志。
- icon Top-3 命中率 >= 95%，Top-1 不足 90%：适合做“AI 推荐 + 人工点选确认”。
- icon Top-1 < 80%：不建议依赖 Gemini 直接匹配，应增加传统图像相似度预筛选或人工映射表。

## 失败重试策略

当 `decision` 为 `review` 或 `reject` 时，可使用二次提示词，只传截图和 top 3 候选，要求模型做更细粒度比较：

```text
你刚才无法高置信度判断截图 icon 与候选 icon 的匹配。现在只给你最接近的 3 个候选，请重新比较。

输入图片顺序：
1. screenshot
2. candidate_0
3. candidate_1
4. candidate_2

请只关注 icon 本体，不关注背景和文字。逐项比较：
- 外轮廓是否一致
- 主体建筑/道具结构是否一致
- 高亮区域、阴影区域是否一致
- 小装饰物、开口、边角形状是否一致

只输出 JSON：
{
  "best_candidate_index": 0,
  "confidence": 0.0,
  "accept_or_review": "accept/review",
  "feature_comparison": [
    {
      "candidate_index": 0,
      "same_features": [],
      "different_features": [],
      "score": 0.0
    }
  ],
  "final_reason": ""
}
```

## 当前 HTML 工具中的提示词替换建议

现有工具中“完整识别”的提示词可替换为“提示词 1”。“匹配功能”的提示词可替换为“提示词 3”。

同时建议修改匹配输出字段：

- 由 `best_match_index` 改为 `best_icon_id` 和 `best_icon_filename`
- 增加 `top_candidates`
- 增加 `decision`
- 增加 `confidence` 数值，而不是“高/中/低”

这样后续可以直接批量统计准确率，不需要再解析自然语言。
