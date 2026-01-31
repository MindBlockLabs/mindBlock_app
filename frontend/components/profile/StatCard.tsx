import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  className?: string;
}

export function StatCard({ icon, value, label, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center rounded-xl bg-card border border-[#E6E6E64D] p-3 cursor-pointer transition-transform duration-200 hover:scale-105",
        className,
      )}
    >
      <div>{icon}</div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        <span className="text-sm ">{label}</span>
      </div>
    </div>
  );
}
