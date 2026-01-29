export interface PuzzleResponseDto {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  categoryId: string;
  points: number;
  timeLimit: number;
  isCompleted: boolean;
}

export interface DailyQuestResponseDto {
  id: number;
  questDate: string;
  totalQuestions: number;
  completedQuestions: number;
  isCompleted: boolean;
  pointsEarned: number;
  createdAt: string;
  completedAt?: string | null;
  puzzles: PuzzleResponseDto[];
}

export interface SubmitAnswerRequestDto {
  userId: string;
  puzzleId: string;
  categoryId: string;
  userAnswer: string;
  timeSpent: number;
}

export interface SubmitAnswerResponseDto {
  isCorrect: boolean;
  pointsEarned: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const token = window.localStorage.getItem("accessToken");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("Content-Type");
  const isJson = contentType && contentType.includes("application/json");

  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      (data && (data.message as string | undefined)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function fetchDailyQuest(): Promise<DailyQuestResponseDto> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  const response = await fetch(`${API_BASE_URL}/puzzles/daily-quest`, {
    method: "GET",
    headers,
  });

  return handleResponse<DailyQuestResponseDto>(response);
}

export interface FetchPuzzlesParams {
  categoryId: string;
  difficulty?: string;
}

export async function fetchPuzzles(
  params: FetchPuzzlesParams,
): Promise<PuzzleResponseDto[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("categoryId", params.categoryId);
  if (params.difficulty) {
    searchParams.set("difficulty", params.difficulty);
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  const response = await fetch(
    `${API_BASE_URL}/puzzles?${searchParams.toString()}`,
    {
      method: "GET",
      headers,
    },
  );

  return handleResponse<PuzzleResponseDto[]>(response);
}

export async function submitAnswer(
  payload: SubmitAnswerRequestDto,
): Promise<SubmitAnswerResponseDto> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  const response = await fetch(`${API_BASE_URL}/puzzles/submit`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  // The backend likely returns a ProgressCalculationResult with validation info.
  const raw = await handleResponse<any>(response);

  const validation = raw?.validation ?? raw;

  return {
    isCorrect:
      typeof validation?.isCorrect === "boolean" ? validation.isCorrect : false,
    pointsEarned:
      typeof validation?.pointsEarned === "number"
        ? validation.pointsEarned
        : 0,
  };
}

