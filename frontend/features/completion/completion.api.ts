import { CompletionStats } from './completion.context';

// Typed API response for user stats
export async function fetchUserStats(): Promise<CompletionStats> {
  const res = await fetch('/user/stats');
  if (!res.ok) throw new Error('Failed to fetch user stats');
  return res.json();
}

// Typed API response for claiming points
export async function claimPoints(): Promise<void> {
  const res = await fetch('/puzzles/claim-points', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to claim points');
}
