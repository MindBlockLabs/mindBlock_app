"use client";
import { StreakScreen } from "@/components/StreakScreen";
import { DayData } from "@/components/WeeklyCalendar";
import { useRouter } from "next/navigation";
import { useStreak } from "@/hooks/useStreak";
import { useMemo } from "react";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getWeekData(streakDates: string[]): DayData[] {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Build array for the current week (Sun-Sat)
    return DAYS.map((day, index) => {
        // Calculate date for this day of the week
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() - (currentDay - index));
        const dateString = dayDate.toISOString().split("T")[0];
        
        return {
            day,
            completed: streakDates.includes(dateString),
        };
    });
}

export default function StreakPage() {
    const router = useRouter();
    const { currentStreak, streakDates, isLoading } = useStreak({ autoFetch: true });

    const weekData = useMemo(() => getWeekData(streakDates), [streakDates]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050C16] flex items-center justify-center">
                <div className="text-white">Loading streak...</div>
            </div>
        );
    }

    return (
        <>
            <StreakScreen
                streakCount={currentStreak}
                weekData={weekData}
                onContinue={() => router.push("/dashboard")}
            />
        </>
    );
}
