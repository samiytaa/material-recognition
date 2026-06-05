import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, ChevronLeft, Trash2, X } from 'lucide-react';

interface LogSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  logs: string[];
  onClearLogs: () => void;
}

export default function LogSidebar({
  isOpen,
  setIsOpen,
  logs,
  onClearLogs
}: LogSidebarProps) {
  return (
    <>
      {/* Collapsible Log Sidebar - Right Side */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-0 top-0 h-full w-80 bg-[#443B43] shadow-2xl z-50 flex flex-col border-l border-[#3C353B]"
          >
            {/* Log Panel Content */}
            <div className="flex flex-col h-full p-4">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#FAF7F2]/10">
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <Bookmark size={14} className="text-gold-shiny" />
                  <span className="text-sm font-bold text-[#E3D9E0] tracking-widest">
                    日志窗口
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#E3D9E0] hover:text-white hover:bg-[#524752] p-1 rounded transition-all cursor-pointer"
                  title="关闭日志"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Log Content */}
              <div id="logContent" className="flex-1 overflow-y-auto text-[11px] font-mono text-[#D7C6D2] space-y-1.5 pr-2 font-medium scrollbar-thin">
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[#8E8276] text-xs">
                    暂无日志记录
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="log-entry leading-relaxed border-b border-[#FAF7F2]/5 py-2 px-1 hover:bg-[#524752]/30 rounded transition-colors">
                      {log}
                    </div>
                  ))
                )}
              </div>

              {/* Clear Logs Button */}
              <div className="mt-3 pt-3 border-t border-[#FAF7F2]/10">
                <button
                  onClick={onClearLogs}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-[#524752] hover:bg-[#5E525E] text-[#E3D9E0] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={12} />
                  清空日志
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button - Only Visible When Closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[#674b2d] px-1.5 py-3 rounded-l-md shadow-md border border-[#E4E8F0] border-r-0 transition-all cursor-pointer z-50 hover:px-2"
          title="展开日志"
        >
          <span className="text-[10px] font-bold tracking-wider" style={{ writingMode: 'vertical-rl' }}>
            日志
          </span>
        </button>
      )}
    </>
  );
}
