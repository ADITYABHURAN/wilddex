import { supabase } from './supabase';

export type StreakInfo = {
  currentStreak: number;
  longestStreak: number;
};

type StreakRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_catch_date: string | null;
  updated_at: string;
};

// Uses the device's local date, not UTC — a known MVP simplification, see
// the user_streaks comment block in supabase/schema.sql.
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function updateStreakOnCatch(
  userId: string
): Promise<{ currentStreak: number; isNewRecord: boolean }> {
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  const row = data as StreakRow | null;
  const previousStreak = row?.current_streak ?? 0;
  const previousLongest = row?.longest_streak ?? 0;
  const lastCatchDate = row?.last_catch_date ?? null;

  const now = new Date();
  const today = toLocalDateString(now);

  if (lastCatchDate === today) {
    return { currentStreak: previousStreak, isNewRecord: false };
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutiveDay = lastCatchDate === toLocalDateString(yesterday);

  const currentStreak = isConsecutiveDay ? previousStreak + 1 : 1;
  const longestStreak = Math.max(previousLongest, currentStreak);
  const isNewRecord = longestStreak > previousLongest;

  const { error: upsertError } = await supabase.from('user_streaks').upsert({
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_catch_date: today,
    updated_at: now.toISOString(),
  });
  if (upsertError) throw upsertError;

  return { currentStreak, isNewRecord };
}

export async function getStreak(userId: string): Promise<StreakInfo | null> {
  const { data, error } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return { currentStreak: data.current_streak, longestStreak: data.longest_streak };
}
