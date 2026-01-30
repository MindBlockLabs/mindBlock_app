'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { useOnboarding } from '../OnboardingContext';
import Image from 'next/image';

// Step 3a: How did you hear about Block Mind? (Selection)
const referralSources = [
    'Google Search',
    'X (formerly called Twitter)',
    'Facebook / Instagram',
    'Friends / family',
    'Play Store',
    'App Store',
    'News / article / blog',
    'Youtube',
    'Others'
];

// Step 3b: How old are you? (Age Range Selection)
const ageRanges = [
    'From 10 to 17 years old',
    '18 to 24 years old',
    '25 to 34 years old',
    '35 to 44 years old',
    '45 to 54 years old',
    '55 to 64 years old',
    '65+'
];

export default function AdditionalInfoPage() {
    const router = useRouter();
    const { updateAdditionalInfo } = useOnboarding();
    const [step, setStep] = useState<'referral' | 'age'>('referral');
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedAge, setSelectedAge] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSourceSelect = (source: string) => {
        setSelectedSource(source);
    };

    const handleAgeSelect = (age: string) => {
        setSelectedAge(age);
    };

    const handleContinueFromReferral = () => {
        if (selectedSource) {
            updateAdditionalInfo('country', selectedSource);
            setStep('age');
        }
    };

    const handleContinueFromAge = () => {
        if (selectedAge) {
            updateAdditionalInfo('occupation', selectedAge); // Storing age
            setIsSubmitting(true);
        }
    };

    const [loadingProgress, setLoadingProgress] = useState(0);

    // Handle loading animation when submitting
    React.useEffect(() => {
        if (!isSubmitting) return;

        const interval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);

        const timeout = setTimeout(() => {
            router.push('/dashboard');
        }, 2700);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isSubmitting, router]);

    // Loading screen with animated progress
    if (isSubmitting) {
        return (
            <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center justify-center p-6 text-center">
                {/* Puzzle Icon */}
                <div className="mb-6 animate-bounce">
                    <Image
                        src="/tile.svg"
                        alt="Loading"
                        width={64}
                        height={64}
                        className="w-16 h-16"
                    />
                </div>

                {/* Message Card */}
                <div className="bg-[#121B29] py-4 px-8 rounded-2xl border border-[#3B82F626] mb-8">
                    <span className="text-lg font-medium text-white">We&apos;re setting up your personalized challenges</span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full max-w-md flex items-center gap-4">
                    <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#3B82F6] rounded-full transition-all duration-100 ease-out"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>
                    <span className="text-white font-medium text-sm w-12">{loadingProgress}%</span>
                </div>
            </div>
        );
    }

    // Step 3a: Referral Source Selection Screen
    if (step === 'referral') {
        return (
            <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center p-6 relative overflow-hidden font-poppins">
                {/* Top Navigation Bar */}
                <div className="w-full max-w-4xl flex items-center justify-between mb-8 md:mb-12 relative z-10">
                    <button
                        onClick={() => router.push('/onboarding/challenge-types')}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                        aria-label="Go back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                    </button>

                    {/* Progress Bar - White track */}
                    <div className="flex-1 mx-4 md:mx-12 h-2 bg-white rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#3B82F6] rounded-full transition-all duration-500 ease-out"
                            style={{ width: '75%' }}
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
                        <span className="text-lg font-medium text-white">How do you hear about Block Mind?</span>
                    </div>
                </div>

                {/* Selection Cards - Increased gap */}
                <div className="w-full max-w-2xl flex flex-col gap-6 mb-8">
                    {referralSources.map((source) => (
                        <button
                            key={source}
                            onClick={() => handleSourceSelect(source)}
                            className={`
                                w-full p-4 rounded-xl flex items-center border transition-all duration-200
                                bg-[#050C16] border-[#3B82F6] shadow-[0px_4px_0px_#2663C7] 
                                active:shadow-none active:translate-y-[4px]
                                ${selectedSource === source
                                    ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[#050C16]'
                                    : 'hover:brightness-110'
                                }
                            `}
                        >
                            <span className="text-base font-medium text-white">{source}</span>
                        </button>
                    ))}
                </div>

                <div className="w-full max-w-2xl pt-4">
                    <Button
                        variant="primary"
                        onClick={handleContinueFromReferral}
                        disabled={!selectedSource}
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

    // Step 3b: Age Range Selection Screen
    return (
        <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center p-6 relative overflow-hidden font-poppins">
            {/* Top Navigation Bar */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8 md:mb-12 relative z-10">
                <button
                    onClick={() => setStep('referral')}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                    aria-label="Go back"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                </button>

                {/* Progress Bar - White track */}
                <div className="flex-1 mx-4 md:mx-12 h-2 bg-white rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#3B82F6] rounded-full transition-all duration-500 ease-out"
                        style={{ width: '100%' }}
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
                    <span className="text-lg font-medium text-white">How old are you?</span>
                </div>
            </div>

            {/* Age Range Selection Cards - Increased gap */}
            <div className="w-full max-w-2xl flex flex-col gap-6 mb-8">
                {ageRanges.map((age) => (
                    <button
                        key={age}
                        onClick={() => handleAgeSelect(age)}
                        className={`
                            w-full p-4 rounded-xl flex items-center border transition-all duration-200
                            bg-[#050C16] border-[#3B82F6] shadow-[0px_4px_0px_#2663C7] 
                            active:shadow-none active:translate-y-[4px]
                            ${selectedAge === age
                                ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[#050C16]'
                                : 'hover:brightness-110'
                            }
                        `}
                    >
                        <span className="text-base font-medium text-white">{age}</span>
                    </button>
                ))}
            </div>

            <div className="w-full max-w-2xl pt-4">
                <Button
                    variant="primary"
                    onClick={handleContinueFromAge}
                    disabled={!selectedAge}
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