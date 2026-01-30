'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { useOnboarding } from '../OnboardingContext';
import Image from 'next/image';

const levels = [
    { id: 'BEGINNER', label: 'I am a total beginner', icon: '/icon-level-beginner.svg' },
    { id: 'INTERMEDIATE', label: 'I am intermediate', icon: '/icon-level-intermediate.svg' },
    { id: 'ADVANCED', label: 'I am advanced', icon: '/icon-level-advanced.svg' },
    { id: 'EXPERT', label: 'I am an expert', icon: '/icon-level-expert.svg' },
];

export default function ChallengeLevelPage() {
    const router = useRouter();
    const { data, updateData } = useOnboarding();

    const handleSelect = (levelId: string) => {
        updateData('challengeLevel', levelId);
    };

    const handleContinue = () => {
        if (data.challengeLevel) {
            router.push('/onboarding/challenge-types');
        }
    };

    return (
        <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center p-6 relative overflow-hidden font-poppins">
            {/* Top Navigation Bar */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8 md:mb-12 relative z-10">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                    aria-label="Go back"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                </button>

                {/* Progress Bar - White track */}
                <div className="flex-1 mx-4 md:mx-12 h-2 bg-white rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#3B82F6] rounded-full transition-all duration-500 ease-out"
                        style={{ width: '33%' }}
                    />
                </div>

                <div className="w-10"></div>
            </div>

            {/* Header with Puzzle Icon INLINE with Title */}
            <div className="w-full max-w-2xl flex items-center gap-4 mb-10">
                <Image
                    src="/tile.svg"
                    alt="MindBlock"
                    width={48}
                    height={48}
                    className="w-12 h-12 flex-shrink-0"
                />
                <div className="bg-[#121B29] py-3 px-6 rounded-xl border border-[#3B82F626] flex-1">
                    <span className="text-lg font-medium text-white">Choose Challenge level that matches your skills</span>
                </div>
            </div>

            {/* Selection Cards - Increased gap */}
            <div className="w-full max-w-2xl flex flex-col gap-6 mb-8">
                {levels.map((level) => (
                    <button
                        key={level.id}
                        onClick={() => handleSelect(level.id)}
                        className={`
                            w-full p-4 rounded-xl flex items-center gap-4 border transition-all duration-200 group relative
                            bg-[#050C16] border-[#3B82F6] shadow-[0px_4px_0px_#2663C7] active:shadow-none active:translate-y-[4px]
                            ${data.challengeLevel === level.id
                                ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[#050C16]'
                                : 'hover:brightness-110'
                            }
                        `}
                    >
                        <div className={`p-2 rounded-lg ${data.challengeLevel === level.id ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                            <Image
                                src={level.icon}
                                alt={level.label}
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                        </div>
                        <span className="text-lg font-medium text-white">{level.label}</span>
                    </button>
                ))}
            </div>

            <div className="w-full max-w-2xl pt-4">
                <Button
                    variant="primary"
                    onClick={handleContinue}
                    disabled={!data.challengeLevel}
                    className="w-full"
                >
                    Continue
                </Button>
            </div>

            {/* Background Ambience */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
            </div>
        </div>
    );
}
