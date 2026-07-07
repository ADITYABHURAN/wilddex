import { supabase } from './supabase';
import { CatchResult } from './identify';
import { SPECIES, Species } from '../data/species';
import { StoredCatch } from './storage';

type CatchRow = {
  id: string;
  user_id: string;
  species_id: string;
  confidence: number | null;
  xp_earned: number;
  caught_at: string;
  latitude: number | null;
  longitude: number | null;
};

function speciesById(speciesId: string): Species {
  const species = SPECIES.find((s) => s.id === speciesId);
  if (!species) throw new Error(`Unknown species id from Supabase: ${speciesId}`);
  return species;
}

function rowToStoredCatch(row: CatchRow): StoredCatch {
  return {
    id: row.id,
    species: speciesById(row.species_id),
    confidence: row.confidence ?? 0,
    xpEarned: row.xp_earned,
    caughtAt: new Date(row.caught_at).getTime(),
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}

export async function saveCatchRemote(
  userId: string,
  catchResult: CatchResult,
  location?: { latitude: number; longitude: number } | null
): Promise<void> {
  const { error } = await supabase.from('catches').insert({
    user_id: userId,
    species_id: catchResult.species.id,
    confidence: catchResult.confidence,
    xp_earned: catchResult.xpEarned,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
  });
  if (error) throw error;
}

export async function getAllCatchesRemote(userId: string): Promise<StoredCatch[]> {
  const { data, error } = await supabase
    .from('catches')
    .select('*')
    .eq('user_id', userId)
    .order('caught_at', { ascending: false });
  if (error) throw error;
  return (data as CatchRow[]).map(rowToStoredCatch);
}

export async function getCatchCountsBySpeciesRemote(userId: string): Promise<Record<string, number>> {
  const catches = await getAllCatchesRemote(userId);
  const counts: Record<string, number> = {};
  for (const c of catches) {
    counts[c.species.id] = (counts[c.species.id] ?? 0) + 1;
  }
  return counts;
}
