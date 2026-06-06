import React from 'react';
import { CheckCircle, RotateCcw, Trash2, X } from 'lucide-react';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDeleteSelected?.();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* 截图筛选器 - 始终显示 */}
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

      {/* 浮动操作条 - 仅在有选中行时显示 */}
      {hasSelection && (
        <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md border border-[#DFD2BD]/60 rounded-full shadow-[0_8px_32px_rgba(139,111,71,0.12)] px-5 py-2.5 transition-all hover:shadow-[0_12px_40px_rgba(139,111,71,0.18)]">
            <span className="text-xs text-[#674b2d] font-medium">
              已选中 <span className="font-bold text-[#8B6F47]">{selectedCount}</span> 行
            </span>
            <div className="h-3.5 w-px bg-gradient-to-b from-transparent via-[#DFD2BD]/60 to-transparent"></div>
            {onConfirmSelected && (
              <button
                onClick={onConfirmSelected}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 text-xs font-medium text-white transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] active:scale-95"
                title="确认选中条目"
              >
                <CheckCircle size={13} />
                <span>确认</span>
              </button>
            )}
            {onReturnSelected && (
              <button
                onClick={onReturnSelected}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 text-xs font-medium text-white transition-all hover:from-amber-500 hover:to-amber-600 hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)] active:scale-95"
                title="退回选中条目"
              >
                <RotateCcw size={13} />
                <span>退回</span>
              </button>
            )}
            {onDeleteSelected && (
              <button
                onClick={handleDeleteClick}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3.5 text-xs font-medium text-white transition-all hover:from-red-600 hover:to-red-700 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] active:scale-95"
                title="删除选中条目"
              >
                <Trash2 size={13} />
                <span>删除</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#674b2d] mb-3">确认删除</h3>
            <p className="text-sm text-[#8B6F47] mb-5">
              确定要删除选中的 <span className="font-bold text-red-600">{selectedCount}</span> 行吗？此操作不可恢复。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-[#8B6F47] bg-[#FAF8F4] border border-[#DFD2BD] rounded hover:bg-[#F2ECE5] transition"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 transition shadow-sm"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
