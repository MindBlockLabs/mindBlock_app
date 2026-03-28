'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingData {
    challengeLevel: string;
    challengeTypes: string[];
    referralSource: string;
    ageGroup: string;
}

interface OnboardingContextType {
    data: OnboardingData;
    updateData: <K extends keyof OnboardingData>(section: K, payload: OnboardingData[K]) => void;
    resetData: () => void;
}

const defaultData: OnboardingData = {
    challengeLevel: '',
    challengeTypes: [],
    referralSource: '',
    ageGroup: '',
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<OnboardingData>(defaultData);

    const updateData = <K extends keyof OnboardingData>(section: K, payload: OnboardingData[K]) => {
        setData((prev) => ({
            ...prev,
            [section]: payload,
        }));
    };

    const resetData = () => {
        setData(defaultData);
    };

    return (
        <OnboardingContext.Provider value={{ data, updateData, resetData }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};