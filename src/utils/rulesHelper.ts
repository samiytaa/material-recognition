import parseConfig from '../parseConfig.json';

/**
 * 规则数据接口
 */
export interface RulesData {
  '男主映射': Record<string, string>;
  '密探名映射': Record<string, string>;
  '户外分类': Record<string, string>;
  '户内分类': Record<string, string>;
  '地板分类': Record<string, string>;
}

/**
 * 获取当前生效的规则配置
 * 优先从 localStorage 读取用户自定义规则，如果没有则使用默认配置
 */
export function getCurrentRules(): RulesData {
  try {
    const saved = localStorage.getItem('customRulesData');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // 转换回配置格式
      return {
        '男主映射': Object.fromEntries(parsed.maleLeads.map((e: { key: string; value: string }) => [e.key, e.value])),
        '密探名映射': Object.fromEntries(parsed.spyNames.map((e: { key: string; value: string }) => [e.key, e.value])),
        '户外分类': Object.fromEntries(parsed.outdoorCats.map((e: { key: string; value: string }) => [e.key, e.value])),
        '户内分类': Object.fromEntries(parsed.indoorCats.map((e: { key: string; value: string }) => [e.key, e.value])),
        '地板分类': Object.fromEntries(parsed.floorCats.map((e: { key: string; value: string }) => [e.key, e.value])),
      };
    }
  } catch (error) {
    console.error('读取自定义规则失败，使用默认配置:', error);
  }
  
  // 返回默认配置
  return parseConfig as RulesData;
}

/**
 * 获取男主中文名
 */
export function getMaleLeadName(pinyin: string): string | undefined {
  const rules = getCurrentRules();
  return rules['男主映射'][pinyin];
}

/**
 * 获取密探中文名
 */
export function getSpyName(pinyin: string): string | undefined {
  const rules = getCurrentRules();
  return rules['密探名映射'][pinyin];
}

/**
 * 获取户外分类名
 */
export function getOutdoorCategory(code: string): string | undefined {
  const rules = getCurrentRules();
  return rules['户外分类'][code];
}

/**
 * 获取户内分类名
 */
export function getIndoorCategory(code: string): string | undefined {
  const rules = getCurrentRules();
  return rules['户内分类'][code];
}

/**
 * 获取地板分类名
 */
export function getFloorCategory(code: string): string | undefined {
  const rules = getCurrentRules();
  return rules['地板分类'][code];
}
