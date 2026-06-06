import React from 'react';
import { BasemapGroupSelector } from '../common';
import { MapGroup } from '../../hooks';

interface BasemapSettingsProps {
  basemapGroups: MapGroup[];
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  enableContainScale: boolean;
  onContainScaleChange: (enabled: boolean) => void;
  addLog: (msg: string) => void;
}

export default function BasemapSettings({
  basemapGroups,
  selectedGroupId,
  onGroupChange,
  enableContainScale,
  onContainScaleChange,
  addLog
}: BasemapSettingsProps) {
  if (basemapGroups.length === 0) {
    return null;
  }

  const handleContainScaleChange = (newValue: boolean) => {
    onContainScaleChange(newValue);
    localStorage.setItem('tab2_enableContainScale', newValue.toString());
    addLog(`[设置] ${newValue ? '启用' : '禁用'} 加底等比缩放模式`);
  };

  return (
    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
      {/* 底图组选择器 */}
      <div className="flex items-center gap-2 flex-1">
        <label className="text-xs font-semibold text-[#674b2d] whitespace-nowrap">
          底图组
        </label>
        <BasemapGroupSelector
          groups={basemapGroups}
          selectedGroupId={selectedGroupId}
          onGroupChange={onGroupChange}
          className="flex-1"
        />
      </div>

      {/* 加底等比缩放开关 */}
      <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FFF8E7] to-[#FFF4DC] border border-[#E8D4A8] rounded-md shadow-sm">
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={enableContainScale}
            onChange={(e) => handleContainScaleChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[#D4A944] text-[#D4A944] focus:ring-1 focus:ring-[#D4A944] cursor-pointer"
          />
          <span className="text-xs font-bold text-[#8B6F47] whitespace-nowrap group-hover:text-[#A67C00] transition-colors">
            加底等比缩放
          </span>
        </label>
      </div>
    </div>
  );
}
