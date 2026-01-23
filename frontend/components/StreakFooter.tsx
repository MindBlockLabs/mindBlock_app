import React from "react";

interface StreakFooterProps {
    onContinue: () => void;
}

export const StreakFooter: React.FC<StreakFooterProps> = ({ onContinue }) => {
    return (
        <button
            onClick={onContinue}
            className="bg-[#3B82F6] hover:bg-[#3B82F6]/80 text-white font-semibold font-nunito transition-colors duration-200 shadow-lg w-full max-w-[566px] h-[50px] rounded-[8px] py-[14px] px-[10px]"
        >
            Continue
        </button>
    );
};
