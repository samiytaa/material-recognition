import type React from 'react';
import { Layers3, User, Users, Image, Calendar, Package } from 'lucide-react';
import type { FurnitureCategoryType, MappingListType, TabConfig } from './types';

export const MAPPING_LIST_TYPES: MappingListType[] = [
  'maleLeads',
  'spyNames',
  'outdoorCats',
  'indoorCats',
  'floorCats',
  'avatarCats',
  'activityCats',
  'otherCats',
];

export const TAB_CONFIGS: TabConfig[] = [
  { id: 'maleLeads', label: '男主', description: '拼音 → 男主中文名', color: '#D86B6B', icon: User },
  { id: 'spyNames', label: '密探', description: '拼音 → 密探中文名', color: '#4F73C7', icon: Users },
  { id: 'furnitureCats', label: '家具', description: '类型 + 代码 → 分类名', color: '#C59F4A', icon: Layers3 },
  { id: 'avatarCats', label: '头像', description: '代码 → 头像分类名', color: '#F59E42', icon: Image },
  { id: 'activityCats', label: '活动', description: '代码 → 活动分类名', color: '#52C41A', icon: Calendar },
  { id: 'otherCats', label: '其他', description: '代码 → 其他分类名', color: '#9254DE', icon: Package },
];

export const FURNITURE_CATEGORY_OPTIONS: Array<{ value: FurnitureCategoryType; label: string; color: string }> = [
  { value: 'outdoorCats', label: '户外分类', color: '#C59F4A' },
  { value: 'indoorCats', label: '户内分类', color: '#8B6F47' },
  { value: 'floorCats', label: '地板分类', color: '#9E4A4A' },
];



export const TAB_HINTS: Record<string, React.ReactNode> = {
  maleLeads: (
    <span>💡 用于识别文件名中的男主代码。例：<code className="bg-gray-100 px-1 rounded">sc</code> → <code className="bg-gray-100 px-1 rounded">孙策</code></span>
  ),
  spyNames: (
    <span>💡 用于识别密探头像文件名。例：<code className="bg-gray-100 px-1 rounded">icon_sunfu_s.png</code> → <code className="bg-gray-100 px-1 rounded">密探头像-孙辅</code></span>
  ),
  furnitureCats: (
    <span>💡 合并管理户外、户内、地板分类。例：<code className="bg-gray-100 px-1 rounded">jianzhu</code> → <code className="bg-gray-100 px-1 rounded">建筑</code>，通过“分类类型”列区分。</span>
  ),

  avatarCats: (
    <span>💡 用于识别头像类道具。例：<code className="bg-gray-100 px-1 rounded">mitantouxiang</code> → <code className="bg-gray-100 px-1 rounded">密探头像</code></span>
  ),
  activityCats: (
    <span>💡 用于识别活动类道具。例：<code className="bg-gray-100 px-1 rounded">qixi</code> → <code className="bg-gray-100 px-1 rounded">七夕活动</code></span>
  ),
  otherCats: (
    <span>💡 用于识别其他类道具。例：<code className="bg-gray-100 px-1 rounded">fudie</code> → <code className="bg-gray-100 px-1 rounded">符牒</code></span>
  ),
};
