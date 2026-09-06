import { cn } from "cn";

interface BotAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BotAvatar({ className, size = "md" }: BotAvatarProps) {
  const sizeClasses = {
    sm: "size-7 rounded-lg text-xs",
    md: "size-10 rounded-xl text-base",
    lg: "size-12 rounded-xl text-lg",
  };

  const iconSizes = {
    sm: 16,
    md: 22,
    lg: 26,
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-gradient-to-b from-[#212338] to-[#161726] border border-white/10 shadow-inner overflow-hidden",
        sizeClasses[size],
        className,
      )}
    >
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white drop-shadow-sm"
      >
        {/* Antennas */}
        <circle cx="16" cy="4" r="2" fill="#ec4899" />
        <line x1="16" y1="6" x2="16" y2="9" stroke="#ec4899" strokeWidth="2" />
        <circle cx="7" cy="8" r="1.5" fill="#a855f7" />
        <line x1="7" y1="9.5" x2="10" y2="12" stroke="#a855f7" strokeWidth="1.5" />
        <circle cx="25" cy="8" r="1.5" fill="#a855f7" />
        <line x1="25" y1="9.5" x2="22" y2="12" stroke="#a855f7" strokeWidth="1.5" />

        {/* Head */}
        <rect
          x="5"
          y="9"
          width="22"
          height="18"
          rx="5"
          fill="#1e2238"
          stroke="#4f46e5"
          strokeWidth="1.5"
        />

        {/* Screen/Face */}
        <rect
          x="8"
          y="12"
          width="16"
          height="12"
          rx="3"
          fill="#0c0e18"
        />

        {/* Glowing Eyes */}
        <rect x="11" y="15" width="3" height="3" rx="1" fill="#38bdf8" />
        <rect x="18" y="15" width="3" height="3" rx="1" fill="#38bdf8" />

        {/* Smile */}
        <path
          d="M13 20C14 21 18 21 19 20"
          stroke="#ec4899"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
