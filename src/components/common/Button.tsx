import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

const variantStyles = {
  primary: 'bg-plum-deep text-white hover:bg-[#5C534C] border-[#443B43]',
  secondary: 'bg-[#F2ECE4] text-[#674b2d] hover:bg-[#EADBCC] border-[#E9DFD0]',
  danger: 'bg-[#FFF0F0] text-[#D86B6B] hover:bg-[#FFE0E0] border-[#FFD6D6]',
  success: 'bg-[#8B6F47] text-white hover:bg-[#6F5839] border-[#8B6F47]',
  warning: 'bg-[#FFF8E1] text-[#F57C00] hover:bg-[#FFECB3] border-[#FFE082]',
};

const sizeStyles = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-1.5 text-xs',
  lg: 'px-5 py-2 text-sm',
};

export default function Button({
  onClick,
  disabled = false,
  children,
  icon: Icon,
  variant = 'secondary',
  size = 'md',
  className = '',
  title,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        rounded-lg font-semibold transition-all cursor-pointer
        flex items-center gap-1.5 border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
        ${className}
      `.trim()}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />}
      {children}
    </button>
  );
}
