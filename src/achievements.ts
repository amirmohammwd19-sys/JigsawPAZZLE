import { unlockAchievement, hasAchievement } from './storage';
export interface Achievement { id: string; title: string; desc: string; emoji: string; target: number }
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', title: 'اولین پیروزی', desc: 'اولین پازل رو کامل کن', emoji: '🎉', target: 1 },
  { id: 'speed_demon', title: 'شیطان سرعت', desc: 'پازل رو زیر 2 دقیقه حل کن', emoji: '⚡', target: 120 },
  { id: 'perfectionist', title: 'کمال‌گرا', desc: 'پازل رو با کمتر از 50 حرکت حل کن', emoji: '✨', target: 50 },
  { id: 'streak_master', title: 'استاد Streak', desc: 'به streak 10 برس', emoji: '🔥', target: 10 },
  { id: 'puzzle_master', title: 'استاد پازل', desc: '10 پازل کامل کن', emoji: '🏆', target: 10 },
  { id: 'combo_king', title: 'پادشاه Combo', desc: 'به combo 5 برس', emoji: '💎', target: 5 },
  { id: 'marathon', title: 'ماراتن', desc: '50 حرکت در یک بازی', emoji: '🏃', target: 50 },
];
export interface AchievementCheckResult { newlyUnlocked: string[]; allAchievements: Achievement[] }
export function checkAchievements(gamesPlayed: number, time: number, moves: number, bestStreak: number, maxCombo: number, gameMode?: string, difficulty?: string): AchievementCheckResult {
  const newlyUnlocked: string[] = [];
  if (gamesPlayed >= 1 && !hasAchievement('first_win')) { if (unlockAchievement('first_win')) newlyUnlocked.push('first_win'); }
  if (time < 120 && !hasAchievement('speed_demon')) { if (unlockAchievement('speed_demon')) newlyUnlocked.push('speed_demon'); }
  if (moves < 50 && !hasAchievement('perfectionist')) { if (unlockAchievement('perfectionist')) newlyUnlocked.push('perfectionist'); }
  if (bestStreak >= 10 && !hasAchievement('streak_master')) { if (unlockAchievement('streak_master')) newlyUnlocked.push('streak_master'); }
  if (gamesPlayed >= 10 && !hasAchievement('puzzle_master')) { if (unlockAchievement('puzzle_master')) newlyUnlocked.push('puzzle_master'); }
  if (maxCombo >= 5 && !hasAchievement('combo_king')) { if (unlockAchievement('combo_king')) newlyUnlocked.push('combo_king'); }
  if (moves >= 50 && !hasAchievement('marathon')) { if (unlockAchievement('marathon')) newlyUnlocked.push('marathon'); }
  return { newlyUnlocked, allAchievements: ACHIEVEMENTS };
}
