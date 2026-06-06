import React from 'react';
import { PropItem } from '../../types';
import ImageThumbnail from '../common/ImageThumbnail';
import { Check } from 'lucide-react';

interface PropGridProps {
  props: Array<{ prop: PropItem; idx: number }>;
  previewIndex: number | null;
  onSelect: (idx: number) => void;
  onDelete: (idx: number) => void;
  selectedIndices?: number[];
  onToggleSelection?: (idx: number) => void;
  onToggleSelectAll?: () => void;
}

export default function PropGrid({
  props,
  previewIndex,
  onSelect,
  onDelete,
  selectedIndices = [],
  onToggleSelection,
  onToggleSelectAll,
}: PropGridProps) {
  const allSelected = props.length > 0 && props.every(({ idx }) => selectedIndices.includes(idx));
  
  return (
    <>
      {/* 全选按钮 */}
      {onToggleSelectAll && props.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={onToggleSelectAll}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              allSelected
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-white/70 hover:bg-white border border-[#DFD2BD] text-[#674b2d]'
            }`}
          >
            <Check size={14} />
            {allSelected ? '取消全选' : '全选当前页'}
          </button>
          {selectedIndices.length > 0 && (
            <span className="text-xs text-[#8B6F47]">
              已选择 {selectedIndices.length} 个道具
            </span>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-6 gap-3.5 mb-2">
        {props.map(({ prop, idx }, displayIdx) => {
          if (!prop.image) return null;
          
          const isSelected = previewIndex === idx;
          const isChecked = selectedIndices.includes(idx);
          
          // 确定徽章显示
          let badge: string | undefined;
          let badgeColor: string | undefined;
          
          if (prop.type === 'furniture') {
            if (prop.isGrowthProp) {
              badge = '初见日';
              badgeColor = '#D86B6B';
            } else if (prop.isFloor) {
              badge = '地板';
              badgeColor = '#4F73C7';
            } else if (prop.category !== '其他') {
              badge = prop.category;
              badgeColor = '#C59F4A';
            }
          }

          return (
            <div key={idx} className="relative group">
              {/* 选择框 */}
              {onToggleSelection && (
                <div 
                  className="absolute top-1 left-1 z-10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(idx);
                  }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isChecked 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'bg-white/90 border-gray-300 hover:border-blue-400'
                  }`}>
                    {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
              )}
              
              <ImageThumbnail
                src={prop.image}
                alt={prop.displayName}
                onClick={() => onSelect(idx)}
                onDelete={() => onDelete(idx)}
                badge={badge}
                badgeColor={badgeColor}
                index={displayIdx}
                isSelected={isSelected}
              />
              {/* 名称 */}
              <div className="mt-2 text-center w-full px-1">
                <div className="text-[11px] font-bold text-[#674b2d] truncate group-hover:text-gold-deep transition-colors">
                  {prop.displayName}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
