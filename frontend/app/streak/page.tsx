"use client";
import { StreakScreen } from "@/components/StreakScreen";
import { DayData } from "@/components/WeeklyCalendar";
import { useRouter } from "next/navigation";

export default function StreakPage() {
    const router = useRouter();

    // Sample data matching the design (4-day streak)
    const weekData: DayData[] = [
        { day: "MON", completed: true },
        { day: "TUE", completed: true },
        { day: "WED", completed: true },
        { day: "THU", completed: true },
        { day: "FRI", completed: false },
        { day: "SAT", completed: false },
        { day: "SUN", completed: false },
    ];

    return (
        <>
            {/* <StreakNavbar streakCount={3} points={1100} /> */}
            <StreakScreen
                streakCount={4}
                weekData={weekData}
                onContinue={() => router.push("/dashboard")}
            />
        </>
    );
}
