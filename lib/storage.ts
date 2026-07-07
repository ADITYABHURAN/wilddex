import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatchResult } from './identify';

export type StoredCatch = CatchResult & {
  id: string;
  caughtAt: number;
  latitude?: number;
  longitude?: number;
};

const STORAGE_KEY = 'wilddex:catches';

export async function saveCatch(catchResult: CatchResult): Promise<void> {
  const catches = await getAllCatches();
  const stored: StoredCatch = {
    ...catchResult,
    id: `${catchResult.species.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    caughtAt: Date.now(),
  };
  catches.push(stored);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(catches));
}

export async function getAllCatches(): Promise<StoredCatch[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as StoredCatch[];
}

export async function getCatchCountsBySpecies(): Promise<Record<string, number>> {
  const catches = await getAllCatches();
  const counts: Record<string, number> = {};
  for (const c of catches) {
    counts[c.species.id] = (counts[c.species.id] ?? 0) + 1;
  }
  return counts;
}
