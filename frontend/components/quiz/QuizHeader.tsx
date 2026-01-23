"use client";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuizHeaderProps {
  current: number;
  total: number;
}

export function QuizHeader({ current, total }: QuizHeaderProps) {
  const progress = (current / total) * 100;
  const router = useRouter();

  return (
    <div className="w-full space-y-6 pt-4">
      <div className="flex gap-5 items-center">
        <button
          onClick={() => {
            router.push("/");
          }}
          className="text-white hover:opacity-70 transition-opacity shrink-0"
        >
          <X size={24} />
        </button>

        <div className="w-full h-[19px] bg-[#E6E6E6] rounded-[64px] overflow-hidden relative">
          <div
            className="h-full bg-[#3B82F6] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-black font-mono text-sm font-bold">
              {current} / {total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
