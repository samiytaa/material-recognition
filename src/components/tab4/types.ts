import type { LucideIcon } from 'lucide-react';

export interface MappingEntry {
  key: string;
  value: string;
}

export interface OwnershipRule {
  category: string;
  defaultOwnership: OwnershipValue;
  extractFrom: string;
  allowNone?: boolean;
}

export type MappingType =
  | 'maleLeads'
  | 'spyNames'
  | 'outdoorCats'
  | 'indoorCats'
  | 'floorCats'
  | 'ownershipRules';

export type MappingListType = Exclude<MappingType, 'ownershipRules'>;

export type OwnershipValue = 'male_lead' | 'spy' | 'none' | 'mixed';

export interface RulesData {
  maleLeads: MappingEntry[];
  spyNames: MappingEntry[];
  outdoorCats: MappingEntry[];
  indoorCats: MappingEntry[];
  floorCats: MappingEntry[];
  ownershipRules: OwnershipRule[];
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
  type: MappingType;
  index: number;
} | null;

export type EditingRule = {
  index: number;
} | null;
