import React from 'react';
import { Sparkles, Download, ScanSearch, PackageCheck } from 'lucide-react';

interface ActionButtonsProps {
  uploadedScreenshotsCount: number;
  exportReadyCount: number;
  confirmedExportReadyCount: number;
  iconLibraryCount: number;
  canReview: boolean;
  onRunAiMatch: () => void;
  onOpenReview: () => void;
  onExport: () => void;
  onExportConfirmedAndRemove: () => void;
}

export default function ActionButtons({
  uploadedScreenshotsCount,
  exportReadyCount,
  confirmedExportReadyCount,
  iconLibraryCount,
  canReview,
  onRunAiMatch,
  onOpenReview,
  onExport,
  onExportConfirmedAndRemove
}: ActionButtonsProps) {
  return (
    <div className="save-button-area border-t border-gold-medium/30 pt-3 bg-transparent flex-shrink-0">
      <button
        onClick={onOpenReview}
        disabled={!canReview}
        className={`mb-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-xs font-bold uppercase tracking-widest shadow transition-all duration-200 ${
          canReview
            ? 'bg-gradient-to-r from-[#0F766E] to-[#0E7490] text-white hover:-translate-y-0.5 hover:to-[#155E75] hover:shadow-md active:translate-y-0'
            : 'cursor-not-allowed border border-[#DFD2BD] bg-[#EDE9E3] text-[#AFA498] shadow-none'
        }`}
        title={canReview ? '从当前选中行启动校对模式' : '请先在表格中选择一行'}
      >
        <ScanSearch size={16} />
        校对
      </button>
      <div className="flex gap-2">
        <button
          onClick={onRunAiMatch}
          disabled={uploadedScreenshotsCount === 0 || iconLibraryCount === 0}
          id="runAiMatchButton"
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-widest uppercase shadow transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
            uploadedScreenshotsCount > 0 && iconLibraryCount > 0
              ? 'bg-gradient-to-r from-[#7B68EE] to-[#6A5ACD] hover:to-[#5B4BBD] text-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
              : 'bg-[#EDE9E3] text-[#AFA498] shadow-none cursor-not-allowed border border-[#DFD2BD]'
          }`}
          title={iconLibraryCount === 0 ? '请先在Tab1中上传icon' : uploadedScreenshotsCount === 0 ? '请先上传截图' : '识别截图并生成条目'}
        >
          <Sparkles size={16} />
          一键识别
        </button>
        <button
          onClick={onExport}
          disabled={exportReadyCount === 0}
          id="exportButton"
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-widest uppercase shadow transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
            exportReadyCount > 0
              ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:to-[#B45309] text-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
              : 'bg-[#EDE9E3] text-[#AFA498] shadow-none cursor-not-allowed border border-[#DFD2BD]'
          }`}
        >
          <Download size={16} />
          导出
        </button>
      </div>
      <button
        onClick={onExportConfirmedAndRemove}
        disabled={confirmedExportReadyCount === 0}
        className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-xs font-bold uppercase tracking-widest shadow transition-all duration-200 ${
          confirmedExportReadyCount > 0
            ? 'bg-gradient-to-r from-[#166534] to-[#15803D] text-white hover:-translate-y-0.5 hover:to-[#166534] hover:shadow-md active:translate-y-0'
            : 'cursor-not-allowed border border-[#DFD2BD] bg-[#EDE9E3] text-[#AFA498] shadow-none'
        }`}
        title={confirmedExportReadyCount > 0 ? `下载 ${confirmedExportReadyCount} 张已确认合成图片并移除对应条目` : '没有可下载并移除的已确认合成图片'}
      >
        <PackageCheck size={16} />
        下载已确认并移除
      </button>
    </div>
  );
}
