import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = '搜索...',
  onClear,
}: SearchInputProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gold-deep">
        <Search size={14} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-16 py-2.5 text-center text-xs bg-[#FAF7F2] border border-[#E4E8F0] focus:border-gold-shiny focus:ring-1 focus:ring-gold-shiny outline-none text-[#674b2d] placeholder-[#A2978E] font-medium rounded-lg transition-all"
      />
      {value && (
        <button
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute inset-y-1.5 right-2 px-3 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-md bg-[#EADBCC] text-[#674b2d] hover:bg-[#E3CBB3] transition-all cursor-pointer"
        >
          清空
        </button>
      )}
    </div>
  );
}
