import React, { useState } from "react";
import { StreakDayIndicator } from "./StreakDayIndicator";

export interface StreakData {
    [date: string]: {
        completed: boolean;
        inStreak?: boolean;
        missed?: boolean;
    };
}

interface StreakCalendarProps {
    currentMonth: Date;
    streakData: StreakData;
    onMonthChange?: (date: Date) => void;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
    currentMonth,
    streakData,
    onMonthChange,
}) => {
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getDaysInMonth = (date: Date): number => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date): number => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        // Convert Sunday (0) to Monday start (6), and others to Monday-first format
        return firstDay === 0 ? 6 : firstDay - 1;
    };

    const formatDateKey = (year: number, month: number, day: number): string => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const isToday = (year: number, month: number, day: number): boolean => {
        const today = new Date();
        return (
            year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate()
        );
    };

    const handlePreviousMonth = () => {
        const newMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1);
        setSelectedMonth(newMonth);
        onMonthChange?.(newMonth);
    };

    const handleNextMonth = () => {
        const newMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1);
        setSelectedMonth(newMonth);
        onMonthChange?.(newMonth);
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(selectedMonth);
        const firstDayOfMonth = getFirstDayOfMonth(selectedMonth);
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();

        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(
                <div key={`empty-${i}`} className="aspect-square"></div>
            );
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = formatDateKey(year, month, day);
            const dayData = streakData[dateKey];
            const today = isToday(year, month, day);

            let status: 'empty' | 'completed' | 'streak' | 'missed' = 'empty';
            if (dayData?.missed) {
                status = 'missed';
            } else if (dayData?.completed) {
                status = dayData?.inStreak ? 'streak' : 'completed';
            }

            days.push(
                <div key={day} className="aspect-square flex flex-col items-center justify-center gap-1">
                    <span className={`text-xs font-nunito ${today ? 'text-white font-bold' : 'text-[#E6E6E6]'
                        }`}>
                        {day}
                    </span>
                    <StreakDayIndicator
                        status={status}
                        isToday={today}
                        inStreakRun={dayData?.inStreak}
                    />
                </div>
            );
        }

        return days;
    };

    return (
        <div className="w-full flex flex-col items-center">
            {/* Title */}
            <h1 className="text-xl font-nunito font-bold text-left text-white mb-[10px]">
                Streak Calendar
            </h1>
            <div className="bg-[#050C16] border border-[#FACC15]/20 w-full max-w-[400px] rounded-[16px] p-[16px] md:p-[24px]">

                {/* Month Header with Navigation */}
                <div className="flex items-center justify-between mb-[20px]">
                    <button
                        onClick={handlePreviousMonth}
                        className="p-2 rounded-lg hover:bg-[#FACC15]/10 transition-colors"
                        aria-label="Previous month"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#FACC15]">
                            <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <h2 className="text-xl font-nunito font-bold text-white text-center">
                        {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                    </h2>

                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-lg hover:bg-[#FACC15]/10 transition-colors"
                        aria-label="Next month"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#FACC15]">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 mb-[12px]">
                    {weekDays.map((day) => (
                        <div key={day} className="aspect-square flex items-center justify-center">
                            <span className="text-xs font-nunito font-semibold text-[#E6E6E6] uppercase">
                                {day}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {renderCalendarDays()}
                </div>
            </div>
        </div>
    );
};
