import React from 'react';

interface BatchOperationsBarProps {
  selectedCount: number;
  screenshotFilter: 'all' | 'matched' | 'unmatched';
  totalRecords: number;
  matchedCount: number;
  unMatchedCount: number;
  onScreenshotFilterChange: (filter: 'all' | 'matched' | 'unmatched') => void;
  onDeleteSelectedRows: () => void;
  onDeleteSelectedScreenshots: () => void;
}

export default function BatchOperationsBar({
  selectedCount,
  screenshotFilter,
  totalRecords,
  matchedCount,
  unMatchedCount,
  onScreenshotFilterChange,
  onDeleteSelectedRows,
  onDeleteSelectedScreenshots
}: BatchOperationsBarProps) {
  return (
    <div className="mb-3 flex items-center gap-3 flex-wrap">
      {/* 截图筛选器 */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-[#674b2d] whitespace-nowrap">
          截图筛选
        </label>
        <div className="flex items-center gap-1 bg-[#FAF8F4] border border-[#DFD2BD] rounded-md p-0.5">
          <button
            onClick={() => onScreenshotFilterChange('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              screenshotFilter === 'all'
                ? 'bg-[#8B6F47] text-white shadow-sm'
                : 'text-[#8B6F47] hover:bg-[#F2ECE5]'
            }`}
          >
            全部 ({totalRecords})
          </button>
          <button
            onClick={() => onScreenshotFilterChange('matched')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              screenshotFilter === 'matched'
                ? 'bg-[#8B6F47] text-white shadow-sm'
                : 'text-[#8B6F47] hover:bg-[#F2ECE5]'
            }`}
          >
            已匹配 ({matchedCount})
          </button>
          <button
            onClick={() => onScreenshotFilterChange('unmatched')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              screenshotFilter === 'unmatched'
                ? 'bg-[#8B6F47] text-white shadow-sm'
                : 'text-[#8B6F47] hover:bg-[#F2ECE5]'
            }`}
          >
            未匹配 ({unMatchedCount})
          </button>
        </div>
      </div>

      {/* 批量操作按钮（选中行时显示） */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[#8B6F47] font-medium">
            已选中 {selectedCount} 行
          </span>
          <button
            onClick={onDeleteSelectedRows}
            className="px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
          >
            删除选中行
          </button>
          <button
            onClick={onDeleteSelectedScreenshots}
            className="px-3 py-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors"
          >
            删除选中截图
          </button>
        </div>
      )}
    </div>
  );
}
