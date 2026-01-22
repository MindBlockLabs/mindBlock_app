import React from "react";
import Image from "next/image";

interface StreakHeaderProps {
    streakCount: number;
}

export const StreakHeader: React.FC<StreakHeaderProps> = ({ streakCount }) => {
    return (
        <div className="flex flex-col items-center gap-10">
            <div className="relative w-[67px] h-[80px]">
                <Image
                    src="/flame.png"
                    alt="Flame"
                    width={67}
                    height={80}
                    className="w-full h-full object-contain"
                />
            </div>
            <h2 className="font-nunito font-bold text-white text-center leading-[100%] text-[28px] md:text-[32px] tracking-[0.04em]">
                {streakCount} Day Streak
            </h2>
        </div>
    );
};
