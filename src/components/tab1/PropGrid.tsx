import React from 'react';
import { PropItem } from '../../types';
import ImageThumbnail from '../common/ImageThumbnail';

interface PropGridProps {
  props: Array<{ prop: PropItem; idx: number }>;
  previewIndex: number | null;
  onSelect: (idx: number) => void;
  onDelete: (idx: number) => void;
}

export default function PropGrid({
  props,
  previewIndex,
  onSelect,
  onDelete,
}: PropGridProps) {
  return (
    <div className="grid grid-cols-6 gap-3.5 mb-2">
      {props.map(({ prop, idx }, displayIdx) => {
        if (!prop.image) return null;
        
        const isSelected = previewIndex === idx;
        
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
          <div key={idx} className="relative">
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
  );
}
