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
    updateData: (section: keyof OnboardingData, payload: any) => void;
    // Specialized updaters for deep nesting
    updateAdditionalInfo: (field: keyof OnboardingData['additionalInfo'], value: any) => void;
    updateAvailability: (field: keyof OnboardingData['availability'], value: any) => void;
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

    const updateData = (section: keyof OnboardingData, payload: any) => {
        setData((prev) => ({
            ...prev,
            [section]: payload,
        }));
    };

    const updateAdditionalInfo = (field: keyof OnboardingData['additionalInfo'], value: any) => {
        setData((prev) => ({
            ...prev,
            additionalInfo: {
                ...prev.additionalInfo,
                [field]: value
            }
        }));
    };

    const updateAvailability = (field: keyof OnboardingData['availability'], value: any) => {
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
