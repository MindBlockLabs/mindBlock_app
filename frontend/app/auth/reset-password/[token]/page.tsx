"use client";

import ErrorBoundary from "@/components/ErrorBoundary";

import { useRouter, useParams } from "next/navigation";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";
import { useState } from "react";
import Button from "@/components/ui/Button";

const ResetPassword = () => {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  console.log({token});
  

  // Password validation function
  const validatePassword = (password: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate password
    if (!formData.password.trim()) {
      showError('Password Required', 'Please enter a new password');
      setIsLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      showError(
        'Weak Password',
        'Password must be at least 8 characters with uppercase, lowercase, and number'
      );
      setIsLoading(false);
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Check if confirm password is empty
    if (!formData.confirmPassword.trim()) {
      showError('Confirm Password Required', 'Please confirm your password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: formData.password,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        showSuccess("Success", data.message || "Password reset successfully.");
        // Clear the stored email
        sessionStorage.removeItem("resetEmail");
        localStorage.removeItem("resetEmail");
        // Redirect to sign in after 1.5 seconds
        setTimeout(() => {
          router.push("/auth/signin");
        }, 1500);
      } else {
        showError(
          "Error",
          data.message ||
            "Failed to reset password. The link may have expired.",
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      showError('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const isFormValid = formData.password && formData.confirmPassword && passwordsMatch && validatePassword(formData.password);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050C16] text-white md:flex md:flex-col">
        {/* Main Content */}
        <div className="flex flex-col items-center px-4 md:px-6 pt-4 md:pt-0 md:justify-center md:flex-1">
          <div className="w-full max-w-sm md:max-w-[408px]">
            <div className='flex flex-row mb-12 justify-center h-[33px]'>
              <h1 className="text-xl md:text-2xl font-semibold text-center text-[#E6E6E6]">
                New Password
              </h1>
            </div>

            {/* Reset Password Form */}
            <form onSubmit={handleResetPassword} className="space-y-6">
              <Input
                type="password"
                placeholder="New Password"
                value={formData.password}
                onChange={handleInputChange('password')}
              />

              {/* Password Requirements */}
              {formData.password && !validatePassword(formData.password) && (
                <div className="text-xs text-[#E6E6E6CC] -mt-4 space-y-1">
                  <p className="text-[#F87171]">Password must contain:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[#E6E6E6CC]">
                    <li className={formData.password.length >= 8 ? 'text-[#10B981]' : ''}>
                      At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'text-[#10B981]' : ''}>
                      One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(formData.password) ? 'text-[#10B981]' : ''}>
                      One lowercase letter
                    </li>
                    <li className={/\d/.test(formData.password) ? 'text-[#10B981]' : ''}>
                      One number
                    </li>
                  </ul>
                </div>
              )}

              <Input
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
              />

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="text-xs -mt-4">
                  {passwordsMatch ? (
                    <p className="text-[#10B981]">✓ Passwords match</p>
                  ) : (
                    <p className="text-[#F87171]">✗ Passwords do not match</p>
                  )}
                </div>
              )}

              {/* Reset Password Button */}
              <Button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full h-12 px-[10px] py-[14px] bg-[#3B82F6] hover:bg-[#2663C7] [box-shadow:0px_4px_0px_0px_#2663C7] text-white font-medium rounded-lg transition-colors mt-3"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default ResetPassword;
