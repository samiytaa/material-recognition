import React from 'react';

interface RecognitionProgressModalProps {
  isOpen: boolean;
  current: number;
  total: number;
  successCount: number;
  failCount: number;
  currentProcessing: string;
  logs?: string[];
  title?: string;
}

export default function RecognitionProgressModal({
  isOpen,
  current,
  total,
  successCount,
  failCount,
  currentProcessing,
  logs = [],
  title = '正在识别中...'
}: RecognitionProgressModalProps) {
  if (!isOpen) return null;

  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
        {/* 进度弹窗 */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-[640px] max-h-[80vh] flex flex-col border-2 border-[#8B6F47]">
          <h3 className="text-lg font-bold text-[#674b2d] mb-4 text-center">
            {title}
          </h3>

          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-[#674b2d] mb-2">
              <span>进度：{current} / {total}</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-4 bg-[#E9DFD0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4A7C9E] to-[#5B8CAE] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#E8F5E9] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-[#2E7D32]">{successCount}</div>
              <div className="text-xs text-[#558B2F]">成功</div>
            </div>
            <div className="bg-[#FFEBEE] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-[#C62828]">{failCount}</div>
              <div className="text-xs text-[#D32F2F]">失败</div>
            </div>
          </div>

          {/* 当前处理项 */}
          <div className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E9DFD0] mb-4">
            <div className="text-xs text-[#8B6F47] mb-1">当前处理：</div>
            <div className="text-sm text-[#674b2d] font-medium truncate">
              {currentProcessing || '准备中...'}
            </div>
          </div>

          {/* 日志输出区域 */}
          {logs.length > 0 && (
            <div className="flex-1 min-h-0 mb-4">
              <div className="text-xs text-[#8B6F47] mb-2">识别日志：</div>
              <div className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E9DFD0] h-48 overflow-y-auto">
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div 
                      key={index} 
                      className="text-xs font-mono text-[#674b2d] leading-relaxed"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 提示文字 */}
          <div className="text-center text-xs text-[#8B6F47]">
            请勿关闭窗口或切换标签页
          </div>
        </div>
      </div>
    </>
  );
}
