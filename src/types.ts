import parseConfig from './parseConfig.json';
import categoryConfig from './categoryConfig.json';

// ─── 动态规则加载 ────────────────────────────────────────────

/**
 * 从 localStorage 加载自定义规则，如无则使用默认配置
 */
function loadRules() {
  const saved = localStorage.getItem('customRulesData');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        maleLeads: Object.fromEntries(parsed.maleLeads?.map((e: any) => [e.key, e.value]) || []),
        spyNames: Object.fromEntries(parsed.spyNames?.map((e: any) => [e.key, e.value]) || []),
        outdoorCats: Object.fromEntries(parsed.outdoorCats?.map((e: any) => [e.key, e.value]) || []),
        indoorCats: Object.fromEntries(parsed.indoorCats?.map((e: any) => [e.key, e.value]) || []),
        floorCats: Object.fromEntries(parsed.floorCats?.map((e: any) => [e.key, e.value]) || []),
      };
    } catch (e) {
      console.error('加载自定义规则失败，使用默认规则:', e);
    }
  }
  
  // 默认使用 parseConfig.json
  return {
    maleLeads: parseConfig['男主映射'],
    spyNames: parseConfig['密探名映射'],
    outdoorCats: parseConfig['户外分类'],
    indoorCats: parseConfig['户内分类'],
    floorCats: parseConfig['地板分类'],
  };
}

// 初始化时加载一次规则
let RULES = loadRules();

// 提供重新加载函数，供外部调用（例如规则更新后）
export function reloadRules() {
  RULES = loadRules();
}

export const MALE_LEADS: Record<string, string> = RULES.maleLeads;
export const OUTDOOR_CATEGORIES: Record<string, string> = RULES.outdoorCats;
export const INDOOR_CATEGORIES: Record<string, string> = RULES.indoorCats;
export const FLOOR_CATEGORIES: Record<string, string> = RULES.floorCats;
export const SPY_NAMES: Record<string, string> = RULES.spyNames;

export const CATEGORIES: Record<string, string> = {
  ...OUTDOOR_CATEGORIES,
  ...INDOOR_CATEGORIES,
  ...FLOOR_CATEGORIES,
};

// ─── 类型定义 ────────────────────────────────────────────────

export interface PropItem {
  name: string;
  displayName: string;
  type: 'furniture' | 'other';
  category: string;
  maleLead: string | null;
  isGrowthProp: boolean;
  isFloor: boolean;
  image: string | null;
  categoryPath?: string[];
}

export interface RecordRow {
  id: number;
  originalImage: string | null;
  screenshot: string | null;
  propName: string;
  baseColor: string;
  category: string;
  previewWithBase: string | null;
  outputName: string;
}

// ─── 分类路径和名称处理 ──────────────────────────────────────

// 家具分类码 → 中文名（地面/水面统一为"地面"）
export function normalizeCategoryName(category: string): string {
  return category === '地面/水面' ? '地面' : category;
}

// ─── 分类路径查找 ───────────────────────────────────────────
export function getCategoryPath(categoryName: string): string[] {
  const config = categoryConfig as any;

  const nonFurniture = config['除家具以外的道具'];
  if (nonFurniture) {
    for (const [mainCat, items] of Object.entries(nonFurniture)) {
      if (Array.isArray(items) && items.includes(categoryName)) {
        return ['除家具以外的道具', mainCat, categoryName];
      }
    }
  }

  const furniture = config['家具'];
  if (furniture) {
    if (Array.isArray(furniture['套装']) && furniture['套装'].includes(categoryName)) {
      return ['家具', '套装', categoryName];
    }
    const free = furniture['自由装修'];
    if (free) {
      if (categoryName === '衬景') return ['家具', '自由装修', '衬景'];
      for (const [subCat, items] of Object.entries(free)) {
        if (Array.isArray(items) && items.includes(categoryName)) {
          return ['家具', '自由装修', subCat, categoryName];
        }
      }
    }
  }

  return ['其他', categoryName];
}

// ─── 人名检测辅助 ────────────────────────────────────────────

/**
 * 按 `_` 切段精确查男主映射，避免子串误匹配。
 * 例：icon_sc_hy_5033 → 孙策；icon_hy_3037 → null
 */
function detectMaleLead(segments: string[]): string | null {
  for (const seg of segments) {
    if (MALE_LEADS[seg]) return MALE_LEADS[seg];
  }
  return null;
}

/**
 * 按分段查密探映射，支持：
 *  - 单段：sunfu → 孙辅
 *  - 双段拼合：achan + huanfu-1 → achan_huanfu-1 → 阿蝉·雾绡
 *  - MV_ 前缀：MV_chendeng → 陈登·黍王
 */
function detectSpyName(segments: string[]): string | null {
  // 双段拼合（含连字符后缀，如 huanfu-1）
  for (let i = 0; i < segments.length - 1; i++) {
    const key = `${segments[i]}_${segments[i + 1]}`;
    if (SPY_NAMES[key]) return SPY_NAMES[key];
  }
  // 单段
  for (const seg of segments) {
    if (SPY_NAMES[seg]) return SPY_NAMES[seg];
    // MV_ 前缀变体（文件名中 MV 段独立出现）
    if (SPY_NAMES[`MV_${seg}`]) return SPY_NAMES[`MV_${seg}`];
  }
  return null;
}

// ─── 统一返回结构 ────────────────────────────────────────────
function makeResult(
  fileName: string,
  displayName: string,
  category: string,
  type: 'furniture' | 'other' = 'other',
  maleLead: string | null = null,
  isGrowthProp = false,
  isFloor = false,
  categoryPath?: string[]
) {
  return {
    originalName: fileName,
    displayName,
    type,
    category,
    maleLead,
    isGrowthProp,
    isFloor,
    categoryPath: categoryPath ?? getCategoryPath(category),
  };
}

// ─── 主解析函数 ──────────────────────────────────────────────
export function parseFileName(fileName: string) {
  // 去掉 .png 后缀和尾部 #数字 标签
  const cleanName = fileName
    .replace(/\.png$/i, '')
    .replace(/\s*#\d+$/, '')
    .trim();

  // 预切段，供所有分支共用（性能 + 统一性）
  const segments = cleanName.split('_');

  // 全局预检：优先提取男主 / 密探名
  const globalMaleLead = detectMaleLead(segments);
  const globalSpyName  = detectSpyName(segments);

  // ── 1. 非 icon 开头（含纯中文名等） ────────────────────────
  if (!cleanName.startsWith('icon') && !cleanName.startsWith('cjr_')) {
    const person = globalMaleLead || globalSpyName;
    return makeResult(
      fileName,
      person ? `${person}-${cleanName}` : cleanName,
      '其他',
      'other',
      globalMaleLead,
    );
  }

  // ── 2. cjr_ 开头的初见日道具（无 icon 前缀） ───────────────
  if (cleanName.startsWith('cjr_')) {
    const lead = globalMaleLead;
    return makeResult(
      fileName,
      lead ? `${lead}-初见日道具` : '初见日道具',
      '初见日道具',
      'other',
      lead,
    );
  }

  // ── 3. 密探/绒绒头像：icon2_ / icon3_ / icon_cat_ / icon_dog_ / icon_animal_ ─
  //    格式：<prefix>_<拼音>[_red]_<l|m|s|ss>
  const spyAvatarMatch = cleanName.match(
    /^(icon[23]|icon_cat|icon_dog|icon_animal)_(.+?)(?:_(red))?_(ss|[lms])$/
  );
  if (spyAvatarMatch) {
    const prefix   = spyAvatarMatch[1];
    const pinyin   = spyAvatarMatch[2];
    const isRed    = spyAvatarMatch[3] === 'red';
    const level    = spyAvatarMatch[4];
    const levelMap: Record<string, string> = { l: '大', m: '中', s: '小', ss: '超小' };

    const avatarTypeMap: Record<string, string> = {
      'icon2':       '魂魂头像',
      'icon3':       'QQ人头像',
      'icon_cat':    '猫绒绒',
      'icon_dog':    '狗绒绒',
      'icon_animal': '特殊绒绒',
    };
    const avatarType = avatarTypeMap[prefix] ?? '密探头像';
    const spyName    = SPY_NAMES[pinyin] ?? pinyin;

    let displayName = `${avatarType}-${spyName}`;
    if (isRed)           displayName += '-红';
    if (levelMap[level]) displayName += `(${levelMap[level]})`;

    return makeResult(fileName, displayName, avatarType);
  }

  // ── 4. 普通密探头像：icon_<拼音>_s ─────────────────────────
  //    注意：必须在上面的 spyAvatarMatch 之后，避免被 icon_cat/dog 等误入
  if (cleanName.match(/_s$/)) {
    // 从倒数第二段往前逐步拼合，找到最长匹配的密探拼音
    // segments 末尾是 's'，倒数第二段开始向前查
    let spyName: string | null = null;
    for (let len = segments.length - 2; len >= 1; len--) {
      // 从 index 1（跳过 'icon' 段）开始，尝试长度为 len 的窗口
      for (let start = 1; start + len <= segments.length - 1; start++) {
        const key = segments.slice(start, start + len).join('_');
        if (SPY_NAMES[key]) { spyName = SPY_NAMES[key]; break; }
      }
      if (spyName) break;
    }
    return makeResult(
      fileName,
      spyName ? `密探头像-${spyName}` : '密探头像',
      '密探头像',
    );
  }

  // ── 5. 家具：icon_s<数字>_[fd_]<男主/all>_<分类码>_<编号> ──
  const furnitureMatch = cleanName.match(
    /^icon_s(\d+)_(?:(fd)_)?([a-z]+)_([a-z_]+?)_(\d+)$/
  );
  if (furnitureMatch) {
    const isFd        = furnitureMatch[2] === 'fd';
    const leadOrAll   = furnitureMatch[3];
    const categoryCode = furnitureMatch[4];

    if (CATEGORIES[categoryCode]) {
      const cat      = normalizeCategoryName(CATEGORIES[categoryCode]);
      const isFloor  = !!FLOOR_CATEGORIES[categoryCode];
      const lead     = leadOrAll !== 'all' ? (MALE_LEADS[leadOrAll] ?? null) : null;
      let displayName: string;
      if (isFd && lead)    displayName = `初见日-${lead}-${cat}`;
      else if (isFd)       displayName = `初见日-${cat}`;
      else if (lead)       displayName = `${lead}-${cat}`;
      else                 displayName = cat;

      return makeResult(fileName, displayName, cat, 'furniture', lead, isFd, isFloor);
    }
  }

  // ── 6. 套装家具 ────────────────────────────────────────────
  if (cleanName.includes('_xzrhw_')) {
    return makeResult(fileName, '套装-户外', '户外', 'furniture', null, false, false,
      ['家具', '套装', '户外']);
  }

  // 户内套装：含 _xzr_ 且不跟具体自由装修分类码
  const FURNITURE_CODES = /_(qiju|zhiwu|zhuangshi|guajian|qiangzhi|diban|outdoor_diban|jianzhu|jingguan|chenshe)(_|$)/;
  if (cleanName.includes('_xzr_') && !FURNITURE_CODES.test(cleanName)) {
    return makeResult(fileName, '套装-户内', '户内', 'furniture', null, false, false,
      ['家具', '套装', '户内']);
  }

  // 衬景（天空/地貌/筑台，统一归衬景）
  if (cleanName.startsWith('icon_xzr')) {
    return makeResult(fileName, '衬景', '衬景', 'furniture', null, false, false,
      ['家具', '自由装修', '衬景']);
  }

  // ── 7. _cjr_ 初见日道具（带 icon 前缀） ────────────────────
  if (cleanName.includes('_cjr_') || /_cjr\d+_/.test(cleanName)) {
    const lead = globalMaleLead;
    return makeResult(
      fileName,
      lead ? `${lead}-初见日道具` : '初见日道具',
      '初见日道具',
      'other',
      lead,
    );
  }

  // ── 8. _ccl_ 男主互动道具 ──────────────────────────────────
  //    格式：icon_ccl_<数字4位>，第1位=男主序号
  const cclMatch = cleanName.match(/_ccl_(\d{4})/);
  if (cclMatch) {
    const leadNum  = cclMatch[1][0];
    const LEAD_NUM: Record<string, string> = { '1':'刘辩','2':'傅融','3':'袁基','4':'左慈','5':'孙策' };
    const lead     = LEAD_NUM[leadNum] ?? globalMaleLead ?? '未知';
    return makeResult(fileName, `${lead}-互动道具`, '男主互动道具', 'other', lead);
  }

  // ── 9. _component_ 男主装饰 ────────────────────────────────
  //    格式：icon_component_<数字5位>，第1位=男主，第2位=套系
  const compMatch = cleanName.match(/_component_(\d{5})/);
  if (compMatch) {
    const code      = compMatch[1];
    const LEAD_NUM: Record<string, string> = { '1':'刘辩','2':'傅融','3':'袁基','4':'左慈','5':'孙策' };
    const BATCH:    Record<string, string> = { '1':'夕情欢馀','2':'春月柳','3':'燕歌行' };
    const lead      = LEAD_NUM[code[0]] ?? globalMaleLead ?? '未知';
    const batch     = BATCH[code[1]] ?? '';
    return makeResult(
      fileName,
      batch ? `${lead}-${batch}` : `${lead}-装饰`,
      '男主装饰',
      'other',
      lead,
    );
  }

  // ── 10. 礼包（lb 段，排除家具格式和男主名缩写冲突） ─────────
  //     lb 既是"刘辩"缩写也是礼包码，家具格式已在步骤5处理，此处只匹配非家具
  if (
    (cleanName.includes('_lb_') || cleanName.endsWith('_lb')) &&
    !cleanName.match(/^icon_s\d+_/)
  ) {
    // 如果文件名中有其他男主/密探线索则附加，否则纯"礼包"
    const person = globalSpyName ?? null;
    return makeResult(
      fileName,
      person ? `${person}-礼包` : '礼包',
      '礼包',
      'other',
      null,
    );
  }

  // ── 11. 其他道具分类（关键字段匹配） ───────────────────────
  //    按优先级排列，长 key 放前（避免 txk 比 txk2 先匹配）
  const TOKEN_CATS: Array<[string, string]> = [
    ['txk2',          '自定义头像框'],
    ['txk',           '头像框'],
    ['yxbj',          '主界面背景'],
    ['bgm',           '主界面音乐'],
    ['fudie',         '符牒'],
    ['lyx',           '留音匣'],
    ['mxp',           '日志'],
    ['xzrdz',         '家具道具'],
    ['xrxj',          '笺匣'],
    ['hd',            '活动'],
    // 密探相关（含复合 key，长 key 优先）
    ['mt_shadow_cjhd','言事章影子'],
    ['mt_cjhd',       '言事章'],
    ['mt_skin',       '密探皮肤'],
    ['mtwq',          '密探温泉'],
    ['mc',            '密探礼物'],
    ['sp',            '心纸'],
    // 男主相关
    ['nz_shadow_cjhd','男主言事章影子'],
    ['nz_cjhd',       '男主言事章'],
    ['nz_skin',       '男主皮肤'],
    ['nz_xzrdz',      '男主心纸君动作'],
    ['nz_xzrpf',      '男主心纸君皮肤'],
    ['nzbg',          '男主背景'],
    // 回忆 / 吉光片羽
    ['hy',            '男主回忆'],
    ['jsln',          '吉光片羽'],
    // 活动系列
    ['hhst2',         '魂生一串系列2'],
    ['hhst',          '魂生一串系列'],
    ['qxhd',          '七夕活动'],
    ['rouge',         '肉鸽'],
    ['ydzz',          '躬耕南阳'],
    ['yuandan',       '海岛漂流'],
    ['yzn',           '一周年'],
    ['bzn',           '半周年'],
  ];

  // 自选密探（_mt_ 但非上面已覆盖的 mt_* 分支）
  const MT_EXCEPTIONS = /_(mt_cjhd|mt_shadow_cjhd|mt_skin|mtwq)(_|$)/;
  const isMtGeneric =
    cleanName.includes('_mt_') && !MT_EXCEPTIONS.test(cleanName);

  // 男主元素（_nz_ 但非上面已覆盖的 nz_* 分支）
  const NZ_EXCEPTIONS = /_(nz_cjhd|nz_shadow_cjhd|nz_skin|nz_xzrdz|nz_xzrpf|nzbg)(_|$)/;
  const isNzGeneric =
    cleanName.includes('_nz_') && !NZ_EXCEPTIONS.test(cleanName);

  for (const [token, catName] of TOKEN_CATS) {
    const hasToken =
      cleanName.includes(`_${token}_`) ||
      cleanName.endsWith(`_${token}`);
    if (!hasToken) continue;

    // 根据分类决定附加男主还是密探名
    const isMtCat = ['密探礼物','心纸','言事章','言事章影子','密探皮肤','密探温泉'].includes(catName);
    const isNzCat = ['男主言事章','男主言事章影子','男主皮肤','男主心纸君动作',
                     '男主心纸君皮肤','男主背景','男主回忆','吉光片羽'].includes(catName);
    const isActCat = ['魂生一串系列','魂生一串系列2','七夕活动','肉鸽',
                      '躬耕南阳','海岛漂流','一周年','半周年'].includes(catName);

    let person: string | null = null;
    let lead: string | null   = null;
    if (isMtCat) {
      person = globalSpyName;
    } else if (isNzCat) {
      person = globalMaleLead;
      lead   = globalMaleLead;
    } else if (isActCat) {
      person = globalMaleLead ?? globalSpyName;
      lead   = globalMaleLead;
    } else {
      person = globalMaleLead ?? globalSpyName;
      lead   = globalMaleLead;
    }

    return makeResult(
      fileName,
      person ? `${person}-${catName}` : catName,
      catName,
      'other',
      lead,
    );
  }

  // 自选密探泛匹配
  if (isMtGeneric) {
    return makeResult(
      fileName,
      globalSpyName ? `${globalSpyName}-自选密探` : '自选密探',
      '自选密探',
    );
  }

  // 男主元素泛匹配
  if (isNzGeneric) {
    return makeResult(
      fileName,
      globalMaleLead ? `${globalMaleLead}-男主元素` : '男主元素',
      '男主元素',
      'other',
      globalMaleLead,
    );
  }

  // ── 12. 兜底 ────────────────────────────────────────────────
  const person = globalMaleLead ?? globalSpyName;
  return makeResult(
    fileName,
    person ? `${person}-${cleanName}` : cleanName,
    '其他',
    'other',
    globalMaleLead,
  );
}
