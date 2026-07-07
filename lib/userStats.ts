import { supabase } from './supabase';

export async function getUserTotalXp(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('catches')
    .select('xp_earned')
    .eq('user_id', userId);
  if (error) throw error;

  return (data as { xp_earned: number }[]).reduce((sum, row) => sum + row.xp_earned, 0);
}

export type LevelInfo = {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
};

const XP_PER_LEVEL = 100;

// Flat placeholder formula (100 XP per level) — a first pass, not tuned game
// economy. Revisit once real balance/pacing is considered.
export function computeLevel(totalXp: number): LevelInfo {
  return {
    level: Math.floor(totalXp / XP_PER_LEVEL) + 1,
    xpIntoLevel: totalXp % XP_PER_LEVEL,
    xpForNextLevel: XP_PER_LEVEL,
  };
}
