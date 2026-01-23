"use client";
import React from "react";
import { StreakHeader } from "./StreakHeader";
import { WeeklyCalendar, DayData } from "./WeeklyCalendar";
import { StreakFooter } from "./StreakFooter";

interface StreakScreenProps {
    streakCount: number;
    weekData: DayData[];
    onContinue: () => void;
}

export const StreakScreen: React.FC<StreakScreenProps> = ({
    streakCount,
    weekData,
    onContinue,
}) => {
    return (
        <div className="min-h-screen bg-[#050C16] flex items-center justify-center px-4 py-4 md:px-6 md:py-8 overflow-hidden">
            <div className="max-w-[566px] w-full space-y-6 md:space-y-10 flex flex-col items-center justify-center h-full md:h-auto">
                <StreakHeader streakCount={streakCount} />
                <WeeklyCalendar days={weekData} />
                <StreakFooter onContinue={onContinue} />
            </div>
        </div>
    );
};

