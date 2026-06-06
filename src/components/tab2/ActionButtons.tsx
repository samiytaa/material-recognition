import React from 'react';
import { Sparkles, Download } from 'lucide-react';

interface ActionButtonsProps {
  uploadedScreenshotsCount: number;
  exportReadyCount: number;
  onRunAiMatch: () => void;
  onExport: () => void;
}

export default function ActionButtons({
  uploadedScreenshotsCount,
  exportReadyCount,
  onRunAiMatch,
  onExport
}: ActionButtonsProps) {
  return (
    <div className="save-button-area border-t border-gold-medium/30 pt-3 bg-transparent flex-shrink-0">
      <div className="flex gap-2">
        <button
          onClick={onRunAiMatch}
          disabled={uploadedScreenshotsCount === 0}
          id="runAiMatchButton"
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-widest uppercase shadow transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
            uploadedScreenshotsCount > 0
              ? 'bg-gradient-to-r from-[#7B68EE] to-[#6A5ACD] hover:to-[#5B4BBD] text-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
              : 'bg-[#EDE9E3] text-[#AFA498] shadow-none cursor-not-allowed border border-[#DFD2BD]'
          }`}
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
    </div>
  );
}
