'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Wallet } from 'lucide-react';
import Image from 'next/image';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useToast } from '@/components/ui/ToastProvider';

const SignUpPage = () => {
  const router = useRouter();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const validatePassword = (password: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  // Username validation function
  const validateUsername = (username: string) => {
    // At least 3 characters, alphanumeric and underscores allowed
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    return usernameRegex.test(username);
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate all fields
    if (!formData.username.trim()) {
      showError('Username Required', 'Please enter a username');
      setIsLoading(false);
      return;
    }

    if (!validateUsername(formData.username)) {
      showError('Invalid Username', 'Username must be at least 3 characters and contain only letters, numbers, and underscores');
      setIsLoading(false);
      return;
    }

    if (!formData.fullName.trim()) {
      showError('Full Name Required', 'Please enter your full name');
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      showError('Email Required', 'Please enter your email address');
      setIsLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      showError('Invalid Email', 'Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      showError('Password Required', 'Please enter a password');
      setIsLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      showError('Weak Password', 'Password must be at least 8 characters with uppercase, lowercase, and number');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://mindblock-webaapp.onrender.com/auth/signUp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password
        }),
      });

      // Checking if response is ok before trying to parse JSON
      if (!response.ok) {
        try {
          const errorData = await response.json();
          // Handle specific error messages from server
          if (response.status === 409) {
            const errorMsg = errorData.message || 'User already exists with this email or username.';
            showError('Account Already Exists', errorMsg);
          } else if (response.status === 400) {
            const errorMsg = errorData.message || 'Invalid input data.';
            showError('Invalid Input', errorMsg);
          } else if (response.status >= 500) {
            const errorMsg = 'Server error. Please try again later.';
            showError('Server Error', errorMsg);
          } else {
            const errorMsg = errorData.message || 'Registration failed. Please try again.';
            showError('Registration Failed', errorMsg);
          }
        } catch {
          // If response isn't JSON, use status text or default message
          if (response.status === 409) {
            const errorMsg = 'Account already exists.';
            showError('Account Already Exists', errorMsg);
          } else {
            const errorMsg = `Registration failed: ${response.statusText || 'Please try again.'}`;
            showError('Registration Failed', errorMsg);
          }
        }
        setIsLoading(false);
        return;
      }

      // Parse JSON only if response is ok
      const data = await response.json();

      if (data.accessToken || data.message === 'User created successfully') {
        // If we get a token, store it
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        
        // Show success toast
        showSuccess('Registration Successful', 'Welcome to Mind Block!');
        
        // Redirect to signin page or dashboard based on whether we got a token
        if (data.accessToken) {
          router.push('/dashboard');
        } else {
          router.push('/auth/signin');
        }
      } else {
        const errorMsg = 'Invalid response from server. Please try again.';
        showError('Invalid Response', errorMsg);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMsg = 'Network error. Please check your connection and try again.';
      showError('Network Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    showInfo('Google Sign-Up', 'Redirecting to Google authentication...');
    window.location.href = "https://mindblock-webaapp.onrender.com/auth/google-authentication";
  };

  const handleWalletConnect = () => {
    showInfo('Wallet Connection', 'Redirecting to wallet connection...');
    // You might want to implement wallet connection logic here
    // For now, we'll use a placeholder endpoint
    window.location.href = "https://mindblock-webaapp.onrender.com/auth/wallet-signup";
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
                <Link href="/" className="mr-2">
                  <Image
                    src="/Vector.png"
                    alt="Home"
                    width={20}
                    height={20}
                  />
                </Link>
              </div>
              <h1 className="text-xl md:text-2xl font-semibold text-center text-[#E6E6E6]">
                Start your journey
              </h1>
            </div>

            {/* Sign-up Form */}
            <form onSubmit={handleSignUp} className="space-y-6">
              <Input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange('username')}
              />

              <Input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
              />

              <Input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange('email')}
              />

              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange('password')}
              />

              {/* Sign Up Button */}
              <Button
                type="submit"
                disabled={isLoading || !formData.username || !formData.fullName || !formData.email || !formData.password}
                className="w-full h-12 px-[10px] py-[14px] bg-[#3B82F6] hover:bg-[#2663C7] [box-shadow:0px_4px_0px_0px_#2663C7] text-white font-medium rounded-lg transition-colors mt-5"
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center mt-5">
              <span className="text-[#E6E6E6]">Have an account? </span>
              <Link 
                href="/auth/signin"
                className="text-[#3B82F6] transition-colors"
              >
                Sign in
              </Link>
            </div>

            {/* Divider */}
            <div className="text-center text-[#E6E6E6] my-6">Or</div>

            {/* Social Login Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignUp}
                type="button"
                className="w-full h-12 border-2 border-blue-500 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-blue-500/10 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

              <button
                onClick={handleWalletConnect}
                type="button"
                className="w-full h-12 border-2 border-blue-500 text-blue-400 rounded-lg flex items-center justify-center gap-3 hover:bg-blue-500/10 transition-colors"
              >
                <Wallet size={20} />
                Connect Wallet
              </button>
            </div>

            {/* Terms and Privacy */}
            <div className="text-center text-sm text-[#E6E6E6] font-medium mt-25 md:mt-45 mb-8">
              By signing up for Mind Block, you agree to our{' '}
              <Link href="/terms" className="font-bold">
                Terms
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="font-bold">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SignUpPage;