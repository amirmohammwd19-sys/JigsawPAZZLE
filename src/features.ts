import { GameStats } from './types';
export function calculateXP(moves: number, time: number, streak: number, combo: number): number { let xp = 100; if (moves < 50) xp += 200; else if (moves < 100) xp += 100; if (time < 60) xp += 300; else if (time < 120) xp += 200; xp += streak * 10; xp += combo * 15; return xp; }
export function calculateLevel(totalXP: number): number { return Math.floor(Math.sqrt(totalXP / 100)) + 1; }
export function getProgressToNextLevel(totalXP: number): number { const l = calculateLevel(totalXP); const c = Math.pow(l-1, 2) * 100; const n = Math.pow(l, 2) * 100; return Math.round(((totalXP - c) / (n - c)) * 100); }
export function calculateStreakBonus(streak: number): number { if (streak >= 20) return 500; if (streak >= 15) return 300; if (streak >= 10) return 200; if (streak >= 5) return 100; if (streak >= 3) return 50; return 0; }
export function calculateMoveEfficiency(moves: number, total: number): number { return Math.min(100, Math.round((total / moves) * 100)); }
export function calculateTimeBonus(time: number, total: number): number { const e = total * 2; if (time < e * 0.5) return 500; if (time < e * 0.75) return 300; if (time < e) return 150; return 50; }
export function hasSeenTutorial(): boolean { try { return localStorage.getItem('tutorialSeen') === 'true'; } catch { return false; } }
export function markTutorialAsSeen(): void { try { localStorage.setItem('tutorialSeen', 'true'); } catch {} }
export const TUTORIAL_STEPS = [
  { id: 1, title: 'به بازی پازل خوش آمدید!', description: 'این بازی به شما کمک می‌کند تا مهارت‌های حل مسئله خود را تقویت کنید.', emoji: '👋' },
  { id: 2, title: 'هدف بازی', description: 'تمام تکه‌های پازل را در جای درست قرار دهید.', emoji: '🎯' },
  { id: 3, title: 'نحوه بازی', description: 'روی تکه‌ها کلیک کنید یا آنها را بکشید و رها کنید.', emoji: '🖱️' },
  { id: 4, title: 'آماده‌اید؟', description: 'حالا یک پازل انتخاب کنید و شروع کنید!', emoji: '🚀' },
];
export const POWER_UPS = [
  { id: 'freeze_time', name: 'توقف زمان', emoji: '⏸️', desc: 'زمان را 10 ثانیه متوقف کن', cost: 50 },
  { id: 'auto_place', name: 'قرار دادن خودکار', emoji: '✨', desc: 'یک تکه را خودکار قرار بده', cost: 100 },
  { id: 'reveal', name: 'آشکارسازی', emoji: '👁️', desc: '3 تکه درست را نشان بده', cost: 75 },
  { id: 'undo_all', name: 'برگشت کامل', emoji: '↩️', desc: 'تمام حرکات را برگردان', cost: 150 },
  { id: 'double_xp', name: 'XP دوگانه', emoji: '💎', desc: 'XP دریافتی را دو برابر کن', cost: 200 },
  { id: 'auto_solve', name: 'حل خودکار', emoji: '🤖', desc: '5 تکه را خودکار حل کن', cost: 300 },
];
export const THEMES = [
  { id: 'cosmic', name: 'کهکشانی', emoji: '🌌', background: 'from-indigo-900 via-purple-900 to-pink-900', unlockLevel: 1 },
  { id: 'ocean', name: 'اقیانوس', emoji: '🌊', background: 'from-blue-900 via-cyan-900 to-teal-900', unlockLevel: 3 },
  { id: 'forest', name: 'جنگل', emoji: '🌲', background: 'from-green-900 via-emerald-900 to-teal-900', unlockLevel: 5 },
  { id: 'sunset', name: 'غروب', emoji: '🌅', background: 'from-orange-900 via-red-900 to-pink-900', unlockLevel: 7 },
  { id: 'midnight', name: 'نیمه‌شب', emoji: '🌙', background: 'from-slate-900 via-gray-900 to-zinc-900', unlockLevel: 10 },
  { id: 'aurora', name: 'شفق قطبی', emoji: '✨', background: 'from-green-900 via-blue-900 to-purple-900', unlockLevel: 15 },
];
export function getCurrentTheme() { try { const id = localStorage.getItem('currentTheme') || 'cosmic'; return THEMES.find(t => t.id === id) || THEMES[0]; } catch { return THEMES[0]; } }
export function setTheme(id: string): void { try { localStorage.setItem('currentTheme', id); } catch {} }
export function getUnlockedThemes(level: number) { return THEMES.filter(t => t.unlockLevel <= level); }
export function getDailyChallenge() { const today = new Date(); const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate(); return { date: today.toISOString().split('T')[0], puzzleId: (seed % 10) + 1, difficulty: ['easy', 'medium', 'hard'][seed % 3] }; }
export function hasCompletedDailyChallenge(): boolean { try { const d = localStorage.getItem('dailyChallenge'); if (!d) return false; const { date, completed } = JSON.parse(d); return date === new Date().toISOString().split('T')[0] && completed; } catch { return false; } }
export function completeDailyChallenge(): void { try { localStorage.setItem('dailyChallenge', JSON.stringify({ date: new Date().toISOString().split('T')[0], completed: true })); } catch {} }

// Daily Rewards
export function getDailyRewards() { return [{ day: 1, reward: 50 }, { day: 2, reward: 75 }, { day: 3, reward: 100 }, { day: 4, reward: 150 }, { day: 5, reward: 200 }, { day: 6, reward: 250 }, { day: 7, reward: 500 }]; }
export function getLoginStreak(): number { try { const d = localStorage.getItem('loginStreak'); if (!d) return 0; const { lastLogin, streak } = JSON.parse(d); const today = new Date().toDateString(); const yesterday = new Date(Date.now() - 86400000).toDateString(); if (lastLogin === today) return streak; if (lastLogin === yesterday) return streak; return 0; } catch { return 0; } }
export function claimDailyReward(): { success: boolean; reward: number } { try { const today = new Date().toDateString(); const d = localStorage.getItem('loginStreak'); let streak = 0, lastClaimed = ''; if (d) { const p = JSON.parse(d); streak = p.streak || 0; lastClaimed = p.lastLogin || ''; } if (lastClaimed === today) return { success: false, reward: 0 }; const yesterday = new Date(Date.now() - 86400000).toDateString(); if (lastClaimed === yesterday) streak += 1; else streak = 1; const rewards = getDailyRewards(); const reward = rewards[(streak - 1) % 7].reward; localStorage.setItem('loginStreak', JSON.stringify({ streak, lastLogin: today })); return { success: true, reward }; } catch { return { success: false, reward: 0 }; } }

// Quests
export interface Quest { id: string; title: string; description: string; emoji: string; target: number; reward: number; type: 'daily' | 'weekly'; progress: number; }
export function getDailyQuests(): Quest[] { return [{ id: 'complete_3', title: 'سه پازل کامل کن', description: '3 پازل را کامل کن', emoji: '🎯', target: 3, reward: 200, type: 'daily', progress: 0 }, { id: 'earn_500', title: '500 XP کسب کن', description: '500 XP جمع کن', emoji: '💎', target: 500, reward: 150, type: 'daily', progress: 0 }]; }
export function loadQuestProgress(): Quest[] { try { const d = localStorage.getItem('questProgress'); if (d) return JSON.parse(d); } catch {} return [...getDailyQuests()]; }
export function saveQuestProgress(quests: Quest[]): void { try { localStorage.setItem('questProgress', JSON.stringify(quests)); } catch {} }

// Share
export function generateShareResult(puzzle: string, time: number, moves: number, level: number, xp: number): string { return `🧩 Puzzle Master\n\nپازل: ${puzzle}\nزمان: ${Math.floor(time/60)}:${(time%60).toString().padStart(2,'0')}\nحرکات: ${moves}\nسطح: ${level}\nXP: ${xp}\n\n#PuzzleMaster`; }
export function copyToClipboard(text: string): boolean { try { navigator.clipboard.writeText(text); return true; } catch { return false; } }
