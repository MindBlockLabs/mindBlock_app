interface AnswerOptionProps {
  text: string;
  state: "default" | "red" | "green" | "teal";
  onSelect: () => void;
  disabled: boolean;
}

export function AnswerOption({
  text,
  state,
  onSelect,
  disabled,
}: AnswerOptionProps) {
  let borderClass = "border-[#E6E6E6CC] hover:border-white/20";
  let bgClass = "bg-white/5";
  let textClass = "text-white";
  let shadowColor = "#E6E6E6CC";

  if (state === "green") {
    borderClass = "border-emerald-500";
    bgClass = "bg-[#D8FFFB]";
    textClass = "text-emerald-500";
    shadowColor = "#10B981";
  } else if (state === "red") {
    borderClass = "border-rose-500";
    bgClass = "bg-[#FFE0E6]";
    textClass = "text-rose-500";
    shadowColor = "#F43F5E";
  } else if (state === "teal") {
    borderClass = "border-cyan-400";
    bgClass = "bg-cyan-400/10";
    textClass = "text-cyan-400";
    shadowColor = "#22D3EE";
  }

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      style={{ boxShadow: `0 4px 0 0 ${shadowColor}` }}
      className={`
        w-full h-[65px] rounded-[8px] border-[1px] text-center transition-all duration-150
        transform outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/50
        ${
          disabled
            ? "cursor-default opacity-90"
            : "cursor-pointer active:translate-y-[2px] active:shadow-none hover:bg-white/10"
        }
        ${borderClass} ${bgClass}
      `}
    >
      <span className={`text-base font-bold ${textClass}`}>{text}</span>
    </button>
  );
}
