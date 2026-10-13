import React, { useRef, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

export interface AuditTextareaProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minRows?: number;
  maxLength?: number;
  quickChips?: string[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_CHIPS = [
  'Verified physical receipt',
  'Approved rate discount',
  'Standard penny roundoff',
  'Confirmed recurring vendor contract',
  'Dismissed as informational note',
];

export const AuditTextarea: React.FC<AuditTextareaProps> = ({
  value,
  onChange,
  label = 'Audit Rationale / Justification Note',
  placeholder = 'Explain why this exception is cleared or field was updated for IRS / tax audit trails...',
  minRows = 3,
  maxLength = 500,
  quickChips = DEFAULT_CHIPS,
  disabled = false,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height to accommodate text
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const calculatedHeight = Math.min(Math.max(el.scrollHeight, minRows * 24 + 16), 260);
      el.style.height = `${calculatedHeight}px`;
    }
  }, [value, minRows]);

  const handleChipClick = (chip: string) => {
    if (disabled) return;
    if (!value.trim()) {
      onChange(chip);
    } else if (!value.includes(chip)) {
      onChange(`${value.trim()}. ${chip}`);
    }
    textareaRef.current?.focus();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Character Count */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
            <span>{label}</span>
          </label>
        )}
        <span
          className={`text-[10px] font-mono tabular-nums ${
            value.length >= maxLength ? 'text-[#F87171] font-bold' : 'text-[#6B7280]'
          }`}
        >
          {value.length} / {maxLength}
        </span>
      </div>

      {/* Styled Auto-Growing Textarea Container */}
      <div className="relative rounded-xl border border-[#374151] bg-[#111827] focus-within:border-[#10B981] focus-within:ring-1 focus-within:ring-[#10B981]/30 transition-all shadow-inner">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          disabled={disabled}
          placeholder={placeholder}
          rows={minRows}
          className="w-full px-3.5 py-2.5 bg-transparent text-xs text-[#F9FAFB] placeholder-[#6B7280] leading-relaxed resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Clear note"
            className="absolute top-2.5 right-2.5 p-1 rounded-md text-[#6B7280] hover:text-[#F9FAFB] hover:bg-[#1F2937] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Rationale Insert Chips */}
      {quickChips && quickChips.length > 0 && !disabled && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-[#6B7280] font-semibold">
            <Sparkles className="w-3 h-3 text-[#10B981]" />
            <span>Quick Audit Rationale Tags:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="px-2 py-0.5 rounded-md bg-[#1F2937] hover:bg-[#283548] text-[#9CA3AF] hover:text-[#10B981] border border-[#374151] hover:border-[#10B981]/40 text-[10px] font-medium transition-all"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
