"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Wallet } from "lucide-react";
import Image from "next/image";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useToast } from "@/components/ui/ToastProvider";

// Proper TypeScript types for Ethereum provider
interface EthereumProvider {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const SignUpPage = () => {
  const router = useRouter();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
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
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  // Username validation function
  const validateUsername = (username: string) => {
    // At least 3 characters, alphanumeric and underscores allowed
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    return usernameRegex.test(username);
  };

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate all fields
    if (!formData.username.trim()) {
      showError("Username Required", "Please enter a username");
      setIsLoading(false);
      return;
    }

    if (!validateUsername(formData.username)) {
      showError(
        "Invalid Username",
        "Username must be at least 3 characters and contain only letters, numbers, and underscores",
      );
      setIsLoading(false);
      return;
    }

    if (!formData.fullName.trim()) {
      showError("Full Name Required", "Please enter your full name");
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      showError("Email Required", "Please enter your email address");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      showError("Invalid Email", "Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      showError("Password Required", "Please enter a password");
      setIsLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      showError(
        "Weak Password",
        "Password must be at least 8 characters with uppercase, lowercase, and number",
      );
      setIsLoading(false);
      return;
    }

    try {
      // Format request body to match server expectations
      const requestBody = {
        email: formData.email,
        username: formData.username,
        fullname: formData.fullName, // Server expects lowercase 'n'
        password: formData.password,
        userRole: "user", // Default role
        provider: "local", // Local registration
      };

      console.log("Sending request with data:", requestBody); // Debug log

      const response = await fetch(
        "https://mindblock-webaapp.onrender.com/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      // Log response details for debugging
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      // Checking if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = "Registration failed. Please try again.";

        try {
          const errorData = await response.json();
          console.log("Error response data:", errorData); // Debug log

          // Safely extract error message
          if (typeof errorData === "object" && errorData !== null) {
            if (typeof errorData.message === "string") {
              errorMessage = errorData.message;
            } else if (typeof errorData.error === "string") {
              errorMessage = errorData.error;
            } else if (
              Array.isArray(errorData.errors) &&
              errorData.errors.length > 0
            ) {
              errorMessage = errorData.errors[0];
            }
          }

          // Handle specific error cases
          if (response.status === 409) {
            showError(
              "Account Already Exists",
              errorMessage ||
                "User already exists with this email or username.",
            );
          } else if (response.status === 400) {
            showError(
              "Invalid Input",
              errorMessage ||
                "Invalid input data. Please check your information.",
            );
          } else if (response.status >= 500) {
            showError("Server Error", "Server error. Please try again later.");
          } else {
            showError("Registration Failed", errorMessage);
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          // If response isn't JSON, use status-based messages
          if (response.status === 409) {
            showError(
              "Account Already Exists",
              "An account with this email or username already exists.",
            );
          } else if (response.status === 400) {
            showError(
              "Invalid Input",
              "Please check your input and try again.",
            );
          } else {
            showError(
              "Registration Failed",
              `Error ${response.status}: ${response.statusText || "Please try again."}`,
            );
          }
        }
        setIsLoading(false);
        return;
      }

      // Parse JSON only if response is ok
      const data = await response.json();
      console.log("Success response data:", data); // Debug log

      if (
        data.accessToken ||
        data.message === "User created successfully" ||
        data.success
      ) {
        // If we get a token, store it
        if (data.accessToken) {
          try {
            localStorage.setItem("accessToken", data.accessToken);
          } catch (storageError) {
            console.warn("Could not save token to localStorage:", storageError);
          }
        }

        // Show success toast
        showSuccess("Registration Successful", "Welcome to Mind Block!");

        // Redirect to signin page or dashboard based on whether we got a token
        setTimeout(() => {
          if (data.accessToken) {
            router.push("/dashboard");
          } else {
            router.push("/auth/signin");
          }
        }, 1000); // Small delay to show success message
      } else {
        showError(
          "Invalid Response",
          "Invalid response from server. Please try again.",
        );
      }
    } catch (error) {
      console.error("Sign up error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        showError(
          "Network Error",
          "Could not connect to the server. Please check your internet connection and try again.",
        );
      } else {
        showError(
          "Network Error",
          "An unexpected error occurred. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    showInfo("Google Sign-Up", "Redirecting to Google authentication...");
    window.location.href =
      "https://mindblock-webaapp.onrender.com/auth/google-authentication";
  };

  const handleWalletConnect = async () => {
    try {
      showInfo("Wallet Connection", "Connecting to your wallet...");

      // Check if Web3 is available (MetaMask or similar)
      if (typeof window.ethereum !== "undefined") {
        // Request account access with type assertion
        const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];
        
        const walletAddress = accounts[0];

        if (walletAddress) {
          // Generate a nonce for authentication
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const nonce = `nonce_${timestamp}_${randomString}_${Math.random().toString(36).substring(2, 8)}`;

          // Create a message for signing that includes the nonce
          const message = `Sign this message to authenticate with Mind Block. Nonce: ${nonce}`;

          try {
            // Request signature using personal_sign with type assertion
            const signature = (await window.ethereum.request({
              method: "personal_sign",
              params: [message, walletAddress],
            })) as string;

            // Get the public key (this might not be directly available from MetaMask)
            // For now, we'll use a placeholder or try to derive it
            let publicKey = "";
            try {
              // Try to get public key - this might not work with all wallets
              const encryptionKey = (await window.ethereum.request({
                method: "eth_getEncryptionPublicKey",
                params: [walletAddress],
              })) as string;
              
              // Convert base64 to hex format if needed
              if (encryptionKey && !encryptionKey.startsWith("0x")) {
                try {
                  // Convert base64 to hex using browser's atob
                  const binaryString = atob(encryptionKey);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  publicKey =
                    "0x" +
                    Array.from(bytes)
                      .map((b) => b.toString(16).padStart(2, "0"))
                      .join("");
                } catch (convError) {
                  console.warn(
                    "Could not convert public key format:",
                    convError,
                  );
                  publicKey = encryptionKey; // Use as-is if conversion fails
                }
              } else {
                publicKey = encryptionKey || "";
              }
            } catch (pkError) {
              console.warn("Could not get public key:", pkError);
              // Generate a placeholder public key in correct hex format
              publicKey =
                "0x" +
                Array(128)
                  .fill(0)
                  .map(() => Math.floor(Math.random() * 16).toString(16))
                  .join("");
            }

            // Format the request body to match the expected wallet login format
            const requestBody = {
              walletAddress: walletAddress,
              signature: [signature], // Single signature in array format
              nonce: nonce,
              publicKey: publicKey,
            };

            console.log("Wallet login request:", requestBody); // Debug log

            // Use the wallet login endpoint
            const response = await fetch(
              "https://mindblock-webaapp.onrender.com/auth/wallet-login",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
              },
            );

            console.log("Wallet login response status:", response.status);

            if (response.ok) {
              const data = await response.json();
              console.log("Wallet login response data:", data);

              // Store token if provided
              if (data.accessToken || data.token) {
                try {
                  localStorage.setItem(
                    "accessToken",
                    data.accessToken || data.token,
                  );
                } catch (storageError) {
                  console.warn(
                    "Could not save token to localStorage:",
                    storageError,
                  );
                }
              }

              showSuccess(
                "Wallet Connected",
                "Successfully authenticated with wallet!",
              );

              // Redirect based on response
              setTimeout(() => {
                if (data.accessToken || data.token) {
                  router.push("/dashboard");
                } else {
                  router.push("/auth/signin");
                }
              }, 1000);
            } else {
              // Handle wallet login errors
              try {
                const errorData = await response.json();
                console.log("Wallet login error data:", errorData);

                let errorMessage = "Wallet authentication failed";

                // Handle nested message object
                if (errorData.message) {
                  if (typeof errorData.message === "string") {
                    errorMessage = errorData.message;
                  } else if (typeof errorData.message === "object") {
                    // If message is an object, try to extract meaningful info
                    if (errorData.message.error) {
                      errorMessage = errorData.message.error;
                    } else if (errorData.message.details) {
                      errorMessage = errorData.message.details;
                    } else {
                      // Convert object to string for debugging
                      errorMessage = JSON.stringify(errorData.message);
                    }
                  }
                } else if (typeof errorData.error === "string") {
                  errorMessage = errorData.error;
                }

                if (response.status === 404) {
                  // Wallet not registered, suggest registration
                  showError(
                    "Wallet Not Registered",
                    "This wallet is not registered. Please sign up first.",
                  );
                } else if (response.status === 401) {
                  showError(
                    "Authentication Failed",
                    "Invalid signature. Please try again.",
                  );
                } else if (response.status === 400) {
                  showError("Invalid Request", `Bad request: ${errorMessage}`);
                } else {
                  showError("Wallet Login Failed", errorMessage);
                }
              } catch (parseError) {
                console.error(
                  "Error parsing wallet login response:",
                  parseError,
                );
                showError(
                  "Wallet Login Failed",
                  `Error ${response.status}: Please try again.`,
                );
              }
            }
          } catch (signError: unknown) {
            console.error("Signature error:", signError);

            // Type guard to check if it's an error with a code property
            const isWalletError = (
              error: unknown,
            ): error is { code: number; message?: string } => {
              return (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                typeof (error as { code: unknown }).code === "number"
              );
            };

            if (isWalletError(signError) && signError.code === 4001) {
              showWarning(
                "Signature Cancelled",
                "Message signing was cancelled by user",
              );
            } else {
              showError(
                "Signature Error",
                "Failed to sign message. Please try again.",
              );
            }
          }
        }
      } else {
        // No Web3 wallet detected
        showWarning(
          "Wallet Not Found",
          "Please install MetaMask or another Web3 wallet to continue",
        );
      }
    } catch (error: unknown) {
      console.error("Wallet connection error:", error);

      // Type guard to check if it's an error with a code property
      const isWalletError = (err: unknown): err is { code: number } => {
        return (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          typeof (err as { code: unknown }).code === "number"
        );
      };

      if (isWalletError(error) && error.code === 4001) {
        showWarning(
          "Connection Cancelled",
          "Wallet connection was cancelled by user",
        );
      } else {
        showError(
          "Wallet Error",
          "Failed to connect wallet. Please try again.",
        );
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050C16] text-white">
        {/* Header */}
        <div className="flex items-center p-4 md:p-6"></div>

        {/* Main Content */}
        <div className="flex flex-col items-center px-4 md:px-6 -mt-2">
          <div className="w-full max-w-sm md:max-w-[408px]">
            <div className="flex flex-row mb-12 gap-[40px] h-[33px]">
              <div className="flex items-center">
                <Link href="/" className="mr-2">
                  <Image src="/Vector.png" alt="Home" width={20} height={20} />
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
                onChange={handleInputChange("username")}
              />

              <Input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange("fullName")}
              />

              <Input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange("email")}
              />

              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange("password")}
              />

              {/* Sign Up Button */}
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !formData.username ||
                  !formData.fullName ||
                  !formData.email ||
                  !formData.password
                }
                className="w-full h-12 px-[10px] py-[14px] bg-[#3B82F6] hover:bg-[#2663C7] [box-shadow:0px_4px_0px_0px_#2663C7] text-white font-medium rounded-lg transition-colors mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Sign up"}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center mt-5">
              <span className="text-[#E6E6E6]">Have an account? </span>
              <Link
                href="/auth/signin"
                className="text-[#3B82F6] transition-colors hover:text-[#2663C7]"
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
                disabled={isLoading}
                className="w-full h-12 border-2 border-blue-500 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </button>

              <button
                onClick={handleWalletConnect}
                type="button"
                disabled={isLoading}
                className="w-full h-12 border-2 border-blue-500 text-blue-400 rounded-lg flex items-center justify-center gap-3 hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet size={20} />
                Connect Wallet
              </button>
            </div>

            {/* Terms and Privacy */}
            <div className="text-center text-sm text-[#E6E6E6] font-medium mt-25 md:mt-45 mb-8">
              By signing up for Mind Block, you agree to our{" "}
              <Link
                href="/terms"
                className="font-bold hover:text-blue-400 transition-colors"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-bold hover:text-blue-400 transition-colors"
              >
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