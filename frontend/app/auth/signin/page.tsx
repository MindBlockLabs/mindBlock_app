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
import { useStellarWalletAuth } from '@/hooks/useStellarWalletAuth';
import { useAuth } from '@/hooks/useAuth';
import { WalletType } from '@/lib/stellar/types';

const SignInPage = () => {
  const router = useRouter();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const {
    isConnecting,
    isSigning,
    isLoggingIn,
    connectAndLogin,
    clearError,
  } = useStellarWalletAuth();
  const { loginSuccess, loginFailure, setLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Email validation function
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoading(true);

    // Validate email before submission
    if (!validateEmail(formData.username)) {
      showError('Invalid Email', 'Please enter a valid email address');
      setIsLoading(false);
      setLoading(false);
      return;
    }

    // Check if fields are empty
    if (!formData.username.trim()) {
      showError('Email Required', 'Please enter your email address');
      setIsLoading(false);
      setLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      showError('Password Required', 'Please enter your password');
      setIsLoading(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/auth/signIn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.username,
          password: formData.password
        }),
      });

      // Checking if response is ok before trying to parse JSON
      if (!response.ok) {
        try {
          const errorData = await response.json();
          // Handle specific error messages from server
          if (response.status === 401) {
            const errorMsg = 'Invalid email or password.';
            showError('Login Failed', errorMsg);
            loginFailure(errorMsg);
            setIsLoading(false);
            setLoading(false);
          } else if (response.status === 404) {
            const errorMsg = 'Account not found.';
            showError('Account Not Found', errorMsg);
            loginFailure(errorMsg);
            setIsLoading(false);
            setLoading(false);
          } else if (response.status === 400) {
            const errorMsg = errorData.message || 'Invalid input.';
            showError('Invalid Input', errorMsg);
            loginFailure(errorMsg);
            setIsLoading(false);
            setLoading(false);
          } else if (response.status >= 500) {
            const errorMsg = 'Server error. Please try again later.';
            showError('Server Error', errorMsg);
            loginFailure(errorMsg);
            setIsLoading(false);
            setLoading(false);
          } else {
            const errorMsg = errorData.message || 'Login failed. Please try again.';
            showError('Login Failed', errorMsg);
            loginFailure(errorMsg);
            setIsLoading(false);
            setLoading(false);
          }
        } catch {
          // If response isn't JSON, use status text or default message
          if (response.status === 401) {
            const errorMsg = 'Invalid email or password.';
            showError('Login Failed', errorMsg);
            loginFailure(errorMsg);
            setIsLoading(false);
            setLoading(false);
          } else if (response.status === 404) {
            const errorMsg = 'Account not found.';
            showError('Account Not Found', errorMsg);
            loginFailure(errorMsg);
            setIsLoading(false);
            setLoading(false);
          } else {
            const errorMsg = `Login failed: ${response.statusText || 'Please try again.'}`;
            showError('Login Failed', errorMsg);
            loginFailure(errorMsg);
            setIsLoading(false);
            setLoading(false);
          }
        }
        setIsLoading(false);
        setLoading(false);
        return;
      }

      // Parse JSON only if response is ok
      const data = await response.json();

      if (data.accessToken) {
        // Store token in localStorage
        localStorage.setItem('accessToken', data.accessToken);
        
        // Update Redux state
        const user = {
          id: data.user?.id || formData.username,
          email: formData.username,
          username: data.user?.username || formData.username.split('@')[0],
        };
        
        loginSuccess(user, data.accessToken);
        
        // Show success toast
        showSuccess('Login Successful', 'Welcome back!');
        setIsLoading(false);
        setLoading(false);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        const errorMsg = 'Invalid response from server. Please try again.';
        showError('Invalid Response', errorMsg);
        loginFailure(errorMsg);
        setIsLoading(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMsg = 'Network error.';
      showError('Network Error', errorMsg);
      loginFailure(errorMsg);
      setIsLoading(false);
      setLoading(false);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    showInfo('Google Sign-In', 'Redirecting to Google authentication...');
    window.location.href = "http://localhost:3000/auth/google-authentication";
  };

  const handleWalletLogin = async () => {
    clearError();

    try {
      await connectAndLogin('freighter' as WalletType);

      // Success - show toast and redirect
      showSuccess('Login Successful', 'Welcome back!');
      router.push('/dashboard');
    } catch (error) {
      console.error("Wallet Connection Error:", error);
      // Error handling with user-friendly messages

      const isErrorWithCode = (e: unknown): e is { code?: string; message?: string } => {
        return typeof e === 'object' && e !== null;
      };
      if (isErrorWithCode(error)) {
      if (error?.code === 'WALLET_NOT_INSTALLED') {
        showError(
          'Wallet Not Installed',
          'Please install Freighter wallet from freighter.app to continue'
        );
      } else if (error?.code === 'USER_REJECTED') {
        showWarning('Request Cancelled', 'You cancelled the wallet request');
      } else if (error?.code === 'NONCE_EXPIRED') {
        showError('Authentication Expired', 'Please try again');
      } else if (error?.code === 'INVALID_SIGNATURE') {
        showError('Authentication Failed', 'Invalid signature or expired nonce');
      } else if (error?.code === 'NETWORK_ERROR') {
        showError('Network Error', 'Unable to connect to server. Please try again.');
      } else {
        showError('Login Failed', error?.message || 'An unexpected error occurred');
      }
    }
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
              <Link href="/" className="mr-2">
                <Image
                  src="/Vector.png"
                  alt="Home"
                  width={20}       // set width
                  height={20}      // set height
                />
              </Link>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-center text-[#E6E6E6]">
              Your journey continues
            </h1>
          </div>

          {/* Sign-in Form */}
          <form onSubmit={handleSignIn} className="space-y-6">
            <Input
              type="email"
              placeholder="Email"
              value={formData.username}
              onChange={handleInputChange('username')}
            />

            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange('password')}
            />

            {/* Forgot Password Link */}
            <div className="text-left -mt-2">
              <Link 
                href="/auth/forgot-password"
                className="text-[#3B82F6] transition-colors text-sm font-bold"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading || !formData.username || !formData.password}
              className="w-full h-12 px-[10px] py-[14px] bg-[#3B82F6] hover:bg-[#2663C7] [box-shadow:0px_4px_0px_0px_#2663C7] text-white font-medium rounded-lg transition-colors mt-5"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-5">
            <span className="text-[#E6E6E6]">Don&apos;t have an account? </span>
            <Link 
              href="/auth/signup"
              className="text-[#3B82F6] transition-colors"
            >
              Sign up
            </Link>
          </div>

          {/* Divider */}
          <div className="text-center text-[#E6E6E6] my-6">Or</div>

          {/* Social Login Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full h-12 border-2 border-blue-500 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-blue-500/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            <button
              onClick={handleWalletLogin}
              disabled={isConnecting || isSigning || isLoggingIn}
              className="w-full h-12 border-2 border-blue-500 text-blue-400 rounded-lg flex items-center justify-center gap-3 hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet size={20} />
              {isConnecting && 'Connecting Wallet...'}
              {isSigning && 'Sign Message in Wallet...'}
              {isLoggingIn && 'Verifying...'}
              {!isConnecting && !isSigning && !isLoggingIn && 'Connect Wallet'}
            </button>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center text-sm text-[#E6E6E6] font-medium mt-25 md:mt-45 mb-8">
            By signing in to Mind Block, you agree to our{' '}
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

export default SignInPage;
