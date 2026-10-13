import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCheck,
  FileCheck,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status?.toLowerCase() || '';

  // Semantic Design Tokens:
  // Emerald for confirmed
  // Amber for needs review / warning
  // Red for critical errors
  let config = {
    bg: 'bg-[#374151]',
    text: 'text-[#9CA3AF]',
    border: 'border-[#4B5563]',
    icon: Clock,
  };

  if (norm.includes('confirmed')) {
    config = {
      bg: 'bg-[#10B981]/15',
      text: 'text-[#10B981]',
      border: 'border-[#10B981]/30',
      icon: CheckCircle2,
    };
  } else if (norm.includes('reviewed')) {
    config = {
      bg: 'bg-[#60A5FA]/15',
      text: 'text-[#60A5FA]',
      border: 'border-[#60A5FA]/30',
      icon: CheckCheck,
    };
  } else if (norm.includes('needs review') || norm.includes('processing')) {
    config = {
      bg: 'bg-[#F59E0B]/15',
      text: 'text-[#F59E0B]',
      border: 'border-[#F59E0B]/30',
      icon: AlertTriangle,
    };
  } else if (norm.includes('exported')) {
    config = {
      bg: 'bg-[#A78BFA]/15',
      text: 'text-[#A78BFA]',
      border: 'border-[#A78BFA]/30',
      icon: FileCheck,
    };
  } else if (norm.includes('critical') || norm.includes('error')) {
    config = {
      bg: 'bg-[#F87171]/15',
      text: 'text-[#F87171]',
      border: 'border-[#F87171]/30',
      icon: AlertCircle,
    };
  } else if (norm.includes('warning')) {
    config = {
      bg: 'bg-[#F59E0B]/15',
      text: 'text-[#F59E0B]',
      border: 'border-[#F59E0B]/30',
      icon: AlertTriangle,
    };
  } else if (norm.includes('info')) {
    config = {
      bg: 'bg-[#60A5FA]/15',
      text: 'text-[#60A5FA]',
      border: 'border-[#60A5FA]/30',
      icon: Info,
    };
  }

  const Icon = config.icon;
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md border ${config.bg} ${config.text} ${config.border} ${paddingClass} tabular-nums`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 flex-shrink-0' : 'w-3.5 h-3.5 flex-shrink-0'} />
      <span>{status}</span>
    </span>
  );
};

export interface VerificationTierBadgeProps {
  tier: 'ai_extracted' | 'validated' | 'human_confirmed';
  size?: 'sm' | 'md';
}

export const VerificationTierBadge: React.FC<VerificationTierBadgeProps> = ({
  tier,
  size = 'sm',
}) => {
  if (tier === 'human_confirmed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
        <UserCheck className="w-3 h-3" />
        Human Confirmed
      </span>
    );
  }
  if (tier === 'validated') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
        <ShieldCheck className="w-3 h-3" />
        Rule Validated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#374151] text-[#9CA3AF] border border-[#4B5563]">
      <Sparkles className="w-3 h-3" />
      AI Extracted
    </span>
  );
};

export const formatCents = (cents: number, currency = 'USD'): string => {
  const amount = (cents / 100).toFixed(2);
  const symbol =
    currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';
  return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};
