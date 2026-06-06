import type { LucideIcon } from 'lucide-react';

export interface MappingEntry {
  key: string;
  value: string;
}

export type FurnitureCategoryType = 'outdoorCats' | 'indoorCats' | 'floorCats';

export interface FurnitureMappingEntry extends MappingEntry {
  categoryType: FurnitureCategoryType;
  sourceIndex: number;
}

export type MappingType =
  | 'maleLeads'
  | 'spyNames'
  | 'furnitureCats'
  | 'outdoorCats'
  | 'indoorCats'
  | 'floorCats'
  | 'avatarCats'
  | 'activityCats'
  | 'otherCats';

export type MappingListType = Exclude<MappingType, 'furnitureCats'>;

export type EditableRuleType = MappingListType;

export interface RulesData {
  maleLeads: MappingEntry[];
  spyNames: MappingEntry[];
  outdoorCats: MappingEntry[];
  indoorCats: MappingEntry[];
  floorCats: MappingEntry[];
  avatarCats: MappingEntry[];
  activityCats: MappingEntry[];
  otherCats: MappingEntry[];
}

export interface TabConfig {
  id: MappingType;
  label: string;
  description: string;
  color: string;
  icon: LucideIcon;
}

export type Notice = {
  text: string;
  type: 'success' | 'error' | 'info';
};

export type EditingEntry = {
  type: EditableRuleType;
  index: number;
} | null;
