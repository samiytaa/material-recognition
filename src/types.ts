import parseConfig from './parseConfig.json';
import categoryConfig from './categoryConfig.json';
import ownershipRulesConfig from './categoryOwnershipRules.json';

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

// 归属规则配置
const OWNERSHIP_RULES = ownershipRulesConfig.categoryOwnershipRules as Record<string, any>;

// ─── 类型定义 ────────────────────────────────────────────────

export type OwnershipType = 'male_lead' | 'spy' | 'none';

export interface OwnershipInfo {
  type: OwnershipType;
  name: string | null;
  code: string | null;
}

export interface FurnitureDetails {
  scene: 'indoor' | 'outdoor' | 'background';
  isFloor: boolean;
  isGrowthProp: boolean;
  isSuit: boolean;
}

export interface Classification {
  type: 'furniture' | 'other';
  category: string;
  categoryPath: string[];
  furnitureDetails?: FurnitureDetails;
}

export interface PropItem {
  name: string;
  displayName: string;
  image: string | null;
  classification: Classification;
  ownership: OwnershipInfo;
  
  // 为了兼容旧代码，保留这些字段
  type: 'furniture' | 'other';
  category: string;
  categoryPath: string[];
  maleLead: string | null;
  isGrowthProp: boolean;
  isFloor: boolean;
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
 * 例：icon_sc_hy_5033 → { name: '孙策', code: 'sc' }
 */
function detectMaleLead(segments: string[]): { name: string; code: string } | null {
  for (const seg of segments) {
    if (MALE_LEADS[seg]) return { name: MALE_LEADS[seg], code: seg };
  }
  return null;
}

/**
 * 按分段查密探映射，支持：
 *  - 单段：sunfu → 孙辅
 *  - 双段拼合：achan + huanfu-1 → achan_huanfu-1 → 阿蝉·雾绡
 *  - MV_ 前缀：MV_chendeng → 陈登·黍王
 */
function detectSpyName(segments: string[]): { name: string; code: string } | null {
  // 双段拼合（含连字符后缀，如 huanfu-1）
  for (let i = 0; i < segments.length - 1; i++) {
    const key = `${segments[i]}_${segments[i + 1]}`;
    if (SPY_NAMES[key]) return { name: SPY_NAMES[key], code: key };
  }
  // 单段
  for (const seg of segments) {
    if (SPY_NAMES[seg]) return { name: SPY_NAMES[seg], code: seg };
    // MV_ 前缀变体（文件名中 MV 段独立出现）
    if (SPY_NAMES[`MV_${seg}`]) return { name: SPY_NAMES[`MV_${seg}`], code: `MV_${seg}` };
  }
  return null;
}

/**
 * 根据分类和上下文识别归属信息
 */
function identifyOwnership(
  cleanName: string,
  segments: string[],
  category: string,
  extractContext?: any
): OwnershipInfo {
  const rule = OWNERSHIP_RULES[category];
  
  if (!rule) {
    // 无规则，尝试通用检测
    const maleLead = detectMaleLead(segments);
    const spy = detectSpyName(segments);
    if (maleLead) return { type: 'male_lead', name: maleLead.name, code: maleLead.code };
    if (spy) return { type: 'spy', name: spy.name, code: spy.code };
    return { type: 'none', name: null, code: null };
  }
  
  const { defaultOwnership, extractFrom, allowNone } = rule;
  
  // none 类型直接返回
  if (defaultOwnership === 'none') {
    return { type: 'none', name: null, code: null };
  }
  
  // 根据提取方式识别
  switch (extractFrom) {
    case 'segments': {
      // 从文件名段中提取
      if (defaultOwnership === 'male_lead') {
        const maleLead = detectMaleLead(segments);
        if (maleLead) return { type: 'male_lead', name: maleLead.name, code: maleLead.code };
        return allowNone ? { type: 'none', name: null, code: null } : { type: 'male_lead', name: null, code: null };
      } else if (defaultOwnership === 'spy') {
        const spy = detectSpyName(segments);
        if (spy) return { type: 'spy', name: spy.name, code: spy.code };
        return allowNone ? { type: 'none', name: null, code: null } : { type: 'spy', name: null, code: null };
      } else if (defaultOwnership === 'mixed') {
        // 混合类型，优先男主，次之密探
        const maleLead = detectMaleLead(segments);
        if (maleLead) return { type: 'male_lead', name: maleLead.name, code: maleLead.code };
        const spy = detectSpyName(segments);
        if (spy) return { type: 'spy', name: spy.name, code: spy.code };
        return { type: 'none', name: null, code: null };
      }
      break;
    }
    
    case 'ccl_code': {
      // 从 ccl 编码提取男主
      if (extractContext?.cclCode) {
        const leadNum = extractContext.cclCode[0];
        const LEAD_NUM: Record<string, { name: string; code: string }> = {
          '1': { name: '刘辩', code: 'lb' },
          '2': { name: '傅融', code: 'fr' },
          '3': { name: '袁基', code: 'yj' },
          '4': { name: '左慈', code: 'zc' },
          '5': { name: '孙策', code: 'sc' }
        };
        const lead = LEAD_NUM[leadNum];
        if (lead) return { type: 'male_lead', name: lead.name, code: lead.code };
      }
      break;
    }
    
    case 'component_code': {
      // 从 component 编码提取男主
      if (extractContext?.componentCode) {
        const leadNum = extractContext.componentCode[0];
        const LEAD_NUM: Record<string, { name: string; code: string }> = {
          '1': { name: '刘辩', code: 'lb' },
          '2': { name: '傅融', code: 'fr' },
          '3': { name: '袁基', code: 'yj' },
          '4': { name: '左慈', code: 'zc' },
          '5': { name: '孙策', code: 'sc' }
        };
        const lead = LEAD_NUM[leadNum];
        if (lead) return { type: 'male_lead', name: lead.name, code: lead.code };
      }
      break;
    }
    
    case 'furniture_segment': {
      // 从家具格式中提取男主（icon_s数字_[fd_]<男主/all>_<分类码>_<编号>）
      if (extractContext?.leadOrAll && extractContext.leadOrAll !== 'all') {
        const code = extractContext.leadOrAll;
        const name = MALE_LEADS[code];
        if (name) return { type: 'male_lead', name, code };
      }
      return { type: 'none', name: null, code: null };
    }
    
    case 'avatar_pinyin': {
      // 从头像拼音提取密探名
      if (extractContext?.pinyin) {
        const spy = SPY_NAMES[extractContext.pinyin];
        if (spy) return { type: 'spy', name: spy, code: extractContext.pinyin };
        return { type: 'spy', name: extractContext.pinyin, code: extractContext.pinyin };
      }
      break;
    }
  }
  
  // 兜底
  return { type: 'none', name: null, code: null };
}

// ─── 统一返回结构 ────────────────────────────────────────────
function makeResult(
  fileName: string,
  displayName: string,
  category: string,
  type: 'furniture' | 'other' = 'other',
  ownership: OwnershipInfo = { type: 'none', name: null, code: null },
  furnitureDetails?: FurnitureDetails
): PropItem {
  const categoryPath = getCategoryPath(category);
  
  const classification: Classification = {
    type,
    category,
    categoryPath,
    furnitureDetails
  };
  
  return {
    name: fileName,
    displayName,
    image: null,
    classification,
    ownership,
    // 兼容字段
    type,
    category,
    categoryPath,
    maleLead: ownership.type === 'male_lead' ? ownership.name : null,
    isGrowthProp: furnitureDetails?.isGrowthProp ?? false,
    isFloor: furnitureDetails?.isFloor ?? false
  };
}

// ─── 主解析函数 ──────────────────────────────────────────────
export function parseFileName(fileName: string): PropItem {
  // 去掉 .png 后缀和尾部 #数字 标签
  const cleanName = fileName
    .replace(/\.png$/i, '')
    .replace(/\s*#\d+$/, '')
    .trim();

  // 预切段，供所有分支共用（性能 + 统一性）
  const segments = cleanName.split('_');

  // ── 1. 非 icon 开头（含纯中文名等） ────────────────────────
  if (!cleanName.startsWith('icon') && !cleanName.startsWith('cjr_')) {
    const ownership = identifyOwnership(cleanName, segments, '其他');
    const displayName = ownership.name ? `${ownership.name}-${cleanName}` : cleanName;
    return makeResult(fileName, displayName, '其他', 'other', ownership);
  }

  // ── 2. cjr_ 开头的初见日道具（无 icon 前缀） ───────────────
  if (cleanName.startsWith('cjr_')) {
    const ownership = identifyOwnership(cleanName, segments, '初见日道具');
    const displayName = ownership.name ? `${ownership.name}-初见日道具` : '初见日道具';
    return makeResult(fileName, displayName, '初见日道具', 'other', ownership);
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
    const ownership = identifyOwnership(cleanName, segments, avatarType, { pinyin });
    const spyName = ownership.name ?? pinyin;

    let displayName = `${avatarType}-${spyName}`;
    if (isRed)           displayName += '-红';
    if (levelMap[level]) displayName += `(${levelMap[level]})`;

    return makeResult(fileName, displayName, avatarType, 'other', ownership);
  }

  // ── 4. 普通密探头像：icon_<拼音>_s ─────────────────────────
  if (cleanName.match(/_s$/)) {
    let spyName: string | null = null;
    let spyCode: string | null = null;
    
    for (let len = segments.length - 2; len >= 1; len--) {
      for (let start = 1; start + len <= segments.length - 1; start++) {
        const key = segments.slice(start, start + len).join('_');
        if (SPY_NAMES[key]) { 
          spyName = SPY_NAMES[key];
          spyCode = key;
          break; 
        }
      }
      if (spyName) break;
    }
    
    const ownership: OwnershipInfo = spyName 
      ? { type: 'spy', name: spyName, code: spyCode }
      : { type: 'spy', name: null, code: null };
    
    return makeResult(
      fileName,
      spyName ? `密探头像-${spyName}` : '密探头像',
      '密探头像',
      'other',
      ownership
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
      
      // 确定场景类型
      let scene: 'indoor' | 'outdoor' | 'background' = 'indoor';
      if (OUTDOOR_CATEGORIES[categoryCode]) scene = 'outdoor';
      
      const ownership = identifyOwnership(cleanName, segments, cat, { leadOrAll });
      
      let displayName: string;
      if (isFd && ownership.name)    displayName = `初见日-${ownership.name}-${cat}`;
      else if (isFd)                 displayName = `初见日-${cat}`;
      else if (ownership.name)       displayName = `${ownership.name}-${cat}`;
      else                           displayName = cat;

      const furnitureDetails: FurnitureDetails = {
        scene,
        isFloor,
        isGrowthProp: isFd,
        isSuit: false
      };

      return makeResult(fileName, displayName, cat, 'furniture', ownership, furnitureDetails);
    }
  }

  // ── 6. 套装家具 ────────────────────────────────────────────
  if (cleanName.includes('_xzrhw_')) {
    const furnitureDetails: FurnitureDetails = {
      scene: 'outdoor',
      isFloor: false,
      isGrowthProp: false,
      isSuit: true
    };
    return makeResult(
      fileName, 
      '套装-户外', 
      '户外', 
      'furniture', 
      { type: 'none', name: null, code: null },
      furnitureDetails
    );
  }

  // 户内套装：含 _xzr_ 且不跟具体自由装修分类码
  const FURNITURE_CODES = /_(qiju|zhiwu|zhuangshi|guajian|qiangzhi|diban|outdoor_diban|jianzhu|jingguan|chenshe)(_|$)/;
  if (cleanName.includes('_xzr_') && !FURNITURE_CODES.test(cleanName)) {
    const furnitureDetails: FurnitureDetails = {
      scene: 'indoor',
      isFloor: false,
      isGrowthProp: false,
      isSuit: true
    };
    return makeResult(
      fileName, 
      '套装-户内', 
      '户内', 
      'furniture',
      { type: 'none', name: null, code: null },
      furnitureDetails
    );
  }

  // 衬景（天空/地貌/筑台，统一归衬景）
  if (cleanName.startsWith('icon_xzr')) {
    const furnitureDetails: FurnitureDetails = {
      scene: 'background',
      isFloor: false,
      isGrowthProp: false,
      isSuit: false
    };
    return makeResult(
      fileName, 
      '衬景', 
      '衬景', 
      'furniture',
      { type: 'none', name: null, code: null },
      furnitureDetails
    );
  }

  // ── 7. _cjr_ 初见日道具（带 icon 前缀） ────────────────────
  if (cleanName.includes('_cjr_') || /_cjr\d+_/.test(cleanName)) {
    const ownership = identifyOwnership(cleanName, segments, '初见日道具');
    const displayName = ownership.name ? `${ownership.name}-初见日道具` : '初见日道具';
    return makeResult(fileName, displayName, '初见日道具', 'other', ownership);
  }

  // ── 8. _ccl_ 男主互动道具 ──────────────────────────────────
  //    格式：icon_ccl_<数字4位>，第1位=男主序号
  const cclMatch = cleanName.match(/_ccl_(\d{4})/);
  if (cclMatch) {
    const cclCode = cclMatch[1];
    const ownership = identifyOwnership(cleanName, segments, '男主互动道具', { cclCode });
    const displayName = ownership.name ? `${ownership.name}-互动道具` : '互动道具';
    return makeResult(fileName, displayName, '男主互动道具', 'other', ownership);
  }

  // ── 9. _component_ 男主装饰 ────────────────────────────────
  //    格式：icon_component_<数字5位>，第1位=男主，第2位=套系
  const compMatch = cleanName.match(/_component_(\d{5})/);
  if (compMatch) {
    const componentCode = compMatch[1];
    const ownership = identifyOwnership(cleanName, segments, '男主装饰', { componentCode });
    
    const BATCH: Record<string, string> = { '1':'夕情欢馀','2':'春月柳','3':'燕歌行' };
    const batch = BATCH[componentCode[1]] ?? '';
    
    const displayName = ownership.name && batch 
      ? `${ownership.name}-${batch}` 
      : ownership.name 
        ? `${ownership.name}-装饰` 
        : '装饰';
    
    return makeResult(fileName, displayName, '男主装饰', 'other', ownership);
  }

  // ── 10. 礼包（lb 段，排除家具格式和男主名缩写冲突） ─────────
  if (
    (cleanName.includes('_lb_') || cleanName.endsWith('_lb')) &&
    !cleanName.match(/^icon_s\d+_/)
  ) {
    const ownership = identifyOwnership(cleanName, segments, '礼包');
    const displayName = ownership.name ? `${ownership.name}-礼包` : '礼包';
    return makeResult(fileName, displayName, '礼包', 'other', ownership);
  }

  // ── 11. 其他道具分类（关键字段匹配） ───────────────────────
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
    // 密探相关
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
  const isMtGeneric = cleanName.includes('_mt_') && !MT_EXCEPTIONS.test(cleanName);

  // 男主元素（_nz_ 但非上面已覆盖的 nz_* 分支）
  const NZ_EXCEPTIONS = /_(nz_cjhd|nz_shadow_cjhd|nz_skin|nz_xzrdz|nz_xzrpf|nzbg)(_|$)/;
  const isNzGeneric = cleanName.includes('_nz_') && !NZ_EXCEPTIONS.test(cleanName);

  for (const [token, catName] of TOKEN_CATS) {
    const hasToken = cleanName.includes(`_${token}_`) || cleanName.endsWith(`_${token}`);
    if (!hasToken) continue;

    const ownership = identifyOwnership(cleanName, segments, catName);
    const displayName = ownership.name ? `${ownership.name}-${catName}` : catName;
    return makeResult(fileName, displayName, catName, 'other', ownership);
  }

  // 自选密探泛匹配
  if (isMtGeneric) {
    const ownership = identifyOwnership(cleanName, segments, '自选密探');
    const displayName = ownership.name ? `${ownership.name}-自选密探` : '自选密探';
    return makeResult(fileName, displayName, '自选密探', 'other', ownership);
  }

  // 男主元素泛匹配
  if (isNzGeneric) {
    const ownership = identifyOwnership(cleanName, segments, '男主元素');
    const displayName = ownership.name ? `${ownership.name}-男主元素` : '男主元素';
    return makeResult(fileName, displayName, '男主元素', 'other', ownership);
  }

  // ── 12. 兜底 ────────────────────────────────────────────────
  const ownership = identifyOwnership(cleanName, segments, '其他');
  const displayName = ownership.name ? `${ownership.name}-${cleanName}` : cleanName;
  return makeResult(fileName, displayName, '其他', 'other', ownership);
}
