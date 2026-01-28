'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/onboarding/challenge-level');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#020817]">
            {/* Optional loader while redirecting */}
        </div>
    );
}
