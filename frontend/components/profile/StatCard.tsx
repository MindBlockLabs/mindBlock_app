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
        "flex items-center gap-4 rounded-xl bg-card border border-border p-4",
        className,
      )}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
