import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ProgressBarProps {
  visible: boolean;
  percent: number;
  message?: string;
}

export default function ProgressBar({ 
  visible, 
  percent, 
  message = '我是进度条（安心感）' 
}: ProgressBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          className="progress-bar-container bg-[#FFFBF0] border border-[#ECDDB9] rounded-2xl p-4 mt-4 flex items-center gap-4 shadow-md z-30 justify-between decorative-corners"
        >
          <span className="progress-bar-label font-serif font-bold text-[#A67020] text-xs flex items-center gap-1.5">
            <span>🕊️</span>
            {message}
          </span>
          <div className="progress-bar flex-1 h-5 bg-white border border-[#EADBCC] rounded-full overflow-hidden relative shadow-inner">
            <div 
              className="progress-bar-fill h-full bg-gradient-to-r from-[#D4AF37] to-[#C59F4A] transition-all duration-200 flex items-center justify-center text-[10px] font-bold text-white shadow-inner"
              style={{ width: `${percent}%` }}
            >
              <span>{percent}%</span>
            </div>
            <div className="progress-bar-text absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-900/30 pointer-events-none">
              {percent}%
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
