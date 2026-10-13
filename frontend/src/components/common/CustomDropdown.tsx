import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  size?: 'sm' | 'md';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  size = 'md',
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs';

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl bg-[#111827] border border-[#374151] hover:border-[#10B981]/50 text-[#F9FAFB] btn-transition focus:outline-none focus:ring-1 focus:ring-[#10B981] shadow-inner ${sizeClasses} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.icon}
          <span className="font-semibold truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex-shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform duration-200 flex-shrink-0 ${
            open ? 'rotate-180 text-[#10B981]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 min-w-[220px] max-h-64 overflow-y-auto rounded-2xl bg-gradient-to-b from-[#1F2937] to-[#111827] border border-[#374151] shadow-2xl backdrop-blur-2xl p-1.5 animate-in fade-in-0 zoom-in-95 duration-150 space-y-1">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs btn-transition group ${
                  isSelected
                    ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-bold shadow-sm'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#283548] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {opt.icon}
                  <div className="truncate">
                    <div className="truncate font-semibold">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] text-[#9CA3AF] group-hover:text-[#9CA3AF] truncate mt-0.5">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {opt.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#374151] text-[#9CA3AF]">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#10B981]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
