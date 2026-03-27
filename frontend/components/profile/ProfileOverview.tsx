import Image from "next/image";
import { StatCard } from "./StatCard";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  
  const stats = [
    {
      iconSrc: "/fire.svg",
      iconAlt: "fire",
      value: dayStreak,
      label: "Day streak",
      link: "/streak",
    },
    {
      iconSrc: "/diamond.svg",
      iconAlt: "diamond",
      value: totalPoints,
      label: "Total Points",
      link: "/",
    },
    {
      iconSrc: "/trophy.svg", 
      iconAlt: "trophy",
      value: `#${rank}`,
      label: "Rank",
      link: "/",
    },
    {
      iconSrc: "/puzzlePiece.svg",
      iconAlt: "puzzle piece",
      value: challengeLevel,
      label: "Challenge Level",
      link: "/",
    },
  ] as const;

  return (
    <section className="w-full mt-8">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Overview</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            onClick={() => stat.link && router.push(stat.link)}
            icon={
              <div className=" h-10 w-10 items-center justify-center">
                <Image src={stat.iconSrc} width={28} height={28} className="h-7 w-7" alt={stat.iconAlt} />
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
