"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShareOptionsSheet from "../../components/ShareOptionsSheet";
import ShareStreakCard from "@/components/ShareStreakCard";

export interface StreakData {
    [date: string]: {
        completed: boolean;
        inStreak?: boolean;
        missed?: boolean;
    };
}

export interface DayData {
    day: string;
    completed: boolean;
}

interface StreakDayIndicatorProps {
    status: "empty" | "completed" | "streak" | "missed";
    isToday?: boolean;
    inStreakRun?: boolean;
}

const StreakDayIndicator: React.FC<StreakDayIndicatorProps> = ({
    status,
    isToday = false,
    inStreakRun = false,
}) => {
    const baseClasses =
        "flex items-center justify-center w-[24px] h-[24px] md:w-[28px] md:h-[28px] rounded-full z-10 shrink-0";

    let statusClasses = "";
    if (status === "empty") statusClasses = "bg-[#E6E6E6]/20";
    else if (status === "completed") statusClasses = "bg-[#FACC15]";
    else if (status === "streak")
        statusClasses = "bg-[#FACC15] shadow-lg shadow-[#FACC15]/50";
    else if (status === "missed") statusClasses = "bg-white/30";

    const todayClasses = isToday
        ? "ring-2 ring-white ring-offset-2 ring-offset-[#050C16]"
        : "";

    return (
        <div className="relative flex items-center justify-center w-[24px] h-[24px] md:w-[28px] md:h-[28px]">
            {inStreakRun && status === "streak" && (
                <div className="absolute w-[300%] h-[8px] bg-[#FACC15]/20 rounded-full z-0" />
            )}
            <div className={`${baseClasses} ${statusClasses} ${todayClasses}`}>
                {status === "streak" && (
                    <span className="text-[10px]">🔥</span>
                )}
            </div>
        </div>
    );
};

interface StreakCalendarProps {
    currentMonth: Date;
    streakData: StreakData;
    onMonthChange?: (date: Date) => void;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({
    currentMonth,
    streakData,
    onMonthChange,
}) => {
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    const getDaysInMonth = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const getFirstDayOfMonth = (date: Date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return firstDay === 0 ? 6 : firstDay - 1;
    };

    const formatDateKey = (year: number, month: number, day: number) =>
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const isToday = (year: number, month: number, day: number) => {
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

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="aspect-square" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = formatDateKey(year, month, day);
            const dayData = streakData[dateKey];
            const today = isToday(year, month, day);

            let status: "empty" | "completed" | "streak" | "missed" = "empty";
            if (dayData?.missed) status = "missed";
            else if (dayData?.completed)
                status = dayData?.inStreak ? "streak" : "completed";

            days.push(
                <div
                    key={day}
                    className="aspect-square flex flex-col items-center justify-center gap-1"
                >
                    <span
                        className={`text-xs font-nunito ${
                            today ? "text-white font-bold" : "text-[#E6E6E6]/60"
                        }`}
                    >
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
            <div className="bg-[#050C16] border border-[#FACC15]/20 w-full max-w-[566px] rounded-[16px] p-[16px] md:p-[24px]">
                {/* Month Header */}
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
                    <h2 className="text-base font-nunito font-bold text-white text-center uppercase tracking-widest">
                        {monthNames[selectedMonth.getMonth()].slice(0, 3).toUpperCase()}{" "}
                        {selectedMonth.getFullYear()}
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

                {/* Divider */}
                <div className="w-full h-px bg-[#FFFFFF]/10 mb-[16px]" />

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 mb-[12px]">
                    {weekDays.map((day) => (
                        <div key={day} className="aspect-square flex items-center justify-center">
                            <span className="text-xs font-nunito font-semibold text-[#E6E6E6]/50 uppercase">
                                {day}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
            </div>
        </div>
    );
};

interface StreakSummaryCardProps {
    streakCount: number;
    isActive?: boolean;
}

const StreakSummaryCard: React.FC<StreakSummaryCardProps> = ({
    streakCount,
    isActive = true,
}) => {
    return (
        <div className="flex items-center justify-between rounded-2xl bg-[#0D1829] border border-[#FFFFFF1A] px-8 py-6 w-full max-w-[566px]">
            <div className="flex flex-col gap-1">
                {/* Number badge */}
                <div
                    className={`flex items-center justify-center w-[48px] h-[48px] rounded-[10px] mb-2 ${
                        isActive ? "bg-[#FACC15]" : "bg-[#4B5563]"
                    }`}
                >
                    <span
                        className={`font-nunito font-extrabold text-[26px] leading-none ${
                            isActive ? "text-[#050C16]" : "text-[#9CA3AF]"
                        }`}
                    >
                        {streakCount}
                    </span>
                </div>
                <p
                    className={`font-nunito font-bold text-[20px] tracking-[0.02em] ${
                        isActive ? "text-white" : "text-[#9CA3AF]"
                    }`}
                >
                    day streak!
                </p>
            </div>

            {/* Flame */}
            <div className={`relative w-[67px] h-[80px] ${!isActive ? "grayscale opacity-40" : ""}`}>
                {/* Flame SVG inline since we don't have the asset in this context */}
                <svg viewBox="0 0 67 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path
                        d="M33.5 4C33.5 4 44 18 44 30C44 36.627 40.627 42.5 35.5 46C37 40 34 34 30 31C30.5 37 27 43 22 46C20 42 19 37.5 19 33C19 26 22 19 26 15C24 20 24.5 25 27 28C27 18 33.5 4 33.5 4Z"
                        fill={isActive ? "#FACC15" : "#6B7280"}
                    />
                    <path
                        d="M33.5 10C33.5 10 50 28 50 44C50 57.807 43.031 68 33.5 68C23.969 68 17 57.807 17 44C17 34 21 24 27 17C25 23 25.5 29 28 33C28 23 33.5 10 33.5 10Z"
                        fill={isActive ? "#FACC15" : "#6B7280"}
                        fillOpacity="0.8"
                    />
                    <ellipse
                        cx="33.5"
                        cy="52"
                        rx="9"
                        ry="11"
                        fill={isActive ? "#FDE68A" : "#9CA3AF"}
                        fillOpacity="0.6"
                    />
                </svg>
            </div>
        </div>
    );
};



interface StreakNavbarProps {
    streakCount: number;
    points: number;
    onShare: () => void;
    onClose: () => void;
}

const StreakNavbar: React.FC<StreakNavbarProps> = ({ streakCount, points, onShare, onClose }) => {
    return (
        <nav className="w-full bg-[#050C16] py-[18px] px-[16px] md:px-8 border-b border-[#FFFFFF1A] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
                <div className="w-[34px] h-[34px] rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    M
                </div>
                <span className="text-[#3B82F6] font-bold text-xl">mind block</span>
            </Link>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                    <span className="text-lg">🔥</span>
                    <span className="text-yellow-400 font-semibold text-sm">{streakCount} Day Streak</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-lg">💎</span>
                    <span className="text-blue-400 font-semibold text-sm">
                        {points >= 1000 ? `${(points / 1000).toFixed(1)}K` : points} Points
                    </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
            </div>
        </nav>
    );
};

// Demo streak data
const DEMO_STREAK_DATA: StreakData = (() => {
    const data: StreakData = {};
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // Simulate a streak run from day 14 to 20
    for (let d = 14; d <= 20; d++) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        data[key] = { completed: true, inStreak: true };
    }
    // And current streak (last 4 days incl today)
    for (let i = 3; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split("T")[0];
        data[key] = { completed: true, inStreak: true };
    }
    // A couple of solo completed days
    const solo1 = `${year}-${String(month + 1).padStart(2, "0")}-08`;
    const solo2 = `${year}-${String(month + 1).padStart(2, "0")}-10`;
    data[solo1] = { completed: true, inStreak: false };
    data[solo2] = { completed: true, inStreak: false };

    return data;
})();

export default function StreakPage() {
    const router = useRouter();
    const [showShare, setShowShare] = useState(false);

    const streakCount = 4;
    const points = 1100;

    return (
        <div className="min-h-screen bg-[#050C16] flex flex-col">
            {/* Navbar */}
            <StreakNavbar
                streakCount={streakCount}
                points={points}
                onShare={() => setShowShare(true)}
                onClose={() => router.push("/dashboard")}
            />

            {/* Page Header */}
            <div className="w-full flex items-center justify-between px-[16px] md:px-8 pt-6 pb-2 max-w-[700px] mx-auto">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="p-2 rounded-lg text-white/60 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
                <h1 className="font-nunito font-bold text-white text-lg tracking-wide">Streak</h1>
                <button
                    onClick={() => setShowShare(true)}
                    className="p-2 rounded-lg text-white/60 hover:text-white transition-colors"
                    aria-label="Share"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="15" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="15" cy="16" r="2" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M13 5L7 9M13 15L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center px-4 py-4 gap-6 max-w-[700px] mx-auto w-full">
                {/* Streak Summary Card */}
                <StreakSummaryCard streakCount={streakCount} isActive={streakCount > 0} />

                {/* Streak Calendar Section */}
                <div className="w-full max-w-[566px]">
                    <h2 className="text-xl font-nunito font-bold text-white mb-[10px]">
                        Streak Calendar
                    </h2>
                    <StreakCalendar
                        currentMonth={new Date()}
                        streakData={DEMO_STREAK_DATA}
                    />
                </div>

                {/* Continue Button */}
                {/* <button
                    onClick={() => router.push("/dashboard")}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white font-semibold font-nunito transition-colors duration-200 shadow-lg w-full max-w-[566px] h-[50px] rounded-[8px] py-[14px] px-[10px]"
                >
                    Continue
                </button> */}
            </main>

            {/* Share Options Sheet */}
            <ShareOptionsSheet
                isOpen={showShare}
                onClose={() => setShowShare(false)}
                onShare={(platform) => {
                    console.log(`Sharing streak to ${platform}`);
                    // Handle sharing logic here
                    switch (platform) {
                        case 'contacts':
                            if (navigator.share) {
                                navigator.share({
                                    title: `I'm on a ${streakCount} day streak!`,
                                    text: `Check out my ${streakCount} day streak on MindBlock! 🔥`,
                                    url: window.location.href,
                                });
                            }
                            break;
                        case 'telegram':
                            const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`I'm on a ${streakCount} day streak on MindBlock! 🔥`)}`;
                            window.open(telegramUrl, '_blank');
                            break;
                        case 'twitter':
                            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm on a ${streakCount} day streak on MindBlock! 🔥`)}&url=${encodeURIComponent(window.location.href)}`;
                            window.open(twitterUrl, '_blank');
                            break;
                        case 'whatsapp':
                            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`I'm on a ${streakCount} day streak on MindBlock! 🔥 ${window.location.href}`)}`;
                            window.open(whatsappUrl, '_blank');
                            break;
                        case 'email':
                            const emailUrl = `mailto:?subject=${encodeURIComponent('Check out my MindBlock streak!')}&body=${encodeURIComponent(`I'm on a ${streakCount} day streak on MindBlock! Check it out: ${window.location.href}`)}`;
                            window.location.href = emailUrl;
                            break;
                        case 'more':
                            if (navigator.share) {
                                navigator.share({
                                    title: 'My MindBlock Streak',
                                    text: `I'm on a ${streakCount} day streak!`,
                                    url: window.location.href,
                                });
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Link copied to clipboard!');
                            }
                            break;
                    }
                }}
            />
            {/* Share Modal */}
            {showShare && (
                <ShareStreakCard
                    streakCount={streakCount}
                    onClose={() => setShowShare(false)}
                />
            )}
        </div>
    );
}