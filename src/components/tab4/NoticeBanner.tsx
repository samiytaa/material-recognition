import { AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Notice } from './types';

export function NoticeBanner({ notice }: { notice: Notice | null }) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className={`fixed top-14 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 z-50 ${
            notice.type === 'success'
              ? 'bg-[#8B6F47] text-white'
              : notice.type === 'error'
                ? 'bg-[#D86B6B] text-white'
                : 'bg-[#C59F4A] text-white'
          }`}
        >
          {notice.type === 'error' && <AlertCircle size={14} />}
          <span>{notice.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
