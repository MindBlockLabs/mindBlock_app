'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Image from 'next/image';
import { useOnboarding } from '../OnboardingContext';

const types = [
    { id: 'CODING', label: 'Coding Challenges', icon: '/icon-code.svg' },
    { id: 'LOGIC', label: 'Logic Puzzle', icon: '/icon-puzzle.svg' },
    { id: 'BLOCKCHAIN', label: 'Blockchain', icon: '/icon-blockchain.svg' },
];

export default function ChallengeTypesPage() {
    const router = useRouter();
    const { data, updateData } = useOnboarding();

    const handleToggle = (typeId: string) => {
        const current = data.challengeTypes;
        if (current.includes(typeId)) {
            updateData('challengeTypes', current.filter(id => id !== typeId));
        } else {
            updateData('challengeTypes', [...current, typeId]);
        }
    };

    const handleContinue = () => {
        if (data.challengeTypes.length > 0) {
            router.push('/onboarding/additional-info');
        }
    };

    return (
        <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center p-6 relative overflow-hidden font-poppins">
            {/* Top Navigation Bar */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8 md:mb-12 relative z-10">
                <button
                    onClick={() => router.push('/onboarding/challenge-level')}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                    aria-label="Go back"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                </button>

                {/* Progress Bar - White track */}
                <div className="flex-1 mx-4 md:mx-12 h-2 bg-white rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#3B82F6] rounded-full transition-all duration-500 ease-out"
                        style={{ width: '66%' }}
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
                    <span className="text-lg font-medium text-white">Choose the Challenge types (select at least one)</span>
                </div>
            </div>

            {/* Selection Cards - Increased gap */}
            <div className="w-full max-w-2xl flex flex-col gap-6 mb-8">
                {types.map((type) => {
                    const isSelected = data.challengeTypes.includes(type.id);
                    return (
                        <button
                            key={type.id}
                            onClick={() => handleToggle(type.id)}
                            className={`
                                w-full p-4 rounded-xl flex items-center gap-4 border transition-all duration-200 group relative
                                bg-[#050C16] border-[#3B82F6] shadow-[0px_4px_0px_#2663C7] active:shadow-none active:translate-y-[4px]
                                ${isSelected
                                    ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[#050C16]'
                                    : 'hover:brightness-110'
                                }
                            `}
                        >
                            <div className="p-2">
                                <Image
                                    src={type.icon}
                                    alt={type.label}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6"
                                />
                            </div>
                            <span className="text-lg font-medium text-white">{type.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="w-full max-w-2xl pt-4">
                <Button
                    variant="primary"
                    onClick={handleContinue}
                    disabled={data.challengeTypes.length === 0}
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
