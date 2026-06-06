import React from 'react';

interface StatsBarProps {
  furnitureCount: number;
  otherCount: number;
  totalCount: number;
}

export default function StatsBar({
  furnitureCount,
  otherCount,
  totalCount,
}: StatsBarProps) {
  return (
    <div className="stats-area bg-gradient-to-br from-white/95 via-white/90 to-amber-50/80 backdrop-blur-sm border border-amber-200/40 px-5 py-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 select-none">
      <div className="flex items-center justify-between gap-4">
        {/* 左侧标题 */}
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 shadow-sm" />
          <span className="text-xs font-medium text-amber-800/90 tracking-wide">
            库内存量
          </span>
        </div>
        
        {/* 右侧统计数据 */}
        <div className="flex items-center gap-4">
          {/* 家具统计 */}
          <div className="flex flex-col items-center gap-0.5 group cursor-default">
            <span className="text-[9px] text-amber-600/70 font-medium uppercase tracking-wider">家具</span>
            <span className="text-lg font-bold text-amber-900 group-hover:text-amber-700 transition-colors tabular-nums">
              {furnitureCount}
            </span>
          </div>
          
          {/* 分隔线 */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-amber-300/50 to-transparent" />
          
          {/* 其它统计 */}
          <div className="flex flex-col items-center gap-0.5 group cursor-default">
            <span className="text-[9px] text-amber-600/70 font-medium uppercase tracking-wider">其它</span>
            <span className="text-lg font-bold text-amber-900 group-hover:text-amber-700 transition-colors tabular-nums">
              {otherCount}
            </span>
          </div>
          
          {/* 分隔线 */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-amber-300/50 to-transparent" />
          
          {/* 总计 */}
          <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/60 shadow-sm group cursor-default">
            <span className="text-[9px] text-amber-700/80 font-semibold uppercase tracking-wider">总计</span>
            <span className="text-xl font-bold bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent group-hover:from-amber-700 group-hover:to-orange-700 transition-all tabular-nums">
              {totalCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
