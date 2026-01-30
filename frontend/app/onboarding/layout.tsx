'use client';

import { OnboardingProvider } from './OnboardingContext';

export default function OnboardingRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OnboardingProvider>
            {children}
        </OnboardingProvider>
    );
}
