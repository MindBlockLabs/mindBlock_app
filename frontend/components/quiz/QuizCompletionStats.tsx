import { useCompletion } from '@/features/completion';
import { useEffect } from 'react';

export function QuizCompletionStats() {
  const { stats, isClaiming, isSuccess, error, claimPoints, refreshStats } = useCompletion();

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  if (!stats) return <div>Loading stats...</div>;

  return (
    <div className="p-4 bg-slate-800 rounded-lg max-w-md mx-auto mt-6">
      <h2 className="text-xl font-bold mb-2">Level Completion Stats</h2>
      <ul className="mb-4">
        <li>Points: <b>{stats.points}</b></li>
        <li>Correct: <b>{stats.correct}</b> / {stats.total}</li>
        <li>Time: <b>{stats.timeSeconds}</b> seconds</li>
        <li>Level: <b>{stats.level}</b></li>
      </ul>
      <button
        className="px-4 py-2 bg-blue-600 rounded text-white disabled:opacity-50"
        onClick={claimPoints}
        disabled={isClaiming || isSuccess}
      >
        {isClaiming ? 'Claiming...' : isSuccess ? 'Points Claimed!' : 'Claim Points'}
      </button>
      {error && <div className="text-red-400 mt-2">{error}</div>}
      {isSuccess && <div className="text-green-400 mt-2">Points successfully claimed!</div>}
    </div>
  );
}
