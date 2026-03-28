"use client";

import ErrorBoundary from "@/components/error/ErrorBoundary";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { useState } from "react";
import Button from "@/components/ui/Button";


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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      showError('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050C16] text-white md:flex md:flex-col">
        {/* Back Arrow - desktop */}
        <div className="hidden md:flex md:items-start md:p-6">
          <Link href="/auth/forgot-password">
            <ArrowLeft size={20} />
          </Link>
        </div>
        {/* Main Content */}
        <div className="flex flex-col items-center px-4 md:px-6 pt-4 md:pt-0 md:justify-center md:flex-1">
          <div className="w-full max-w-sm md:max-w-[408px]">
            {/* Mobile header with back arrow */}
            <div className='flex flex-row mb-4 gap-20 h-[33px] md:hidden'>
              <div className='flex items-center'>
                <Link href="/auth/forgot-password" className="mr-2">
                  <ArrowLeft size={20} />
                </Link>
              </div>
              <h1 className="text-xl md:text-2xl font-semibold text-center text-[#E6E6E6]">
                Check your Email
              </h1>
            </div>
            {/* Desktop title */}
            <h1 className="hidden md:block text-xl md:text-2xl font-semibold text-center text-[#E6E6E6] mb-4">
              Check your Email
            </h1>

            {/* Message */}
            <div className="text-center mb-8 space-y-3 px-8">
              <p className="text-[#E6E6E6CC]">
                We&apos;ve sent you a link to your email address to reset your password. Click the link in your inbox to continue.
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