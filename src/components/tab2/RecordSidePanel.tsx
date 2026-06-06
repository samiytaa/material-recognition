import React from 'react';
import { ScreenshotPrimaryCategory } from '../../types';
import { SCREENSHOT_CATEGORY_OPTIONS } from '../../utils/tab2Helper';
import { Card } from '../common';
import ActionButtons from './ActionButtons';

interface RecordSidePanelProps {
  iconLibraryCount: number;
  selectedScreenshotCategory: ScreenshotPrimaryCategory;
  pendingRecognitionCount: number;
  exportReadyCount: number;
  confirmedExportReadyCount: number;
  canReview: boolean;
  onScreenshotCategoryChange: (category: ScreenshotPrimaryCategory) => void;
  onBatchScreenshotUpload: (files: FileList) => void;
  onRunAiMatch: () => void;
  onOpenReview: () => void;
  onExport: () => void;
  onExportConfirmedAndRemove: () => void;
}

export default function RecordSidePanel({
  iconLibraryCount,
  selectedScreenshotCategory,
  pendingRecognitionCount,
  exportReadyCount,
  confirmedExportReadyCount,
  canReview,
  onScreenshotCategoryChange,
  onBatchScreenshotUpload,
  onRunAiMatch,
  onOpenReview,
  onExport,
  onExportConfirmedAndRemove
}: RecordSidePanelProps) {
  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      onBatchScreenshotUpload(files);
    }
  };

  return (
    <div className="w-full lg:w-80 flex flex-col gap-4 relative min-h-0">
      <Card className="flex-shrink-0" padding="md">
        <div className="text-xs text-[#674b2d] mb-1 font-semibold">Icon库状态</div>
        <div className={`text-sm font-bold ${iconLibraryCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {iconLibraryCount > 0 ? (
            <>✓ 可用: {iconLibraryCount} 个icon（来自Tab1）</>
          ) : (
            <>⚠ 未检测到icon库，请先在Tab1上传icon</>
          )}
        </div>
      </Card>

      <Card className="flex-shrink-0" padding="md">
        <div className="mb-3">
          <div className="text-sm font-bold text-[#674b2d] mb-2">上传游戏截图</div>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-bold text-[#674b2d]">截图分类</span>
            <select
              value={selectedScreenshotCategory}
              onChange={(e) => onScreenshotCategoryChange(e.target.value as ScreenshotPrimaryCategory)}
              className="w-full rounded-lg border border-[#DFD2BD] bg-white px-3 py-2 text-xs font-bold text-[#674b2d] outline-none focus:border-gold-shiny"
              title="上传截图时选择一级分类，AI识别时只匹配该分类Icon"
            >
              {SCREENSHOT_CATEGORY_OPTIONS.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
            className="hidden"
            id="screenshotUpload"
          />
          <label
            htmlFor="screenshotUpload"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="block w-full py-8 px-4 border-2 border-dashed border-[#DFD2BD] rounded-xl text-center cursor-pointer hover:border-[#C5B198] hover:bg-[#FAF8F5] transition-all"
          >
            <div className="text-[#8B7355] text-sm font-semibold">
              点击或拖拽上传截图
            </div>
            <div className="text-xs text-[#AFA498] mt-1">
              支持批量上传
            </div>
          </label>
        </div>
      </Card>

      <ActionButtons
        uploadedScreenshotsCount={pendingRecognitionCount}
        exportReadyCount={exportReadyCount}
        confirmedExportReadyCount={confirmedExportReadyCount}
        iconLibraryCount={iconLibraryCount}
        canReview={canReview}
        onRunAiMatch={onRunAiMatch}
        onOpenReview={onOpenReview}
        onExport={onExport}
        onExportConfirmedAndRemove={onExportConfirmedAndRemove}
      />
    </div>
  );
}
