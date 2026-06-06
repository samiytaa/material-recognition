import React from 'react';
import { CheckCircle, RotateCcw, Trash2 } from 'lucide-react';

interface BatchOperationsBarProps {
  selectedCount: number;
  screenshotFilter: 'all' | 'matched' | 'unmatched';
  totalRecords: number;
  matchedCount: number;
  unMatchedCount: number;
  onScreenshotFilterChange: (filter: 'all' | 'matched' | 'unmatched') => void;
  onDeleteSelected?: () => void;
  onReturnSelected?: () => void;
  onConfirmSelected?: () => void;
}

export default function BatchOperationsBar({
  selectedCount,
  screenshotFilter,
  totalRecords,
  matchedCount,
  unMatchedCount,
  onScreenshotFilterChange,
  onDeleteSelected,
  onReturnSelected,
  onConfirmSelected
}: BatchOperationsBarProps) {
  const hasSelection = selectedCount > 0;

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

      {/* 多选状态提示 */}
      {hasSelection && (
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <span className="text-xs text-[#8B6F47] font-medium">
            已选中 {selectedCount} 行
          </span>
          {onConfirmSelected && (
            <button
              onClick={onConfirmSelected}
              className="inline-flex h-7 items-center gap-1 rounded bg-emerald-600 px-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
              title="确认选中条目"
            >
              <CheckCircle size={13} />
              确认
            </button>
          )}
          {onReturnSelected && (
            <button
              onClick={onReturnSelected}
              className="inline-flex h-7 items-center gap-1 rounded bg-amber-500 px-2.5 text-xs font-bold text-white transition hover:bg-amber-600"
              title="退回选中条目"
            >
              <RotateCcw size={13} />
              退回
            </button>
          )}
          {onDeleteSelected && (
            <button
              onClick={onDeleteSelected}
              className="inline-flex h-7 items-center gap-1 rounded bg-red-600 px-2.5 text-xs font-bold text-white transition hover:bg-red-700"
              title="删除选中条目"
            >
              <Trash2 size={13} />
              删除
            </button>
          )}
        </div>
      )}
    </div>
  );
}
