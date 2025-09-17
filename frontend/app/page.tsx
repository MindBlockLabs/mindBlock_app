"use client"
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const MindBlockLanding = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 py-8">
      <div className="flex flex-col items-center max-w-sm w-full space-y-8">
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full  flex items-center justify-center shadow-2xl">
            <Image
              src="/logo.png"
              className="w-full h-full object-contain"
              alt="Brain Icon"
              width={64}
              height={64}
            />
          </div>
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-500/30 blur-xl -z-10"></div>
        </div>

        {/* Title and Tagline */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-[#3B82F6] font-nunito">
            Mind Block
          </h1>
          <p className="text-gray-300 text-lg font-nunito font-medium">
            Train Your Mind. Unlock Rewards.
          </p>
        </div>

        <div className="w-full space-y-4 pt-8 ">
          <button
            className="w-full bg-blue-500 border-b-4 border-blue-700 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 shadow-lg"
            onClick={() => router.push("auth/signup")}
          >
            Register & Play
          </button>
          <div className="text-center">
            <span className="text-gray-400 text-sm">Have an account? </span>
            <button
              className="text-blue-400 text-sm hover:text-blue-300 font-medium transition-colors duration-200"
              onClick={() => router.push("auth/signin")}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-32 h-1 bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
};

export default MindBlockLanding;
