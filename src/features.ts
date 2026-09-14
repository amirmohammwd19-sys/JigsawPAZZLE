import { GameStats, Theme, PowerUp, TutorialStep } from './types';

// ============= XP & LEVEL SYSTEM =============
export function calculateXP(moves: number, time: number, streak: number, combo: number): number { 
  let xp = 100; // XP پایه
  
  // بونوس حرکات (کمتر = بهتر)
  if (moves < 30) xp += 400;      // عالی
  else if (moves < 50) xp += 300; // بسیار خوب
  else if (moves < 70) xp += 200; // خوب
  else if (moves < 100) xp += 100; // متوسط
  
  // بونوس زمان (سریع‌تر = بهتر)
  if (time < 30) xp += 600;       // فوق سریع
  else if (time < 60) xp += 400;  // بسیار سریع
  else if (time < 120) xp += 300; // سریع
  else if (time < 180) xp += 200; // متوسط
  
  // بونوس Streak (تصاعدی)
  if (streak >= 30) xp += 2000;   // افسانه‌ای
  else if (streak >= 25) xp += 1500; // اسطوره‌ای
  else if (streak >= 20) xp += 1200; // فوق‌العاده
  else if (streak >= 15) xp += 900;  // عالی
  else if (streak >= 10) xp += 600;  // بسیار خوب
  else if (streak >= 7) xp += 400;   // خوب
  else if (streak >= 5) xp += 250;   // متوسط
  else if (streak >= 3) xp += 150;   // شروع خوب
  
  // بونوس Combo (تصاعدی)
  if (combo >= 20) xp += 2500;    // افسانه‌ای
  else if (combo >= 15) xp += 1800; // اسطوره‌ای
  else if (combo >= 10) xp += 1200; // فوق‌العاده
  else if (combo >= 7) xp += 800;   // عالی
  else if (combo >= 5) xp += 500;   // بسیار خوب
  else if (combo >= 3) xp += 300;   // خوب
  
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
  // سیستم امتیازدهی تصاعدی برای Streak
  if (streak >= 30) return 1500; // افسانه‌ای
  if (streak >= 25) return 1200; // اسطوره‌ای
  if (streak >= 20) return 1000; // فوق‌العاده
  if (streak >= 15) return 750;  // عالی
  if (streak >= 10) return 500;  // بسیار خوب
  if (streak >= 7) return 300;   // خوب
  if (streak >= 5) return 200;   // متوسط
  if (streak >= 3) return 100;   // شروع خوب
  return 0; 
}

export function calculateComboBonus(combo: number): number {
  // سیستم امتیازدهی تصاعدی برای Combo
  if (combo >= 20) return 2000; // افسانه‌ای
  if (combo >= 15) return 1500; // اسطوره‌ای
  if (combo >= 10) return 1000; // فوق‌العاده
  if (combo >= 7) return 600;   // عالی
  if (combo >= 5) return 400;   // بسیار خوب
  if (combo >= 3) return 200;   // خوب
  return 0;
}

// تابع کمکی برای دریافت اطلاعات سطح Streak
export function getStreakLevel(streak: number): { level: string; emoji: string; color: string } {
  if (streak >= 30) return { level: 'افسانه‌ای', emoji: '👑', color: 'from-yellow-400 to-orange-500' };
  if (streak >= 25) return { level: 'اسطوره‌ای', emoji: '🌟', color: 'from-purple-400 to-pink-500' };
  if (streak >= 20) return { level: 'فوق‌العاده', emoji: '💎', color: 'from-blue-400 to-purple-500' };
  if (streak >= 15) return { level: 'عالی', emoji: '🔥', color: 'from-red-400 to-orange-500' };
  if (streak >= 10) return { level: 'بسیار خوب', emoji: '⚡', color: 'from-yellow-400 to-red-500' };
  if (streak >= 7) return { level: 'خوب', emoji: '✨', color: 'from-green-400 to-blue-500' };
  if (streak >= 5) return { level: 'متوسط', emoji: '💫', color: 'from-blue-400 to-cyan-500' };
  if (streak >= 3) return { level: 'شروع خوب', emoji: '🌟', color: 'from-cyan-400 to-blue-500' };
  return { level: 'معمولی', emoji: '⭐', color: 'from-gray-400 to-gray-500' };
}

// تابع کمکی برای دریافت اطلاعات سطح Combo
export function getComboLevel(combo: number): { level: string; emoji: string; color: string } {
  if (combo >= 20) return { level: 'افسانه‌ای', emoji: '👑', color: 'from-yellow-400 to-orange-500' };
  if (combo >= 15) return { level: 'اسطوره‌ای', emoji: '🌟', color: 'from-purple-400 to-pink-500' };
  if (combo >= 10) return { level: 'فوق‌العاده', emoji: '💎', color: 'from-blue-400 to-purple-500' };
  if (combo >= 7) return { level: 'عالی', emoji: '🔥', color: 'from-red-400 to-orange-500' };
  if (combo >= 5) return { level: 'بسیار خوب', emoji: '⚡', color: 'from-yellow-400 to-red-500' };
  if (combo >= 3) return { level: 'خوب', emoji: '✨', color: 'from-green-400 to-blue-500' };
  return { level: 'معمولی', emoji: '⭐', color: 'from-gray-400 to-gray-500' };
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
  { id: 'hint_master', name: 'استاد راهنما', emoji: '🎓', desc: '5 راهنمای رایگان دریافت کن', cost: 150 },
  { id: 'speed_boost', name: 'افزایش سرعت', emoji: '⚡', desc: 'سرعت انیمیشن‌ها را 2 برابر کن', cost: 100 },
];

// Power-up usage tracking
export function getUsedPowerUps(): string[] {
  try {
    const data = localStorage.getItem('usedPowerUps');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function markPowerUpUsed(powerUpId: string): void {
  try {
    const used = getUsedPowerUps();
    used.push(powerUpId);
    localStorage.setItem('usedPowerUps', JSON.stringify(used));
  } catch {}
}

export function canUsePowerUp(powerUpId: string): boolean {
  const used = getUsedPowerUps();
  return !used.includes(powerUpId);
}

export function resetPowerUps(): void {
  try {
    localStorage.removeItem('usedPowerUps');
  } catch {}
}

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
