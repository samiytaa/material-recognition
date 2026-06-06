import type React from 'react';
import { Globe, Settings, User, Users } from 'lucide-react';
import type { MappingListType, TabConfig } from './types';

export const MAPPING_LIST_TYPES: MappingListType[] = [
  'maleLeads',
  'spyNames',
  'outdoorCats',
  'indoorCats',
  'floorCats',
];

export const TAB_CONFIGS: TabConfig[] = [
  { id: 'maleLeads', label: '男主映射', description: '拼音 → 男主中文名', color: '#D86B6B', icon: User },
  { id: 'spyNames', label: '密探名映射', description: '拼音 → 密探中文名', color: '#4F73C7', icon: Users },
  { id: 'outdoorCats', label: '户外分类', description: '代码 → 户外分类名', color: '#C59F4A', icon: Settings },
  { id: 'indoorCats', label: '户内分类', description: '代码 → 户内分类名', color: '#8B6F47', icon: Settings },
  { id: 'floorCats', label: '地板分类', description: '代码 → 地板分类名', color: '#9E4A4A', icon: Settings },
  { id: 'ownershipRules', label: '归属规则', description: '分类 → 归属类型和提取方式', color: '#7B68EE', icon: Globe },
];

export const EXTRACT_FROM_OPTIONS = [
  { value: 'segments', label: '文件名段' },
  { value: 'ccl_code', label: 'CCL编码' },
  { value: 'component_code', label: 'Component编码' },
  { value: 'furniture_segment', label: '家具格式段' },
  { value: 'avatar_pinyin', label: '头像拼音' },
];

export const OWNERSHIP_TYPE_OPTIONS = [
  { value: 'male_lead', label: '男主', color: '#D86B6B' },
  { value: 'spy', label: '密探', color: '#4F73C7' },
  { value: 'none', label: '无归属', color: '#888' },
  { value: 'mixed', label: '混合', color: '#C59F4A' },
] as const;

export const TAB_HINTS: Record<string, React.ReactNode> = {
  maleLeads: (
    <span>💡 用于识别文件名中的男主代码。例：<code className="bg-gray-100 px-1 rounded">sc</code> → <code className="bg-gray-100 px-1 rounded">孙策</code></span>
  ),
  spyNames: (
    <span>💡 用于识别密探头像文件名。例：<code className="bg-gray-100 px-1 rounded">icon_sunfu_s.png</code> → <code className="bg-gray-100 px-1 rounded">密探头像-孙辅</code></span>
  ),
  outdoorCats: (
    <span>💡 用于识别户外家具分类。例：<code className="bg-gray-100 px-1 rounded">icon_s1_sc_jianzhu_1001.png</code> → <code className="bg-gray-100 px-1 rounded">孙策-建筑</code></span>
  ),
  indoorCats: (
    <span>💡 用于识别户内家具分类。例：<code className="bg-gray-100 px-1 rounded">icon_s1_lb_qiju_2001.png</code> → <code className="bg-gray-100 px-1 rounded">刘辩-起居</code></span>
  ),
  floorCats: (
    <span>💡 用于识别地板类分类。例：<code className="bg-gray-100 px-1 rounded">icon_s1_all_diban_3001.png</code> → <code className="bg-gray-100 px-1 rounded">地板</code></span>
  ),
  ownershipRules: (
    <span>💡 定义每个分类的归属类型和提取方式。例：<code className="bg-gray-100 px-1 rounded">建筑</code> 分类默认归属为 <code className="bg-gray-100 px-1 rounded">男主</code>，从 <code className="bg-gray-100 px-1 rounded">家具格式段</code> 提取</span>
  ),
};
