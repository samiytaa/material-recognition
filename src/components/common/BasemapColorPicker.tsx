import React from 'react';
import type { BasemapItem } from '../../hooks/useBasemapGroups';

interface BasemapColorPickerProps {
  basemaps: BasemapItem[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  className?: string;
}

export function BasemapColorPicker({
  basemaps,
  selectedColor,
  onColorSelect,
  className = ''
}: BasemapColorPickerProps) {
  if (basemaps.length === 0) {
    return (
      <div className="text-xs text-gray-400 text-center py-4">
        当前底图组无可用底图
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {basemaps.map(baseMap => (
        <div
          key={baseMap.id}
          onClick={() => onColorSelect(baseMap.color)}
          className={`bg-white rounded-xl p-3 border text-center w-16 transition-all cursor-pointer ${
            selectedColor === baseMap.color
              ? 'border-2 border-[#1a73e8] bg-[#e8f0fe] shadow-md'
              : 'border-[#dce5ec] hover:border-[#8B6F47]'
          }`}
        >
          <img
            src={baseMap.image}
            alt={baseMap.color}
            className="w-12 h-12 object-contain rounded-lg mx-auto bg-[#EEF2F5] shadow-sm"
          />
          <div className="text-[9px] mt-1.5 font-bold text-[#674b2d]">{baseMap.color}</div>
        </div>
      ))}
    </div>
  );
}
