import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageThumbnailProps {
  src: string;
  alt: string;
  onClick?: () => void;
  onDelete?: () => void;
  badge?: string;
  badgeColor?: string;
  index?: number;
  isSelected?: boolean;
}

export default function ImageThumbnail({
  src,
  alt,
  onClick,
  onDelete,
  badge,
  badgeColor = '#D4AF37',
  index,
  isSelected = false,
}: ImageThumbnailProps) {
  return (
    <motion.div
      layoutId={index !== undefined ? `thumbnail-${index}` : undefined}
      onClick={onClick}
      className={`group relative flex flex-col items-center bg-white border rounded-xl p-2 select-none transition-all duration-300 china-border ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isSelected 
          ? 'shadow-lg ring-2 ring-gold-shiny/80 bg-[#FFFDF7] -translate-y-0.5' 
          : 'hover:shadow-md hover:-translate-y-0.5 shadow-sm'
      }`}
    >
      {/* 删除按钮 */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1 left-1 z-20 w-5 h-5 flex items-center justify-center bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
          title="删除此图片"
        >
          <X size={12} />
        </button>
      )}

      <div 
        className="relative w-full aspect-square rounded-lg border flex items-center justify-center transition-all border-[#EADFCD] bg-transparent"
        style={{ 
          backgroundImage: `url(${src})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        {/* 徽章 */}
        {badge && (
          <div className="absolute top-1.5 right-1.5 z-10 pointer-events-none">
            <span 
              className="px-2 py-0.5 text-[9px] font-bold text-white rounded shadow-sm scale-90 origin-top-right"
              style={{ backgroundColor: badgeColor }}
            >
              {badge}
            </span>
          </div>
        )}

        {/* 序号 */}
        {index !== undefined && (
          <span className="absolute bottom-1 left-1.5 text-[9px] font-bold font-mono text-gold-deep/40">
            {index + 1}
          </span>
        )}
      </div>
    </motion.div>
  );
}
