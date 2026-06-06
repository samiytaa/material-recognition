import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { IconLibraryItem } from '../../hooks/useIconLibrary';

interface CompositePanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  compositeFilename: string;
  recognizedOcrName: string;
  selectedBaseMapColor: string | null;
  selectedIconId: string | null;
  iconLibrary: IconLibraryItem[];
  enableContainScale: boolean;
  onFilenameChange: (filename: string) => void;
  onContainScaleChange: (enabled: boolean) => void;
  onDownload: () => void;
  onRefresh: () => void;
  addLog: (msg: string) => void;
}

export default function CompositePanel({
  canvasRef,
  compositeFilename,
  recognizedOcrName,
  selectedBaseMapColor,
  selectedIconId,
  iconLibrary,
  enableContainScale,
  onFilenameChange,
  onContainScaleChange,
  onDownload,
  onRefresh,
  addLog
}: CompositePanelProps) {
  const handleContainScaleToggle = (newValue: boolean) => {
    onContainScaleChange(newValue);
    localStorage.setItem('tab5_enableContainScale', newValue.toString());
    addLog(`[设置] ${newValue ? '启用' : '禁用'} Contain 等比缩放模式`);
  };

  return (
    <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif font-bold text-[#8B6F47] text-sm">
          合成图片
        </h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={enableContainScale}
              onChange={(e) => handleContainScaleToggle(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#8B6F47] text-[#8B6F47] focus:ring-1 focus:ring-[#8B6F47] cursor-pointer"
            />
            <span className="text-[10px] text-[#674b2d] font-bold whitespace-nowrap group-hover:text-[#8B6F47] transition-colors">
              等比缩放
            </span>
          </label>
        </div>
      </div>

      <div
        className="bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-xl p-4 flex items-center justify-center min-h-[180px] mb-3"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
            linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
            linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0'
        }}
      >
        {selectedBaseMapColor && selectedIconId && (
          <canvas
            ref={canvasRef}
            width="140"
            height="140"
            className="rounded-xl shadow-lg"
            style={{ width: '140px', height: '140px' }}
          />
        )}
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#674b2d] mb-1">
          下载文件名
        </label>
        <input
          type="text"
          value={compositeFilename}
          onChange={(e) => onFilenameChange(e.target.value)}
          placeholder="等待OCR识别物品名称"
          className="w-full text-xs px-3 py-2 border border-[#E9DFD0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8B6F47] bg-white mb-3"
        />

        <div className="bg-[#F8FAFC] border border-[#E9DFD0] rounded-xl p-3 text-xs text-[#674b2d] leading-relaxed mb-3">
          {selectedBaseMapColor && selectedIconId ? (
            <>
              <div><strong>底图颜色:</strong> {selectedBaseMapColor}</div>
              <div>
                <strong>匹配Icon:</strong>{' '}
                {iconLibrary.find(i => i.id === selectedIconId)?.name}
              </div>
              <div><strong>识别名称:</strong> {recognizedOcrName || '未识别'}</div>
            </>
          ) : (
            '当前需要先完成底图定位和 icon 匹配。'
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDownload}
            disabled={!selectedBaseMapColor || !selectedIconId}
            className="px-3 py-1.5 bg-[#8B6F47] hover:bg-[#6F5839] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Download size={12} />
            下载
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-[#8B6F47]/10 hover:bg-[#8B6F47]/20 text-[#674b2d] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            <RefreshCw size={12} />
            刷新合成
          </button>
        </div>
      </div>
    </div>
  );
}
