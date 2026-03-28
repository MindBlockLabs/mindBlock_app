import { useQuery, useMutation } from "@tanstack/react-query";
import { dailyQuestApi } from "../lib/api/dailyQuestApi";
import { DailyQuest, DailyQuestStatus } from "../lib/types/dailyQuest";

// Fetch today's quest
export function useDailyQuest() {
  return useQuery<DailyQuest>({
    queryKey: ["dailyQuest"],
    queryFn: dailyQuestApi.getDailyQuest,
  });
}

// Poll quest status
export function useDailyQuestStatus() {
  return useQuery<DailyQuestStatus>({
    queryKey: ["dailyQuestStatus"],
    queryFn: dailyQuestApi.getDailyQuestStatus,
    refetchInterval: 5000, // poll every 5s
  });
}

// Complete quest mutation
export function useCompleteDailyQuest() {
  return useMutation({
    mutationFn: dailyQuestApi.completeDailyQuest,
  });
}
