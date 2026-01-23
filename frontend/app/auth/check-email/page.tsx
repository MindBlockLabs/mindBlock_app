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
      <div className="min-h-screen bg-[#050C16] text-white">
        {/* Header */}
        <div className="flex items-center p-4 md:p-6">
        </div>
        {/* Main Content */}
        <div className="flex flex-col items-center px-4 md:px-6 -mt-2">
          <div className="w-full max-w-sm md:max-w-[408px]">
            <div className='flex flex-row mb-12 gap-[40px] h-[33px]'>
              <div className='flex items-center'>
                <Link href="/auth/forgot-password" className="mr-2">
                  <Image
                    src="/Vector.png"
                    alt="Back"
                    width={20}
                    height={20}
                  />
                </Link>
              </div>
              <h1 className="text-xl md:text-2xl font-semibold text-center text-[#E6E6E6]">
                Check Email
              </h1>
            </div>

            {/* Email Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-[#3B82F6]/10 rounded-full flex items-center justify-center">
                <Mail size={40} className="text-[#3B82F6]" />
              </div>
            </div>

            {/* Message */}
            <div className="text-center mb-8 space-y-3">
              <h2 className="text-lg font-medium text-[#E6E6E6]">
                Check your email
              </h2>
              <p className="text-[#E6E6E6CC] text-sm leading-relaxed">
                We've sent you a password reset link. Please check your email.
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

            {/* Back to Sign In */}
            <div className="text-center mt-6">
              <Link 
                href="/auth/signin"
                className="text-[#3B82F6] transition-colors text-sm"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default CheckEmail;