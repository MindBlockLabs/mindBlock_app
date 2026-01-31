'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingData {
    challengeLevel: string;
    challengeTypes: string[];
    additionalInfo: {
        country: string;
        occupation: string;
        interests: string[];
        goals: string[];
    };
    availability: {
        availableHours: string[];
        bio: string;
    };
}

interface OnboardingContextType {
    data: OnboardingData;
    updateData: <K extends keyof OnboardingData>(section: K, payload: OnboardingData[K]) => void;
    // Specialized updaters for deep nesting
    updateAdditionalInfo: <K extends keyof OnboardingData['additionalInfo']>(field: K, value: OnboardingData['additionalInfo'][K]) => void;
    updateAvailability: <K extends keyof OnboardingData['availability']>(field: K, value: OnboardingData['availability'][K]) => void;
}

const defaultData: OnboardingData = {
    challengeLevel: '',
    challengeTypes: [],
    additionalInfo: {
        country: '',
        occupation: '',
        interests: [],
        goals: []
    },
    availability: {
        availableHours: [],
        bio: ''
    }
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

    const updateAdditionalInfo = <K extends keyof OnboardingData['additionalInfo']>(
        field: K, 
        value: OnboardingData['additionalInfo'][K]
    ) => {
        setData((prev) => ({
            ...prev,
            additionalInfo: {
                ...prev.additionalInfo,
                [field]: value
            }
        }));
    };

    const updateAvailability = <K extends keyof OnboardingData['availability']>(
        field: K, 
        value: OnboardingData['availability'][K]
    ) => {
        setData((prev) => ({
            ...prev,
            availability: {
                ...prev.availability,
                [field]: value
            }
        }));
    };

    return (
        <OnboardingContext.Provider value={{ data, updateData, updateAdditionalInfo, updateAvailability }}>
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