import { Globe, User, Users } from 'lucide-react';
import React from 'react';
import { OwnershipType } from '../../types';
import { SearchInput } from '../common';

interface OwnershipFilterProps {
  currentOwnership: { type: OwnershipType | 'all'; name: string | null };
  onOwnershipChange: (ownership: { type: OwnershipType | 'all'; name: string | null }) => void;
  maleLeads: string[];
  spies: string[];
  searchKeyword?: string;
  onSearchChange?: (value: string) => void;
  onSearchClear?: () => void;
}

export default function OwnershipFilter({
  currentOwnership,
  onOwnershipChange,
  maleLeads,
  spies,
  searchKeyword = '',
  onSearchChange,
  onSearchClear,
}: OwnershipFilterProps) {
  const [expandedType, setExpandedType] = React.useState<'male_lead' | 'spy' | null>(null);

  const toggleType = (type: 'male_lead' | 'spy') => {
    setExpandedType(expandedType === type ? null : type);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* 左侧：归属筛选按钮 */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-[#8E8276] mr-1">归属筛选</span>

        {/* 全部 */}
        <button
          onClick={() => onOwnershipChange({ type: 'all', name: null })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentOwnership.type === 'all'
              ? 'bg-[#D4C4A8] text-white shadow-sm'
              : 'bg-white/60 text-[#8E8276] hover:bg-white/80'
            }`}
        >
          <Globe size={14} className="inline mr-1" />
          全部
        </button>

        {/* 男主 */}
        <div className="relative">
          <button
            onClick={() => toggleType('male_lead')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentOwnership.type === 'male_lead'
                ? 'bg-[#9E4A4A] text-white shadow-sm'
                : 'bg-white/60 text-[#8E8276] hover:bg-white/80'
              }`}
          >
            <User size={14} className="inline mr-1" />
            男主 {currentOwnership.type === 'male_lead' && currentOwnership.name ? `(${currentOwnership.name})` : ''}
          </button>

          {expandedType === 'male_lead' && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-[#ECDDB9] p-2 z-10 min-w-[120px]">
              <button
                onClick={() => {
                  onOwnershipChange({ type: 'male_lead', name: null });
                  setExpandedType(null);
                }}
                className="block w-full text-left px-2 py-1 text-xs hover:bg-[#FAF4EA] rounded"
              >
                全部男主
              </button>
              {maleLeads.map(name => (
                <button
                  key={name}
                  onClick={() => {
                    onOwnershipChange({ type: 'male_lead', name });
                    setExpandedType(null);
                  }}
                  className="block w-full text-left px-2 py-1 text-xs hover:bg-[#FAF4EA] rounded"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 密探 */}
        <div className="relative">
          <button
            onClick={() => toggleType('spy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentOwnership.type === 'spy'
                ? 'bg-[#4F73C7] text-white shadow-sm'
                : 'bg-white/60 text-[#8E8276] hover:bg-white/80'
              }`}
          >
            <Users size={14} className="inline mr-1" />
            密探 {currentOwnership.type === 'spy' && currentOwnership.name ? `(${currentOwnership.name})` : ''}
          </button>

          {expandedType === 'spy' && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-[#ECDDB9] p-2 z-10 min-w-[120px] max-h-[300px] overflow-y-auto">
              <button
                onClick={() => {
                  onOwnershipChange({ type: 'spy', name: null });
                  setExpandedType(null);
                }}
                className="block w-full text-left px-2 py-1 text-xs hover:bg-[#FAF4EA] rounded sticky top-0 bg-white"
              >
                全部密探
              </button>
              {spies.map(name => (
                <button
                  key={name}
                  onClick={() => {
                    onOwnershipChange({ type: 'spy', name });
                    setExpandedType(null);
                  }}
                  className="block w-full text-left px-2 py-1 text-xs hover:bg-[#FAF4EA] rounded"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 无归属 */}
        <button
          onClick={() => onOwnershipChange({ type: 'none', name: null })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentOwnership.type === 'none'
              ? 'bg-[#888] text-white shadow-sm'
              : 'bg-white/60 text-[#8E8276] hover:bg-white/80'
            }`}
        >
          无归属
        </button>
      </div>

      {/* 右侧：搜索框 */}
      {onSearchChange && (
        <div className="flex-shrink-0 w-80">
          <SearchInput
            value={searchKeyword}
            onChange={onSearchChange}
            placeholder="我是搜索框（默认开头为：icon_）"
            onClear={onSearchClear}
          />
        </div>
      )}
    </div>
  );
}
