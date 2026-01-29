import { StatCard } from "./StatCard";

interface ProfileOverviewProps {
  dayStreak: number;
  totalPoints: number;
  rank: number;
  challengeLevel: string;
}

export function ProfileOverview({
  dayStreak,
  totalPoints,
  rank,
  challengeLevel,
}: ProfileOverviewProps) {
  const stats = [
    {
      iconSrc: "/fire.svg",
      iconAlt: "fire",
      value: dayStreak,
      label: "Day streak",
    },
    {
      iconSrc: "/diamond.svg",
      iconAlt: "diamond",
      value: totalPoints,
      label: "Total Points",
    },
    {
      iconSrc: "/trophy.svg", 
      iconAlt: "trophy",
      value: `#${rank}`,
      label: "Rank",
    },
    {
      iconSrc: "/puzzlePiece.svg",
      iconAlt: "puzzle piece",
      value: challengeLevel,
      label: "Challenge Level",
    },
  ] as const;

  return (
    <section className="w-full">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Overview</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={
              <div className=" h-10 w-10 items-center justify-center">
                <img src={stat.iconSrc} className="h-7 w-7" alt={stat.iconAlt} />
              </div>
            }
            value={stat.value}
            label={stat.label}
          />
        ))}
      </div>
    </section>
  );
}
