import React from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-xl font-bold',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name = 'Alex Rivera',
  size = 'sm',
  className = '',
}) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AR';

  const sizeClass = sizeMap[size];

  if (avatarUrl) {
    return (
      <div
        className={`relative inline-block rounded-full overflow-hidden border border-[#10B981]/40 shadow-sm flex-shrink-0 bg-[#111827] ${sizeClass} ${className}`}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // fallback if broken image URL
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-[#10B981]/25 via-[#10B981]/15 to-[#3B82F6]/20 border border-[#10B981]/40 text-[#10B981] font-bold shadow-sm flex-shrink-0 select-none ${sizeClass} ${className}`}
    >
      {initials}
    </div>
  );
};
