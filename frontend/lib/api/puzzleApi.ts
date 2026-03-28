// frontend/lib/api/puzzleApi.ts
import axios from 'axios';
import { Puzzle, PuzzleQueryParams } from '../types/puzzles';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

export async function getPuzzles(query: PuzzleQueryParams): Promise<Puzzle[]> {
  const response = await api.get('/puzzles', { params: query });
  return response.data;
}

export async function getPuzzleById(id: string): Promise<Puzzle> {
  const response = await api.get(`/puzzles/${id}`);
  return response.data;
}

export async function getDailyQuestPuzzles(): Promise<Puzzle[]> {
  const response = await api.get('/puzzles/daily-quest');
  return response.data;
}
