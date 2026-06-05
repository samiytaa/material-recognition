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
    <div className="stats-area bg-[#FAF8F5]/60 border border-[#E9DFD0] px-4 py-2.5 rounded-xl flex items-center justify-between text-xs select-none">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gold-deep" />
        <span className="font-serif font-bold text-[11px] text-[#A67020] tracking-wider">
          库内存量统计
        </span>
      </div>
      
      <div className="flex items-center gap-3 font-mono text-[11px]">
        <div className="flex items-center gap-1">
          <span className="text-[#8E8276] text-[10px]">家具</span>
          <span className="font-bold text-[#674b2d]">{furnitureCount}</span>
        </div>
        <span className="text-[#DFD2BD]">|</span>
        <div className="flex items-center gap-1">
          <span className="text-[#8E8276] text-[10px]">其它</span>
          <span className="font-bold text-[#674b2d]">{otherCount}</span>
        </div>
        <span className="text-[#DFD2BD]">|</span>
        <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-[#E9DFD0] shadow-xs">
          <span className="text-gold-deep font-bold font-serif text-[10px]">共</span>
          <span className="font-bold text-[#9E4A4A]">{totalCount}</span>
        </div>
      </div>
    </div>
  );
}
