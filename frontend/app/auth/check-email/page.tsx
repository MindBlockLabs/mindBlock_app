"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";
import Image from 'next/image';
import { useToast } from "@/components/ui/ToastProvider";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Mail } from "lucide-react";

const CheckEmail = () => {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleResendLink = async () => {
    setIsLoading(true);

    // Get email from session storage or local storage (assuming it was saved during forgot-password)
    const email = sessionStorage.getItem('resetEmail') || localStorage.getItem('resetEmail');

    if (!email) {
      showError('Error', 'Email not found. Please go back and try again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Success', data.message || 'Password reset link resent to your email.');
      } else {
        showError('Error', data.message || 'Failed to resend password reset link.');
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050C16] text-white flex flex-col">
        {/* Main Content */}
        <div className="flex flex-col items-center justify-center flex-1 px-4 md:px-6">
          <div className="w-full max-w-sm md:max-w-[408px]">
            <div className='flex flex-row mb-4 justify-center h-[33px]'>
              <h1 className="text-xl md:text-2xl font-semibold text-center text-[#E6E6E6]">
                Check your Email
              </h1>
            </div>

            {/* Message */}
            <div className="text-center mb-8 space-y-3">
              <p className="text-[#E6E6E6CC] text-sm leading-relaxed">
                We've sent you a link to your email address to reset your password. Click the link in your inbox to continue.
              </p>
            </div>

            {/* Resend Link Button */}
            <Button
              type="button"
              onClick={handleResendLink}
              disabled={isLoading}
              className="w-full h-12 px-[10px] py-[14px] bg-[#3B82F6] hover:bg-[#2663C7] [box-shadow:0px_4px_0px_0px_#2663C7] text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Resending...' : 'Resend Link'}
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default CheckEmail;