import { Plus, Search } from 'lucide-react';
import type { TabConfig } from './types';

interface RulesSummaryProps {
  config: TabConfig;
  searchKeyword: string;
  filteredCount: number;
  onSearchChange: (keyword: string) => void;
  onAdd: () => void;
}

export function RulesSummary({ config, searchKeyword, filteredCount, onSearchChange, onAdd }: RulesSummaryProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchKeyword}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索键或值..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#E9DFD0] focus:border-[#C59F4A] focus:ring-1 focus:ring-[#C59F4A] outline-none rounded-lg"
        />
      </div>

      <button
        onClick={onAdd}
        className="px-4 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
        style={{ backgroundColor: config.color }}
      >
        <Plus size={14} />
        新增
      </button>
    </div>
  );
}
