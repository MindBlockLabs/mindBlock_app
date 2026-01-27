"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { StreakScreen } from "@/components/StreakScreen";
import { DayData } from "@/components/WeeklyCalendar";
import { useStreak } from "@/providers/StreakProvider";

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function toZonedDate(date: Date, timeZone: string) {
  const localized = date.toLocaleString("en-US", { timeZone });
  return new Date(localized);
}

function isoDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

function startOfWeekMonday(date: Date) {
  const jsDay = date.getDay(); // 0 = Sunday
  const diffToMonday = (jsDay + 6) % 7; // convert Sunday=0 -> 6, Monday=1 ->0
  const start = new Date(date);
  start.setDate(date.getDate() - diffToMonday);
  return start;
}

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
