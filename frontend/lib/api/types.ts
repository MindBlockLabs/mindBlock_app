// frontend/lib/api/types.ts
export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}
