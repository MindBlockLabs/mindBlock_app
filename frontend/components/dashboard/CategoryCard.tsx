"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  userLevel: string;
  onClick: () => void;
}

const CategoryCard = ({
  icon,
  name,
  description,
  userLevel,
  onClick,
}: CategoryCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ touchAction: "manipulation" }}
      className=" group
    w-full
    rounded-2xl
    border border-slate-800
    bg-[#101B30]
    p-4
    text-left
    transition
    hover:-translate-y-0.5 hover:border-blue-500/60 hover:bg-[#13213A]
    focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-blue-500
    active:scale-[0.98] active:bg-[#13213A] "
    >
      <div className="rounded-xl bg-[#1C335B] p-4 text-3xl text-slate-200">
        {icon}
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-300">{userLevel}</span>
        <span className="flex h-11 w-11 md:h-9 md:w-9 items-center justify-center rounded-full bg-blue-500 text-white">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
};

export default CategoryCard;
