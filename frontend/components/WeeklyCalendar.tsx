import React from "react";
import { StreakDayIndicator } from "./StreakDayIndicator";

export interface DayData {
    day: string;
    completed: boolean;
}

interface WeeklyCalendarProps {
    days: DayData[];
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ days }) => {
    return (
        <div className="bg-[#E3C03526] border border-[#FACC15] w-full max-w-[408px] h-auto min-h-[114px] rounded-[16px] py-[24px] px-[12px] md:px-[16px]">
            <div className="flex justify-between items-center gap-[4px] md:gap-[10px]">
                {days.map((dayData, index) => (
                    <StreakDayIndicator
                        key={index}
                        day={dayData.day}
                        completed={dayData.completed}
                    />
                ))}
            </div>
        </div>
    );
};
