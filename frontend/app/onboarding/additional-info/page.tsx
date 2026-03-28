'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { useOnboarding } from '../OnboardingContext';
import Image from 'next/image';
import { useUpdateUserProfile } from '@/hooks/useUpdateUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { mapChallengeLevel, mapChallengeType, mapReferralSource, mapAgeGroup } from '@/lib/utils/onboardingMapper';

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
    const { data, updateData, resetData } = useOnboarding();
    const { updateProfile, isLoading, error, clearError } = useUpdateUserProfile();
    const { isAuthenticated } = useAuth();
    const [step, setStep] = useState<'referral' | 'age'>('referral');
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedAge, setSelectedAge] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showError, setShowError] = useState(false);

    const handleSourceSelect = (source: string) => {
        setSelectedSource(source);
    };

    const handleAgeSelect = (age: string) => {
        setSelectedAge(age);
    };

    const handleContinueFromReferral = () => {
        if (selectedSource) {
            updateData('referralSource', selectedSource);
            setStep('age');
        }
    };

    const handleContinueFromAge = async () => {
        if (!selectedAge) return;

        // Check authentication
        if (!isAuthenticated) {
            setShowError(true);
            return;
        }

        updateData('ageGroup', selectedAge);

        // Prepare data for API with proper enum mapping
        const profileData = {
            challengeLevel: mapChallengeLevel(data.challengeLevel),
            challengeTypes: data.challengeTypes.map(mapChallengeType),
            referralSource: mapReferralSource(selectedSource || data.referralSource),
            ageGroup: mapAgeGroup(selectedAge),
        };

        try {
            await updateProfile(profileData);
            
            // Reset onboarding data after successful save
            resetData();
            
            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err) {
            setShowError(true);
        }
    };

    const handleRetry = () => {
        setShowError(false);
        clearError();
    };

    // Handle loading animation when submitting
    React.useEffect(() => {
        if (!isLoading) {
            setLoadingProgress(0);
            return;
        }

        const interval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 90) {
                    return 90; // Stop at 90% until actual completion
                }
                return prev + 2;
            });
        }, 50);

        return () => {
            clearInterval(interval);
        };
    }, [isLoading]);

    // Complete progress bar on success
    React.useEffect(() => {
        if (!isLoading && loadingProgress > 0 && !error) {
            setLoadingProgress(100);
        }
    }, [isLoading, loadingProgress, error]);

    // Loading screen with animated progress
    if (isLoading) {
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
                    <span className="text-lg font-medium text-white">Preparing your account...</span>
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

    // Error screen
    if (showError) {
        return (
            <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center justify-center p-6 text-center">
                {/* Error Icon */}
                <div className="mb-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                </div>

                {/* Error Message */}
                <div className="bg-[#121B29] py-4 px-8 rounded-2xl border border-red-500/20 mb-8 max-w-md">
                    <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
                    <p className="text-sm text-slate-300">
                        {error || 'Unable to save your profile. Please try again.'}
                    </p>
                </div>

                {/* Retry Button */}
                <div className="w-full max-w-md space-y-3">
                    <Button
                        variant="primary"
                        onClick={handleRetry}
                        className="w-full"
                    >
                        Try Again
                    </Button>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        Skip for now
                    </button>
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