import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface CategoryNode {
  level1: string;
  level2: string[];
}

interface CategoryFilterProps {
  categoryTree: CategoryNode[];
  currentFilter: { level1: string; level2: string | null };
  onFilterChange: (filter: { level1: string; level2: string | null }) => void;
  expandedL1: string | null;
  onExpand: (level1: string | null) => void;
}

export default function CategoryFilter({
  categoryTree,
  currentFilter,
  onFilterChange,
  expandedL1,
  onExpand,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      {/* 一级分类行 */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {/* 全部 */}
        <button
          onClick={() => {
            onFilterChange({ level1: 'all', level2: null });
            onExpand(null);
          }}
          className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
            currentFilter.level1 === 'all'
              ? 'bg-plum-deep text-white shadow-sm'
              : 'bg-[#F2ECE4] text-[#674b2d] hover:bg-[#EADBCC]'
          }`}
        >
          全部
        </button>

        {/* 各一级分类 */}
        {categoryTree.map(node => {
          const isActiveL1 = currentFilter.level1 === node.level1;
          const isExpanded = expandedL1 === node.level1;
          return (
            <button
              key={node.level1}
              onClick={() => {
                if (isExpanded) {
                  onExpand(null);
                } else {
                  onExpand(node.level1);
                  onFilterChange({ level1: node.level1, level2: null });
                }
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                isActiveL1
                  ? 'bg-plum-deep text-white shadow-sm'
                  : 'bg-[#F2ECE4] text-[#674b2d] hover:bg-[#EADBCC]'
              }`}
            >
              {node.level1}
              <ChevronDown
                size={11}
                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          );
        })}
      </div>

      {/* 二级分类行（动态展开） */}
      <AnimatePresence>
        {expandedL1 && (() => {
          const node = categoryTree.find(n => n.level1 === expandedL1);
          if (!node) return null;
          return (
            <motion.div
              key={expandedL1}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1 pt-1 pl-2 border-l-2 border-[#C59F4A]/30">
                {/* 二级「全部」 */}
                <button
                  onClick={() => {
                    onFilterChange({ level1: expandedL1, level2: null });
                  }}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                    currentFilter.level1 === expandedL1 && currentFilter.level2 === null
                      ? 'bg-gold-deep text-white shadow-sm'
                      : 'bg-[#FAF2E5] text-[#8E6B3A] hover:bg-[#F0E4CC]'
                  }`}
                >
                  全部
                </button>
                {node.level2.map(sub => (
                  <button
                    key={sub}
                    onClick={() => {
                      onFilterChange({ level1: expandedL1, level2: sub });
                    }}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                      currentFilter.level2 === sub
                        ? 'bg-gold-deep text-white shadow-sm'
                        : 'bg-[#FAF2E5] text-[#8E6B3A] hover:bg-[#F0E4CC]'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
