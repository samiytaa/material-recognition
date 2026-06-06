import parseConfig from '../../parseConfig.json';
import ownershipRulesConfig from '../../categoryOwnershipRules.json';
import type { RulesData } from './types';

const configToEntries = (value: Record<string, string>) =>
  Object.entries(value).map(([key, entryValue]) => ({ key, value: entryValue }));

export function createDefaultRulesData(): RulesData {
  return {
    maleLeads: configToEntries(parseConfig['男主映射']),
    spyNames: configToEntries(parseConfig['密探名映射']),
    outdoorCats: configToEntries(parseConfig['户外分类']),
    indoorCats: configToEntries(parseConfig['户内分类']),
    floorCats: configToEntries(parseConfig['地板分类']),
    ownershipRules: Object.entries(ownershipRulesConfig.categoryOwnershipRules).map(([category, rule]: [string, any]) => ({
      category,
      defaultOwnership: rule.defaultOwnership,
      extractFrom: rule.extractFrom,
      allowNone: rule.allowNone,
    })),
  };
}

export function readSavedRulesData(): RulesData {
  const saved = localStorage.getItem('customRulesData');
  if (!saved) return createDefaultRulesData();

  try {
    const parsed = JSON.parse(saved);
    if (!parsed.ownershipRules) {
      parsed.ownershipRules = createDefaultRulesData().ownershipRules;
    }
    return parsed;
  } catch (error) {
    console.error('读取自定义规则失败:', error);
    return createDefaultRulesData();
  }
}

export function importRulesData(imported: any): RulesData {
  return {
    maleLeads: Object.entries(imported['男主映射'] || {}).map(([key, value]) => ({ key, value: value as string })),
    spyNames: Object.entries(imported['密探名映射'] || {}).map(([key, value]) => ({ key, value: value as string })),
    outdoorCats: Object.entries(imported['户外分类'] || {}).map(([key, value]) => ({ key, value: value as string })),
    indoorCats: Object.entries(imported['户内分类'] || {}).map(([key, value]) => ({ key, value: value as string })),
    floorCats: Object.entries(imported['地板分类'] || {}).map(([key, value]) => ({ key, value: value as string })),
    ownershipRules: Object.entries(imported.categoryOwnershipRules || {}).map(([category, rule]: [string, any]) => ({
      category,
      defaultOwnership: rule.defaultOwnership,
      extractFrom: rule.extractFrom,
      allowNone: rule.allowNone,
    })),
  };
}

export function exportRulesData(rulesData: RulesData) {
  return {
    '男主映射': Object.fromEntries(rulesData.maleLeads.map((entry) => [entry.key, entry.value])),
    '密探名映射': Object.fromEntries(rulesData.spyNames.map((entry) => [entry.key, entry.value])),
    '户外分类': Object.fromEntries(rulesData.outdoorCats.map((entry) => [entry.key, entry.value])),
    '户内分类': Object.fromEntries(rulesData.indoorCats.map((entry) => [entry.key, entry.value])),
    '地板分类': Object.fromEntries(rulesData.floorCats.map((entry) => [entry.key, entry.value])),
    categoryOwnershipRules: Object.fromEntries(
      rulesData.ownershipRules.map((rule) => [
        rule.category,
        {
          defaultOwnership: rule.defaultOwnership,
          extractFrom: rule.extractFrom,
          ...(rule.allowNone && { allowNone: rule.allowNone }),
        },
      ]),
    ),
  };
}
