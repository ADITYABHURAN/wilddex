import { supabase } from './supabase';

// Social-proof helper: how many catches of this species (across ALL users)
// happened in the last `sinceDays` days. Intentionally has no user_id filter.
export async function getGlobalCatchCount(
  speciesId: string,
  sinceDays: number = 7
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - sinceDays);

  const { count, error } = await supabase
    .from('catches')
    .select('*', { count: 'exact', head: true })
    .eq('species_id', speciesId)
    .gte('caught_at', cutoff.toISOString());
  if (error) throw error;

  return count ?? 0;
}
