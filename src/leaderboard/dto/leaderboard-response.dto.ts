export class LeaderboardResponseDto {
  id: number;
  user: {
    id: string;
    username?: string;
    avatar?: string;
  };
  puzzlesCompleted: number;
  score: number;
  tokens: number;
  badge?: {
    id: number;
    name: string;
    description: string;
    icon?: string;
  };
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}
