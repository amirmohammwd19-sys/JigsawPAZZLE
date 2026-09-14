import { GameStats, Record } from './types';
const STATS_KEY = 'puzzleMasterStats';
const RECORDS_KEY = 'puzzleMasterRecords';
export function getStats(): GameStats { try { const d = localStorage.getItem(STATS_KEY); if (d) return JSON.parse(d); } catch {} return { gamesPlayed: 0, totalMoves: 0, bestStreak: 0, totalCorrect: 0, maxCombo: 0, achievements: [], totalXP: 0, totalTime: 0, bestEfficiency: 0 }; }
export function saveStats(stats: GameStats): void { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {} }
export function getRecords(): { [key: string]: Record } { try { const d = localStorage.getItem(RECORDS_KEY); if (d) return JSON.parse(d); } catch {} return {}; }
export function getRecord(name: string): Record | null { return getRecords()[name] || null; }
export function saveRecord(name: string, time: number, moves: number, streak: number, combo: number): boolean { try { const r = getRecords(); const e = r[name]; const isNew = !e || time < e.time || (time === e.time && moves < e.moves); if (isNew) { r[name] = { time, moves, streak, combo, date: new Date().toISOString() }; localStorage.setItem(RECORDS_KEY, JSON.stringify(r)); return true; } return false; } catch { return false; } }
export function unlockAchievement(id: string): boolean { try { const s = getStats(); if (!s.achievements.includes(id)) { s.achievements.push(id); saveStats(s); return true; } return false; } catch { return false; } }
export function hasAchievement(id: string): boolean { return getStats().achievements.includes(id); }
