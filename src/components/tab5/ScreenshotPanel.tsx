import React from 'react';
import { UploadZone } from '../common';

interface ScreenshotPanelProps {
  screenshotPreview: string | null;
  onScreenshotUpload: (files: FileList) => void;
  onClearScreenshot: () => void;
}

export default function ScreenshotPanel({
  screenshotPreview,
  onScreenshotUpload,
  onClearScreenshot
}: ScreenshotPanelProps) {
  return (
    <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
      <h3 className="font-serif font-bold text-[#8B6F47] text-sm mb-3">
        游戏内截图
      </h3>

      {screenshotPreview ? (
        <>
          <div className="bg-[#F8FAFC] rounded-xl min-h-[180px] flex items-center justify-center mb-3">
            <img
              src={screenshotPreview}
              alt="截图"
              className="max-w-full max-h-[200px] rounded-lg shadow-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onClearScreenshot}
              className="w-full px-3 py-1.5 bg-[#9E4A4A]/10 hover:bg-[#9E4A4A]/20 text-[#9E4A4A] text-xs font-bold rounded-full transition-all cursor-pointer"
            >
              清除截图
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white/70 border-2 border-[#DFD2BD] rounded-2xl overflow-hidden">
          <UploadZone
            onFilesSelected={onScreenshotUpload}
            accept="image/png,image/jpeg,image/webp"
            multiple={false}
            text="支持拖入截图"
            subText="或点击窗口选择游戏内截图文件"
          />
        </div>
      )}
    </div>
  );
}
