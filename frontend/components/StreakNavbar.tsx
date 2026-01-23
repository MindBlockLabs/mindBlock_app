'use client';

import Image from 'next/image';
import Link from 'next/link';

interface StreakNavbarProps {
    streakCount: number;
    points: number;
}

export default function StreakNavbar({ streakCount, points }: StreakNavbarProps) {
    return (
        <nav className="w-full bg-[#050C16] py-[18px] px-[16px] md:px-8 border-b-[1px] border-[#FFFFFF33] flex items-center justify-between">
            {/* Left: Logo and Brand */}
            <Link href="/" className="flex items-center gap-2">
                <Image
                    src="/logo.png"
                    alt="Home"
                    width={34}
                    height={34}
                />
                <span className="text-[#3B82F6] font-bold text-xl">mind block</span>
            </Link>

            {/* Right: Streak, Points, and Profile */}
            <div className="flex items-center gap-4">
                {/* Streak */}
                <div className="flex items-center gap-2">
                    <Image
                        src="/flame.png"
                        alt="Streak"
                        width={20}
                        height={20}
                    />
                    <span className="text-yellow-500 font-semibold text-sm">{streakCount} Day Streak</span>
                </div>

                {/* Points */}
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs">💎</span>
                    </div>
                    <span className="text-blue-400 font-semibold text-sm">{points >= 1000 ? `${(points / 1000).toFixed(1)}K` : points} Points</span>
                </div>

                {/* Profile Icon */}
                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full"></div>
            </div>
        </nav>
    );
}
