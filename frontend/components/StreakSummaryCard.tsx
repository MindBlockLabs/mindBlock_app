import React from "react";
import Image from "next/image";
import clsx from "clsx";

interface StreakSummaryCardProps {
    streakCount: number;
    isActive?: boolean;
    className?: string;
}

export const StreakSummaryCard: React.FC<StreakSummaryCardProps> = ({
    streakCount,
    isActive = true,
    className,
}) => {
    return (
        <div
            className={clsx(
                "flex flex-col items-center gap-3 md:gap-4 rounded-2xl bg-[#050C16] border border-[#FFFFFF1A] px-8 py-6 md:px-12 md:py-8 w-full max-w-[566px]",
                className
            )}
        >
            {/* Flame Icon */}
            <div
                className={clsx(
                    "relative w-[50px] h-[60px] md:w-[67px] md:h-[80px] transition-all duration-300",
                    !isActive && "grayscale opacity-50"
                )}
            >
                <Image
                    src="/flame.png"
                    alt="Streak flame"
                    width={67}
                    height={80}
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Streak Badge */}
            <div
                className={clsx(
                    "flex items-center justify-center min-w-[48px] h-[48px] md:min-w-[56px] md:h-[56px] rounded-full px-3",
                    isActive
                        ? "bg-[#FACC15] shadow-lg shadow-[#FACC15]/30"
                        : "bg-[#4B5563]"
                )}
            >
                <span className="font-nunito font-bold text-[#050C16] text-[22px] md:text-[26px] leading-none">
                    {streakCount}
                </span>
            </div>

            {/* Streak Label */}
            <p
                className={clsx(
                    "font-nunito font-semibold text-[16px] md:text-[18px] tracking-[0.04em]",
                    isActive ? "text-white" : "text-[#9CA3AF]"
                )}
            >
                day streak!
            </p>
        </div>
    );
};
