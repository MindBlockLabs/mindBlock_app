"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShareOptionsSheet from "../../components/ShareOptionsSheet";
import ShareStreakCard from "@/components/ShareStreakCard";
import { StreakCalendar, StreakData } from "@/components/StreakCalendar";

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
    const [showShareCard, setShowShareCard] = useState(false);
    const [showShareSheet, setShowShareSheet] = useState(false);

    const streakCount = 4;
    const points = 1100;

    return (
        <div className="min-h-screen bg-[#050C16] flex flex-col">
            {/* Navbar */}
            <StreakNavbar
                streakCount={streakCount}
                points={points}
                onShare={() => setShowShareCard(true)}
                onClose={() => router.push("/dashboard")}
            />

            {/* Page Header */}
            <div className="w-full flex items-center justify-between px-[16px] md:px-8 pt-6 pb-2 max-w-[700px] mx-auto">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="p-2 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
                <h1 className="font-nunito font-bold text-white text-lg tracking-wide">Streak</h1>
                <button
                    onClick={() => setShowShareCard(true)}
                    className="p-2 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
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
                        variant="panel"
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
                isOpen={showShareSheet}
                onClose={() => setShowShareSheet(false)}
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
            {showShareCard && (
                <ShareStreakCard
                    streakCount={streakCount}
                    onClose={() => setShowShareCard(false)}
                    onShare={() => {
                        setShowShareCard(false);
                        setShowShareSheet(true);
                    }}
                />
            )}
        </div>
    );
}