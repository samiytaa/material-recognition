import React from 'react';
import { Eye, Trash2 } from 'lucide-react';

interface LogPanelProps {
  logs: string[];
  batchSize: number;
  onBatchSizeChange: (size: number) => void;
  onRunRecognition: () => void;
  onClearLogs: () => void;
  canRunRecognition: boolean;
  recognitionTooltip: string;
}

export default function LogPanel({
  logs,
  batchSize,
  onBatchSizeChange,
  onRunRecognition,
  onClearLogs,
  canRunRecognition,
  recognitionTooltip
}: LogPanelProps) {
  return (
    <div className="bg-[#FFFBF6] border border-[#E9DFD0] rounded-2xl p-4 shadow-xs traditional-shadow decorative-corners">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif font-bold text-[#8B6F47] text-sm">
          日志
        </h3>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-[#674b2d] font-bold whitespace-nowrap">
              每批数量
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={batchSize}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= 20) {
                  onBatchSizeChange(val);
                }
              }}
              className="w-14 text-xs px-2 py-1 border border-[#E9DFD0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8B6F47] bg-white text-center"
            />
          </div>
          <button
            onClick={onRunRecognition}
            disabled={!canRunRecognition}
            className="px-4 py-1.5 bg-gradient-to-r from-[#4A7C9E] to-[#5B8CAE] hover:from-[#396380] hover:to-[#4A7C9E] text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
            title={recognitionTooltip}
          >
            <Eye size={13} />
            一键识别
          </button>
          <button
            onClick={onClearLogs}
            className="px-3 py-1.5 bg-[#8B6F47]/10 hover:bg-[#8B6F47]/20 text-[#674b2d] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            <Trash2 size={12} />
            清空日志
          </button>
        </div>
      </div>

      <div className="bg-[#1E293B] text-[#E2E8F0] rounded-xl p-4 font-mono text-[10px] h-[280px] overflow-y-auto whitespace-pre-wrap break-words">
        {logs.map((log, idx) => (
          <div key={idx}>{log}</div>
        ))}
      </div>
    </div>
  );
}
