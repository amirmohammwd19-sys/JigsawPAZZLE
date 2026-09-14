import { Achievement } from './types';
import { unlockAchievement, hasAchievement } from './storage';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', title: 'اولین پیروزی', desc: 'اولین پازل رو کامل کن', emoji: '🎉', target: 1 },
  { id: 'speed_demon', title: 'شیطان سرعت', desc: 'پازل رو زیر 2 دقیقه حل کن', emoji: '⚡', target: 120 },
  { id: 'perfectionist', title: 'کمال‌گرا', desc: 'پازل رو با کمتر از 50 حرکت حل کن', emoji: '✨', target: 50 },
  { id: 'streak_master', title: 'استاد Streak', desc: 'به streak 10 برس', emoji: '🔥', target: 10 },
  { id: 'puzzle_master', title: 'استاد پازل', desc: '10 پازل کامل کن', emoji: '🏆', target: 10 },
  { id: 'combo_king', title: 'پادشاه Combo', desc: 'به combo 5 برس', emoji: '💎', target: 5 },
  { id: 'marathon', title: 'ماراتن', desc: '50 حرکت در یک بازی', emoji: '🏃', target: 50 },
  { id: 'zen_master', title: 'استاد ذن', desc: '5 بازی در حالت ذن کامل کن', emoji: '🧘', target: 5 },
  { id: 'time_lord', title: 'ارباب زمان', desc: '3 بازی در حالت حمله زمانی کامل کن', emoji: '⏱️', target: 3 },
  { id: 'hardcore', title: 'سخت‌کوش', desc: 'یک پازل سخت را کامل کن', emoji: '💪', target: 1 },
  { id: 'lightning_fast', title: 'سریع‌تر از نور', desc: 'پازل رو زیر 1 دقیقه حل کن', emoji: '⚡', target: 60 },
  { id: 'efficient', title: 'بهره‌ور', desc: 'پازل رو با کمتر از 30 حرکت حل کن', emoji: '🎯', target: 30 },
  { id: 'collector', title: 'جمع‌آورنده', desc: '25 پازل کامل کن', emoji: '📦', target: 25 },
  { id: 'unstoppable', title: 'توقف‌ناپذیر', desc: 'به streak 20 برس', emoji: '🚀', target: 20 },
  { id: 'legend', title: 'افسانه', desc: '50 پازل کامل کن', emoji: '👑', target: 50 },
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
  if (time < 60 && !hasAchievement('lightning_fast')) { if (unlockAchievement('lightning_fast')) newlyUnlocked.push('lightning_fast'); }
  if (moves < 30 && !hasAchievement('efficient')) { if (unlockAchievement('efficient')) newlyUnlocked.push('efficient'); }
  if (gamesPlayed >= 25 && !hasAchievement('collector')) { if (unlockAchievement('collector')) newlyUnlocked.push('collector'); }
  if (bestStreak >= 20 && !hasAchievement('unstoppable')) { if (unlockAchievement('unstoppable')) newlyUnlocked.push('unstoppable'); }
  if (gamesPlayed >= 50 && !hasAchievement('legend')) { if (unlockAchievement('legend')) newlyUnlocked.push('legend'); }
  
  return { newlyUnlocked, allAchievements: ACHIEVEMENTS };
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}
