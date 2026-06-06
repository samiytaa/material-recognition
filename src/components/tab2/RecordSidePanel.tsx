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
        <div className="text-xs text-[#8B6F47]/70 mb-2 font-medium uppercase tracking-wide">Icon库状态</div>
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg ${
          iconLibraryCount > 0 
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50' 
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50'
        }`}>
          <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
            iconLibraryCount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
          }`}></div>
          <div className={`text-xs font-medium ${iconLibraryCount > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
            {iconLibraryCount > 0 ? (
              <>可用: <span className="font-bold">{iconLibraryCount}</span> 个icon（来自Tab1）</>
            ) : (
              <>未检测到icon库，请先在Tab1上传icon</>
            )}
          </div>
        </div>
      </Card>

      <Card className="flex-shrink-0" padding="md">
        <div className="mb-3">
          <div className="text-xs text-[#8B6F47]/70 mb-3 font-medium uppercase tracking-wide">上传游戏截图</div>
          <label className="mb-3 block">
            <span className="mb-1.5 block text-xs font-medium text-[#674b2d]">截图分类</span>
            <select
              value={selectedScreenshotCategory}
              onChange={(e) => onScreenshotCategoryChange(e.target.value as ScreenshotPrimaryCategory)}
              className="w-full rounded-lg border border-[#DFD2BD]/60 bg-white px-3 py-2 text-xs font-medium text-[#674b2d] outline-none focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/10 transition-all"
              title="无分类会识别全部Icon，其余分类只匹配对应分类Icon"
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
            className="group block w-full py-8 px-4 border-2 border-dashed border-[#DFD2BD]/60 rounded-xl text-center cursor-pointer hover:border-[#8B6F47] hover:bg-gradient-to-br hover:from-[#FAF8F5] hover:to-[#F8F5F0] transition-all duration-300"
          >
            <div className="text-[#8B6F47] text-sm font-medium group-hover:font-semibold transition-all">
              点击或拖拽上传截图
            </div>
            <div className="text-xs text-[#AFA498] mt-1.5 group-hover:text-[#8B6F47]/70 transition-colors">
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
