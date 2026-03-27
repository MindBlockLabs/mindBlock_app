import api from './client';

export interface SubmitAnswerDto {
  userId: string;
  puzzleId: string;
  answer: string;
  timeSpent?: number;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  correctAnswer?: string;
  explanation?: string;
  xpEarned: number;
  newTotalXp: number;
}

export async function submitAnswer(dto: SubmitAnswerDto): Promise<SubmitAnswerResponse> {
  const response = await api.post<SubmitAnswerResponse>('/progress/submit', dto);
  return response.data;
}
