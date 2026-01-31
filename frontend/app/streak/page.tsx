"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { StreakScreen } from "@/components/StreakScreen";
import { DayData } from "@/components/WeeklyCalendar";
import { useRouter } from "next/navigation";

export default function StreakPage() {
  const router = useRouter();
  const { currentStreak, streakDates, isLoading, timeZone } = useStreak();

  const weekData: DayData[] = useMemo(() => {
    const zonedNow = toZonedDate(new Date(), timeZone);
    const weekStart = startOfWeekMonday(zonedNow);

    return WEEKDAY_LABELS.map((label, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      const dayKey = isoDateString(dayDate);

      return {
        day: label,
        completed: streakDates.includes(dayKey),
      };
    });
  }, [streakDates, timeZone]);

  return (
    <StreakScreen
      streakCount={isLoading ? 0 : currentStreak}
      weekData={weekData}
      onContinue={() => router.push("/dashboard")}
    />
  );
}
