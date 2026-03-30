import React, { useCallback, useMemo, useState } from "react";
import { StreakDayIndicator } from "./StreakDayIndicator";

export interface StreakData {
    [date: string]: {
        completed: boolean;
        inStreak?: boolean;
        missed?: boolean;
    };
}

type CalendarCell =
    | { kind: "empty"; key: string }
    | {
          kind: "day";
          key: string;
          day: number;
          dateKey: string;
          today: boolean;
          status: "empty" | "completed" | "streak" | "missed";
          inStreakRun?: boolean;
      };

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addCalendarMonth(date: Date, delta: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function firstWeekdayMondayBased(year: number, month: number): number {
    const dow = new Date(year, month, 1).getDay();
    return dow === 0 ? 6 : dow - 1;
}

function formatDateKey(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface StreakCalendarProps {
    currentMonth: Date;
    streakData: StreakData;
    onMonthChange?: (date: Date) => void;
    variant?: "card" | "panel";
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
    currentMonth,
    streakData,
    onMonthChange,
    variant = "card",
}) => {
    const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(currentMonth));

    const handlePreviousMonth = useCallback(() => {
        setSelectedMonth((prev) => {
            const next = addCalendarMonth(prev, -1);
            onMonthChange?.(next);
            return next;
        });
    }, [onMonthChange]);

    const handleNextMonth = useCallback(() => {
        setSelectedMonth((prev) => {
            const next = addCalendarMonth(prev, 1);
            onMonthChange?.(next);
            return next;
        });
    }, [onMonthChange]);

    const calendarCells = useMemo((): CalendarCell[] => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const dim = daysInMonth(year, month);
        const lead = firstWeekdayMondayBased(year, month);
        const now = new Date();
        const ty = now.getFullYear();
        const tm = now.getMonth();
        const td = now.getDate();

        const cells: CalendarCell[] = [];
        for (let i = 0; i < lead; i++) {
            cells.push({ kind: "empty", key: `empty-${year}-${month}-${i}` });
        }
        for (let day = 1; day <= dim; day++) {
            const dateKey = formatDateKey(year, month, day);
            const dayData = streakData[dateKey];
            const today = ty === year && tm === month && td === day;

            let st: "empty" | "completed" | "streak" | "missed" = "empty";
            if (dayData?.missed) st = "missed";
            else if (dayData?.completed) st = dayData?.inStreak ? "streak" : "completed";

            cells.push({
                kind: "day",
                key: dateKey,
                day,
                dateKey,
                today,
                status: st,
                inStreakRun: dayData?.inStreak,
            });
        }
        return cells;
    }, [selectedMonth, streakData]);

    const isPanel = variant === "panel";

    const monthTitle = isPanel
        ? `${MONTH_NAMES[selectedMonth.getMonth()].slice(0, 3).toUpperCase()} ${selectedMonth.getFullYear()}`
        : `${MONTH_NAMES[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`;

    const outerCardClass = isPanel
        ? "bg-[#050C16] border border-[#FACC15]/20 w-full max-w-[566px] rounded-[16px] p-[16px] md:p-[24px]"
        : "bg-[#050C16] border border-[#FACC15]/20 w-full max-w-[400px] rounded-[16px] p-[16px] md:p-[24px]";

    return (
        <div className="w-full flex flex-col items-center">
            {!isPanel && (
                <h1 className="text-xl font-nunito font-bold text-left text-white mb-[10px]">
                    Streak Calendar
                </h1>
            )}
            <div className={outerCardClass}>
                <div className="flex items-center justify-between mb-[20px]">
                    <button
                        type="button"
                        onClick={handlePreviousMonth}
                        className="p-2 rounded-lg hover:bg-[#FACC15]/10 transition-colors cursor-pointer"
                        aria-label="Previous month"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#FACC15]">
                            <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <h2
                        className={
                            isPanel
                                ? "text-base font-nunito font-bold text-white text-center uppercase tracking-widest"
                                : "text-xl font-nunito font-bold text-white text-center"
                        }
                    >
                        {monthTitle}
                    </h2>

                    <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-2 rounded-lg hover:bg-[#FACC15]/10 transition-colors cursor-pointer"
                        aria-label="Next month"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#FACC15]">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {isPanel && <div className="w-full h-px bg-[#FFFFFF]/10 mb-[16px]" />}

                <div className="grid grid-cols-7 gap-1 mb-[12px]">
                    {WEEK_DAYS.map((day) => (
                        <div key={day} className="aspect-square flex items-center justify-center">
                            <span
                                className={
                                    isPanel
                                        ? "text-xs font-nunito font-semibold text-[#E6E6E6]/50 uppercase"
                                        : "text-xs font-nunito font-semibold text-[#E6E6E6] uppercase"
                                }
                            >
                                {day}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map((cell) => {
                        if (cell.kind === "empty") {
                            return <div key={cell.key} className="aspect-square" />;
                        }
                        const dayLabelClass = isPanel
                            ? cell.today
                                ? "text-xs font-nunito text-white font-bold"
                                : "text-xs font-nunito text-[#E6E6E6]/60"
                            : cell.today
                              ? "text-xs font-nunito text-white font-bold"
                              : "text-xs font-nunito text-[#E6E6E6]";

                        return (
                            <div
                                key={cell.key}
                                className="aspect-square flex flex-col items-center justify-center gap-1"
                            >
                                <span className={dayLabelClass}>{cell.day}</span>
                                <StreakDayIndicator
                                    status={cell.status}
                                    isToday={cell.today}
                                    inStreakRun={cell.inStreakRun}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
