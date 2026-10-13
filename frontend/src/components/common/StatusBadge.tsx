import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCheck,
  FileCheck,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status?.toLowerCase() || '';

  let config = {
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-700',
    icon: Clock,
  };

  if (norm.includes('confirmed')) {
    config = {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: CheckCircle2,
    };
  } else if (norm.includes('reviewed')) {
    config = {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      icon: CheckCheck,
    };
  } else if (norm.includes('needs review') || norm.includes('processing')) {
    config = {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: AlertTriangle,
    };
  } else if (norm.includes('exported')) {
    config = {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      icon: FileCheck,
    };
  } else if (norm.includes('critical') || norm.includes('error')) {
    config = {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      icon: AlertCircle,
    };
  } else if (norm.includes('warning')) {
    config = {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: AlertTriangle,
    };
  } else if (norm.includes('info')) {
    config = {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      icon: Info,
    };
  }

  const Icon = config.icon;
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${paddingClass}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {status}
    </span>
  );
};

export const formatCents = (cents: number, currency = 'USD'): string => {
  const amount = (cents / 100).toFixed(2);
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';
  return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};
