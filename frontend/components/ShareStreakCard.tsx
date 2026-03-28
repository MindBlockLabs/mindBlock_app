"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";

interface ShareStreakCardProps {
    streakCount: number;
    username?: string;
    onClose?: () => void;
    onShare?: () => void;
}

export default function ShareStreakCard({
    streakCount,
    username,
    onClose,
    onShare,
}: ShareStreakCardProps) {
    const EXIT_ANIMATION_MS = 220;
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    const [isClosing, setIsClosing] = useState(false);
    const [isEntering, setIsEntering] = useState(true);

    const handleClose = useCallback(() => {
        if (isClosing) return;
        setIsClosing(true);
        window.setTimeout(() => {
            onClose?.();
        }, EXIT_ANIMATION_MS);
    }, [isClosing, onClose]);

    const handleShare = useCallback(() => {
        onShare?.();
    }, [onShare]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const enterFrame = window.requestAnimationFrame(() => {
            setIsEntering(false);
        });

        const timer = setTimeout(() => {
            closeButtonRef.current?.focus();
        }, 50);

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleClose();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            window.cancelAnimationFrame(enterFrame);
            clearTimeout(timer);
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = previousOverflow;
        };
    }, [handleClose]);

    const handleTabKey = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "Tab" || !modalRef.current) return;

        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }, []);

    const shareText = username
        ? `${username} is on a ${streakCount} day streak!`
        : `I'm on a ${streakCount} day streak!`;

    return (
        <div
            className={`fixed inset-0 z-50 transition-all backdrop-blur-sm duration-200 cursor-pointer ${
                isClosing || isEntering ? "bg-black/0" : "bg-black/60"
            }`}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
        >
            <div ref={modalRef} className="relative h-full w-full" onKeyDown={handleTabKey}>
                {/* Close Button Top Right */}
                <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
                    type="button"
                    aria-label="Close share modal"
                >
                    ✕
                </button>

                <div className="absolute inset-0 flex items-center justify-center px-4">
                    <div
                        className={`relative w-full max-w-[360px] rounded-[32px] bg-white px-6 py-8 shadow-[0_20px_45px_rgba(0,0,0,0.22)] transition-all duration-200 md:px-8 md:py-10 ${
                            isClosing || isEntering
                                ? "translate-y-2 scale-95 opacity-0"
                                : "translate-y-0 scale-100 opacity-100"
                        }`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h2
                                        id={titleId}
                                        className="font-nunito text-[28px] font-extrabold leading-[1.1] text-[#050C16] md:text-[32px]"
                                    >
                                        <span>I'm on a </span>
                                        <div className="my-2 inline-flex w-fit items-center rounded-[12px] bg-[#FACC15] px-5 py-2 align-middle text-[#050C16]">
                                            {streakCount}
                                        </div>
                                        <span> day streak!</span>
                                    </h2>
                                    <p id={descriptionId} className="sr-only">
                                        {shareText}
                                    </p>
                                </div>
                                <div className="relative h-[110px] w-[90px] shrink-0 md:h-[130px] md:w-[110px]">
                                    <Image
                                        src="/flame.png"
                                        alt="Streak flame"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>
                            
                            <p className="mt-8 text-lg font-bold text-[#3B82F6]">mind block</p>

                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#050C16] py-4 font-nunito text-lg font-bold text-white transition-all hover:bg-[#050C16]/90 active:scale-[0.98] cursor-pointer"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M15 6L11 2M11 2L7 6M11 2V13M19 13V17C19 17.5304 18.7893 18.0391 18.4142 18.4142C18.0391 18.7893 17.5304 19 17 19H5C4.46957 19 3.96086 18.7893 3.58579 18.4142C3.21071 18.0391 3 17.5304 3 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
