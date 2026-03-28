// frontend/lib/api/categoryApi.ts
import axios from 'axios';
import type { Category } from '../types/puzzles';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

interface CategoriesResponse {
  success: boolean;
  data: Category[];
  count: number;
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<CategoriesResponse>('/categories');
  // Backend returns { success, data: [...], count }
  return response.data.data ?? [];
}
