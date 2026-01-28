'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface OnboardingLayoutProps {
    children: React.ReactNode;
    currentStep: number;
    totalSteps?: number;
    title?: string;
    onBack?: () => void;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
    children,
    currentStep,
    totalSteps = 4,
    onBack,
}) => {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    const progressPercentage = (currentStep / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center p-6 relative overflow-hidden font-poppins">
            {/* Top Navigation Bar */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8 md:mb-12 relative z-10">
                <button
                    onClick={handleBack}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                    aria-label="Go back"
                >
                    <ArrowLeft size={24} />
                </button>

                {/* Progress Bar */}
                <div className="flex-1 mx-4 md:mx-12 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#3B82F6] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                {/* Placeholder for symmetry or explicit step count if needed */}
                <div className="w-10"></div>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-2xl flex flex-col items-center flex-1 relative z-10 animate-fade-in">

                {/* Puzzle Icon Header */}
                <div className="mb-8 md:mb-12 flex items-center justify-center">
                    {/* Using tile.svg as the main logo/puzzle piece */}
                    <div className="relative">
                        <Image
                            src="/tile.svg"
                            alt="MindBlock"
                            width={64}
                            height={64}
                            className="w-16 h-16"
                        />
                    </div>
                </div>

                {children}
            </div>

            {/* Background Ambience (Optional) */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
            </div>
        </div>
    );
};

export default OnboardingLayout;
