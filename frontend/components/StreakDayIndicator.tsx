import React from "react";

interface StreakDayIndicatorProps {
    day: string;
    completed: boolean;
}

export const StreakDayIndicator: React.FC<StreakDayIndicatorProps> = ({
    day,
    completed,
}) => {
    return (
        <div className="flex flex-col items-center gap-[6px] md:gap-[10px]">
            <span className={`text-[10px] md:text-xs font-nunito font-semibold uppercase ${completed ? "text-[#FACC15]" : "text-[#E6E6E6]"}`}>
                {day}
            </span>
            <div
                className={`flex items-center justify-center w-[24px] h-[24px] md:w-[28px] md:h-[28px] rounded-[25px] ${completed
                    ? "bg-[#FACC15] shadow-lg shadow-[#FACC15]/50 py-[9px] px-[7px] md:py-[11px] md:px-[9px]"
                    : "bg-[#E6E6E6] border-2 border-[#E6E6E6]"
                    }`}
            >
                {completed && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
        </div>
    );
};
