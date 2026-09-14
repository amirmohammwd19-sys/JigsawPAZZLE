import { GameStats, Theme, PowerUp, TutorialStep } from './types';

// ============= XP & LEVEL SYSTEM =============
export function calculateXP(moves: number, time: number, streak: number, combo: number): number { 
  let xp = 100; 
  if (moves < 50) xp += 200; else if (moves < 100) xp += 100; 
  if (time < 60) xp += 300; else if (time < 120) xp += 200; 
  xp += streak * 10; 
  xp += combo * 15; 
  return xp; 
}

export function calculateLevel(totalXP: number): number { 
  return Math.floor(Math.sqrt(totalXP / 100)) + 1; 
}

export function getProgressToNextLevel(totalXP: number): number { 
  const l = calculateLevel(totalXP); 
  const c = Math.pow(l-1, 2) * 100; 
  const n = Math.pow(l, 2) * 100; 
  return Math.round(((totalXP - c) / (n - c)) * 100); 
}

export function calculateStreakBonus(streak: number): number { 
  if (streak >= 20) return 500; 
  if (streak >= 15) return 300; 
  if (streak >= 10) return 200; 
  if (streak >= 5) return 100; 
  if (streak >= 3) return 50; 
  return 0; 
}

export function calculateMoveEfficiency(moves: number, total: number): number { 
  return Math.min(100, Math.round((total / moves) * 100)); 
}

export function calculateTimeBonus(time: number, total: number): number { 
  const e = total * 2; 
  if (time < e * 0.5) return 500; 
  if (time < e * 0.75) return 300; 
  if (time < e) return 150; 
  return 50; 
}

// ============= TUTORIAL =============
export function hasSeenTutorial(): boolean { 
  try { return localStorage.getItem('tutorialSeen') === 'true'; } catch { return false; } 
}

export function markTutorialAsSeen(): void { 
  try { localStorage.setItem('tutorialSeen', 'true'); } catch {} 
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 1, title: 'به بازی پازل خوش آمدید!', description: 'این بازی به شما کمک می‌کند تا مهارت‌های حل مسئله خود را تقویت کنید.', emoji: '👋' },
  { id: 2, title: 'هدف بازی', description: 'تمام تکه‌های پازل را در جای درست قرار دهید تا تصویر کامل شود.', emoji: '🎯' },
  { id: 3, title: 'نحوه بازی', description: 'روی تکه‌ها کلیک کنید یا آنها را بکشید و رها کنید.', emoji: '🖱️' },
  { id: 4, title: 'Streak و Combo', description: 'با قرار دادن متوالی تکه‌ها، Streak و Combo افزایش می‌یابد.', emoji: '🔥' },
  { id: 5, title: 'Achievements', description: 'با انجام چالش‌ها، Achievements باز کنید و XP بیشتری دریافت کنید.', emoji: '🏆' },
  { id: 6, title: 'Power-ups', description: 'با XP خود می‌توانید Power-up بخرید و از آن‌ها در بازی استفاده کنید.', emoji: '✨' },
  { id: 7, title: 'آماده‌اید؟', description: 'حالا یک پازل انتخاب کنید و شروع کنید!', emoji: '🚀' },
];

// ============= POWER-UPS =============
export const POWER_UPS: PowerUp[] = [
  { id: 'freeze_time', name: 'توقف زمان', emoji: '⏸️', desc: 'زمان را 10 ثانیه متوقف کن', cost: 50 },
  { id: 'auto_place', name: 'قرار دادن خودکار', emoji: '✨', desc: 'یک تکه را خودکار قرار بده', cost: 100 },
  { id: 'reveal', name: 'آشکارسازی', emoji: '👁️', desc: '3 تکه درست را نشان بده', cost: 75 },
  { id: 'undo_all', name: 'برگشت کامل', emoji: '↩️', desc: 'تمام حرکات را برگردان', cost: 150 },
  { id: 'double_xp', name: 'XP دوگانه', emoji: '💎', desc: 'XP دریافتی را دو برابر کن', cost: 200 },
  { id: 'auto_solve', name: 'حل خودکار', emoji: '🤖', desc: '5 تکه را خودکار حل کن', cost: 300 },
  { id: 'time_bonus', name: 'زمان اضافی', emoji: '⏰', desc: '30 ثانیه زمان اضافی دریافت کن', cost: 125 },
  { id: 'streak_protect', name: 'محافظ Streak', emoji: '🛡️', desc: 'Streak خود را برای 3 حرکت حفظ کن', cost: 175 },
];

// ============= THEMES =============
export const THEMES: Theme[] = [
  { id: 'cosmic', name: 'کهکشانی', emoji: '🌌', background: 'from-indigo-900 via-purple-900 to-pink-900', accent: 'purple', unlockLevel: 1 },
  { id: 'ocean', name: 'اقیانوس', emoji: '🌊', background: 'from-blue-900 via-cyan-900 to-teal-900', accent: 'blue', unlockLevel: 3 },
  { id: 'forest', name: 'جنگل', emoji: '🌲', background: 'from-green-900 via-emerald-900 to-teal-900', accent: 'green', unlockLevel: 5 },
  { id: 'sunset', name: 'غروب', emoji: '🌅', background: 'from-orange-900 via-red-900 to-pink-900', accent: 'orange', unlockLevel: 7 },
  { id: 'midnight', name: 'نیمه‌شب', emoji: '🌙', background: 'from-slate-900 via-gray-900 to-zinc-900', accent: 'slate', unlockLevel: 10 },
  { id: 'aurora', name: 'شفق قطبی', emoji: '✨', background: 'from-green-900 via-blue-900 to-purple-900', accent: 'green', unlockLevel: 15 },
  { id: 'fire', name: 'آتش', emoji: '🔥', background: 'from-red-900 via-orange-900 to-yellow-900', accent: 'red', unlockLevel: 20 },
  { id: 'ice', name: 'یخ', emoji: '❄️', background: 'from-cyan-900 via-blue-900 to-indigo-900', accent: 'cyan', unlockLevel: 25 },
];

export function getCurrentTheme(): Theme { 
  try { 
    const themeId = localStorage.getItem('currentTheme') || 'cosmic'; 
    return THEMES.find(t => t.id === themeId) || THEMES[0]; 
  } catch { return THEMES[0]; } 
}

export function setTheme(themeId: string): void { 
  try { localStorage.setItem('currentTheme', themeId); } catch {} 
}

export function getUnlockedThemes(level: number): Theme[] { 
  return THEMES.filter(t => t.unlockLevel <= level); 
}

// ============= DAILY CHALLENGE =============
export function getDailyChallenge(): { date: string; puzzleId: number; difficulty: string } { 
  const today = new Date(); 
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate(); 
  return { 
    date: today.toISOString().split('T')[0], 
    puzzleId: (seed % 10) + 1, 
    difficulty: ['easy', 'medium', 'hard'][seed % 3] 
  }; 
}

export function hasCompletedDailyChallenge(): boolean { 
  try { 
    const data = localStorage.getItem('dailyChallenge'); 
    if (!data) return false; 
    const { date, completed } = JSON.parse(data); 
    return date === new Date().toISOString().split('T')[0] && completed; 
  } catch { return false; } 
}

export function completeDailyChallenge(): void { 
  try { 
    localStorage.setItem('dailyChallenge', JSON.stringify({ 
      date: new Date().toISOString().split('T')[0], 
      completed: true 
    })); 
  } catch {} 
}

// ============= SHARE =============
export function generateShareResult(puzzle: string, time: number, moves: number, level: number, xp: number): string { 
  const timeStr = `${Math.floor(time/60)}:${(time%60).toString().padStart(2,'0')}`;
  return `🧩 Puzzle Master\n\nپازل: ${puzzle}\nزمان: ${timeStr}\nحرکات: ${moves}\nسطح: ${level}\nXP: ${xp}\n\n#PuzzleMaster`; 
}

export function copyToClipboard(text: string): boolean { 
  try { navigator.clipboard.writeText(text); return true; } catch { return false; } 
}
