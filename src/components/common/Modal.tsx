import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#3C353B]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          className={`bg-[#FAF7F2] border-2 border-[#DFD2BD] rounded-2xl w-full ${maxWidthStyles[maxWidth]} max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative decorative-corners`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#9E4A4A] via-[#D86B6B] to-[#9E4A4A] py-4 px-6 text-white border-b border-[#C59F4A]/30 flex items-center justify-between select-none">
            <span className="font-serif font-bold text-sm sm:text-base tracking-widest text-[#FFF2C5]">
              {title}
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-[#DFD2BD]/60 bg-[#FAF8F4] py-3.5 px-6 flex justify-end gap-2">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
