import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div className={`bg-white border border-[#DFD2BD]/60 rounded-2xl shadow-sm ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-b border-[#EEDFCA] pb-3 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[#8B6F47]">
      {icon && <span className="text-sm">✦</span>}
      <h2 className="font-serif font-bold text-[#8B6F47] text-sm md:text-base tracking-wider">
        {children}
      </h2>
    </div>
  );
}
