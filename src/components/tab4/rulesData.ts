import parseConfig from '../../parseConfig.json';
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
    avatarCats: configToEntries(parseConfig['头像类映射'] || {}),
    activityCats: configToEntries(parseConfig['活动类映射'] || {}),
    otherCats: configToEntries(parseConfig['其他类映射'] || {}),
  };
}

export function readSavedRulesData(): RulesData {
  const saved = localStorage.getItem('customRulesData');
  if (!saved) return createDefaultRulesData();

  try {
    const parsed = JSON.parse(saved);
    // 确保新增的字段存在
    if (!parsed.avatarCats) {
      parsed.avatarCats = [];
    }
    if (!parsed.activityCats) {
      parsed.activityCats = [];
    }
    if (!parsed.otherCats) {
      parsed.otherCats = [];
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
    avatarCats: Object.entries(imported['头像类映射'] || {}).map(([key, value]) => ({ key, value: value as string })),
    activityCats: Object.entries(imported['活动类映射'] || {}).map(([key, value]) => ({ key, value: value as string })),
    otherCats: Object.entries(imported['其他类映射'] || {}).map(([key, value]) => ({ key, value: value as string })),
  };
}

export function exportRulesData(rulesData: RulesData) {
  return {
    '男主映射': Object.fromEntries(rulesData.maleLeads.map((entry) => [entry.key, entry.value])),
    '密探名映射': Object.fromEntries(rulesData.spyNames.map((entry) => [entry.key, entry.value])),
    '户外分类': Object.fromEntries(rulesData.outdoorCats.map((entry) => [entry.key, entry.value])),
    '户内分类': Object.fromEntries(rulesData.indoorCats.map((entry) => [entry.key, entry.value])),
    '地板分类': Object.fromEntries(rulesData.floorCats.map((entry) => [entry.key, entry.value])),
    '头像类映射': Object.fromEntries(rulesData.avatarCats.map((entry) => [entry.key, entry.value])),
    '活动类映射': Object.fromEntries(rulesData.activityCats.map((entry) => [entry.key, entry.value])),
    '其他类映射': Object.fromEntries(rulesData.otherCats.map((entry) => [entry.key, entry.value])),
  };
}
