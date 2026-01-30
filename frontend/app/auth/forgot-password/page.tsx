"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";
import { useState } from "react";
import Button from "@/components/ui/Button";

const ForgotPassword = () => {
  const router = useRouter();

  const { showSuccess, showError } = useToast();
    const [formData, setFormData] = useState({
      email: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };
    
      const handleInputChange = (field: string) => (
        e: React.ChangeEvent<HTMLInputElement>
      ) => {
        const value = e.target.value;
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      };

      const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
    
        // Validate email before submission
        if (!validateEmail(formData.email)) {
          showError('Invalid Email', 'Please enter a valid email address');
          setIsLoading(false);
          return;
        }
    
        // Check if email field is empty
        if (!formData.email.trim()) {
          showError('Email Required', 'Please enter your email address');
          setIsLoading(false);
          return;
        }
    
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email: formData.email }),
            },
          );

          const data = await response.json();

          if (response.ok) {
            // Store email for resend functionality
            sessionStorage.setItem("resetEmail", formData.email);
            showSuccess(
              "Success",
              data.message || "Password reset link sent to your email.",
            );
            router.push("/auth/check-email");
          } else {
            showError(
              "Error",
              data.message || "Failed to send password reset link.",
            );
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          showError('Error', 'An unexpected error occurred. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      }


  return ( 
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050C16] text-white md:flex md:flex-col">
      {/* Back Arrow - stays at top on desktop, within main content */}
      <div className="hidden md:flex md:items-start md:p-6">
        <Link href="/auth/signin">
          <Image
            src="/Vector.png"
            alt="Home"
            width={20}
            height={20}
          />
        </Link>
      </div>
      {/* Main Content */}
      <div className="flex flex-col items-center px-4 md:px-6 pt-4 md:pt-0 md:justify-center md:flex-1">
        <div className="w-full max-w-sm md:max-w-[408px]">
          {/* Mobile header with back arrow */}
          <div className='flex flex-row mb-12 gap-20 h-[33px] md:hidden'>
            <div className='flex items-center'>
              <Link href="/auth/signin" className="mr-2">
                <Image
                  src="/Vector.png"
                  alt="Home"
                  width={20}
                  height={20}
                />
              </Link>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-center text-[#E6E6E6]">
              Forgot Password?
            </h1>
          </div>

          {/* Desktop title */}
          <h1 className="hidden md:block text-xl md:text-2xl font-semibold text-center text-[#E6E6E6] mb-12">
            Forgot Password?
          </h1>

          {/* Sign-in Form */}
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange('email')}
            />

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading || !formData.email || !validateEmail(formData.email)}
              className="w-full h-12 px-[10px] py-[14px] bg-[#3B82F6] hover:bg-[#2663C7] [box-shadow:0px_4px_0px_0px_#2663C7] text-white font-medium rounded-lg transition-colors mt-5"
            >
              {isLoading ? 'Sending link...' : 'Send Link'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-5">
            <Link 
              href="/auth/signin"
              className="text-[#3B82F6] transition-colors"
            >
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
   );
}
 
export default ForgotPassword;