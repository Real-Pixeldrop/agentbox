"use client";

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a consistent color from a string (agent name).
 * Returns a CSS gradient string.
 */
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
    'from-lime-500 to-green-600',
    'from-sky-500 to-indigo-600',
    'from-red-500 to-rose-600',
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

interface AgentAvatarProps {
  name: string;
  photo?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  active?: boolean;
  showStatus?: boolean;
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-9 h-9 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-xl',
};

const statusSizeMap = {
  xs: 'w-2 h-2 border',
  sm: 'w-3 h-3 border-2',
  md: 'w-3.5 h-3.5 border-2',
  lg: 'w-4 h-4 border-2',
};

export default function AgentAvatar({ name, photo, size = 'md', active, showStatus = false, className }: AgentAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const colorGradient = getAvatarColor(name);
  
  return (
    <div className={cn("relative flex-shrink-0", className)}>
      {photo ? (
        <img
          src={photo}
          alt={name}
          className={cn(
            "rounded-full object-cover border-2 transition-all duration-500",
            sizeMap[size],
            active ? "border-blue-500/50" : "border-slate-700",
            active === false && "grayscale"
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full border-2 flex items-center justify-center font-bold bg-gradient-to-br text-white transition-all duration-500",
            sizeMap[size],
            colorGradient,
            active ? "border-blue-500/50" : active === false ? "border-slate-700 grayscale" : "border-slate-700"
          )}
        >
          {initial}
        </div>
      )}
      {showStatus && active !== undefined && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-[#131825]",
            statusSizeMap[size],
            active
              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
              : "bg-slate-600"
          )}
        />
      )}
    </div>
  );
}

export { getAvatarColor };
