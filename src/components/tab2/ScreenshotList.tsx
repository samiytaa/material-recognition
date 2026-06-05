import React from 'react';
import { motion } from 'motion/react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface Screenshot {
  id: number;
  name: string;
  dataUrl: string;
}

interface ScreenshotListProps {
  screenshots: Screenshot[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: (id: number) => void;
}

export default function ScreenshotList({
  screenshots,
  isExpanded,
  onToggleExpand,
  onDelete,
}: ScreenshotListProps) {
  if (screenshots.length === 0) return null;

  return (
    <div className="bg-white border border-[#DFD2BD]/60 rounded-xl shadow-sm overflow-hidden flex-shrink-0">
      <div 
        className="px-3 py-2 bg-[#FAF8F4] border-b border-[#E9DFDB] flex items-center justify-between cursor-pointer hover:bg-[#F5F0E8] transition-colors"
        onClick={onToggleExpand}
      >
        <h3 className="text-xs font-bold text-[#674b2d]">
          待处理截图 ({screenshots.length})
        </h3>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gold-deep" />
        ) : (
          <ChevronDown size={16} className="text-gold-deep" />
        )}
      </div>
      {isExpanded && (
        <div className="max-h-40 overflow-y-auto p-2 scrollbar-thin">
          <div className="grid grid-cols-3 gap-2">
            {screenshots.map((screenshot) => (
              <div 
                key={screenshot.id}
                className="relative group aspect-square rounded-lg border-2 border-[#E9DFDB] overflow-hidden bg-[#FDFBF8] hover:border-gold-shiny transition-all"
              >
                <img 
                  src={screenshot.dataUrl}
                  alt={screenshot.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(screenshot.id);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="删除截图"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {screenshot.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
