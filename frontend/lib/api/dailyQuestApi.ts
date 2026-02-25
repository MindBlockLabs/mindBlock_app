import { DailyQuest, DailyQuestStatus } from "../types/dailyQuest";

const BASE_URL = "/daily-quest";

export const dailyQuestApi = {
  async getDailyQuest(): Promise<DailyQuest> {
    const res = await fetch(BASE_URL, { method: "GET" });
    if (!res.ok) throw new Error("Failed to fetch daily quest");
    return res.json();
  },

  async getDailyQuestStatus(): Promise<DailyQuestStatus> {
    const res = await fetch(`${BASE_URL}/status`, { method: "GET" });
    if (!res.ok) throw new Error("Failed to fetch daily quest status");
    return res.json();
  },

  async completeDailyQuest(): Promise<{ success: boolean; pointsEarned: number }> {
    const res = await fetch(`${BASE_URL}/complete`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to complete daily quest");
    return res.json();
  },
};
