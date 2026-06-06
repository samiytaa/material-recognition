import React from 'react';
import { BasemapGroupSelector, BasemapColorPicker } from '../common';
import { MapGroup } from '../../hooks';

interface BasemapPanelProps {
  basemapGroups: MapGroup[];
  selectedGroupId: string;
  selectedColor: string | null;
  onGroupChange: (groupId: string) => void;
  onColorSelect: (color: string) => void;
  addLog: (msg: string) => void;
}

export default function BasemapPanel({
  basemapGroups,
  selectedGroupId,
  selectedColor,
  onGroupChange,
  onColorSelect,
  addLog
}: BasemapPanelProps) {
  const currentGroup = basemapGroups.find(g => g.id === selectedGroupId) || basemapGroups[0];
  const basemaps = currentGroup?.thumbnails || [];

  return (
    <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif font-bold text-[#8B6F47] text-sm">
          底图
        </h3>
        <BasemapGroupSelector
          groups={basemapGroups}
          selectedGroupId={selectedGroupId}
          onGroupChange={(groupId) => {
            onGroupChange(groupId);
            addLog(`切换到底图组: ${basemapGroups.find(g => g.id === groupId)?.name}`);
          }}
          className="text-[10px]"
        />
      </div>

      <BasemapColorPicker
        basemaps={basemaps}
        selectedColor={selectedColor}
        onColorSelect={onColorSelect}
      />
    </div>
  );
}
