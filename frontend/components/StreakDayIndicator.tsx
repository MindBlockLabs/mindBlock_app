import React from "react";
import Image from "next/image";

export interface StreakDayIndicatorProps {
    status: 'empty' | 'completed' | 'streak';
    isToday?: boolean;
    inStreakRun?: boolean;
}

export const StreakDayIndicator: React.FC<StreakDayIndicatorProps> = ({
    status,
    isToday = false,
    inStreakRun = false,
}) => {
    // Base classes for the perfect circle shape to ensure no layout shift
    const baseClasses = "flex items-center justify-center w-[24px] h-[24px] md:w-[28px] md:h-[28px] rounded-full z-10 shrink-0";
    
    // Status-specific classes
    let statusClasses = "";
    if (status === "empty") {
        statusClasses = "bg-[#E6E6E6]"; 
    } else if (status === "completed") {
        statusClasses = "bg-[#FACC15]";
    } else if (status === "streak") {
        statusClasses = "bg-[#FACC15] shadow-lg shadow-[#FACC15]/50";
    }

    // isToday styling (adding ring to distinguish)
    const todayClasses = isToday ? "ring-2 ring-white ring-offset-2 ring-offset-[#050C16]" : "";

    return (
        <div className="relative flex items-center justify-center w-[24px] h-[24px] md:w-[28px] md:h-[28px]">
            {/* Optional highlighted background for streak run */}
            {inStreakRun && status === "streak" && (
                <div className="absolute w-[200%] h-full bg-[#FACC15]/10 rounded-full z-0" />
            )}
            
            <div className={`${baseClasses} ${statusClasses} ${todayClasses}`}>
                {status === "streak" && (
                    <Image src="/fire.svg" alt="streak fire" width={14} height={16} className="w-[12px] h-[14px] md:w-[14px] md:h-[16px]" />
                )}
            </div>
        </div>
    );
};
