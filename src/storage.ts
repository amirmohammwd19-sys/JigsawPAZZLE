import { GameStats, Record, LeaderboardEntry } from './types';
const STATS_KEY = 'puzzleMasterStats';
const RECORDS_KEY = 'puzzleMasterRecords';
const LEADERBOARD_KEY = 'puzzleMasterLeaderboard';
const AUTOSAVE_KEY = 'puzzleMasterAutoSave';

export function getStats(): GameStats { 
  try { const d = localStorage.getItem(STATS_KEY); if (d) return JSON.parse(d); } catch {} 
  return { gamesPlayed: 0, totalMoves: 0, bestStreak: 0, totalCorrect: 0, maxCombo: 0, achievements: [], totalXP: 0, totalTime: 0, bestEfficiency: 0 }; 
}

export function saveStats(stats: GameStats): void { 
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {} 
}

export function getRecords(): { [key: string]: Record } { 
  try { const d = localStorage.getItem(RECORDS_KEY); if (d) return JSON.parse(d); } catch {} 
  return {}; 
}

export function getRecord(name: string): Record | null { 
  return getRecords()[name] || null; 
}

export function saveRecord(name: string, time: number, moves: number, streak: number, combo: number): boolean { 
  try { 
    const r = getRecords(); 
    const e = r[name]; 
    const isNew = !e || time < e.time || (time === e.time && moves < e.moves); 
    if (isNew) { 
      r[name] = { time, moves, streak, combo, date: new Date().toISOString() }; 
      localStorage.setItem(RECORDS_KEY, JSON.stringify(r)); 
      return true; 
    } 
    return false; 
  } catch { return false; } 
}

export function unlockAchievement(id: string): boolean { 
  try { 
    const s = getStats(); 
    if (!s.achievements.includes(id)) { 
      s.achievements.push(id); 
      saveStats(s); 
      return true; 
    } 
    return false; 
  } catch { return false; } 
}

export function hasAchievement(id: string): boolean { 
  return getStats().achievements.includes(id); 
}

export function getLeaderboard(): LeaderboardEntry[] { 
  try { const d = localStorage.getItem(LEADERBOARD_KEY); if (d) return JSON.parse(d); } catch {} 
  return []; 
}

export function saveToLeaderboard(entry: LeaderboardEntry): void { 
  try { 
    const lb = getLeaderboard(); 
    lb.push(entry); 
    lb.sort((a, b) => b.score - a.score); 
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(lb.slice(0, 10))); 
  } catch {} 
}

export interface GameSave { puzzleName: string; pieces: any[]; moves: number; time: number; date: string; }

export function saveGame(save: GameSave): void { 
  try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(save)); } catch {} 
}

export function loadGame(): GameSave | null { 
  try { const d = localStorage.getItem(AUTOSAVE_KEY); if (d) return JSON.parse(d); } catch {} 
  return null; 
}

export function clearAutoSave(): void { 
  try { localStorage.removeItem(AUTOSAVE_KEY); } catch {} 
}

export function exportSaveData(): string { 
  try { 
    return JSON.stringify({ 
      stats: localStorage.getItem(STATS_KEY), 
      records: localStorage.getItem(RECORDS_KEY), 
      leaderboard: localStorage.getItem(LEADERBOARD_KEY), 
      exportDate: new Date().toISOString() 
    }, null, 2); 
  } catch { return ''; } 
}

export function importSaveData(json: string): boolean { 
  try { 
    const d = JSON.parse(json); 
    if (d.stats) localStorage.setItem(STATS_KEY, d.stats); 
    if (d.records) localStorage.setItem(RECORDS_KEY, d.records); 
    if (d.leaderboard) localStorage.setItem(LEADERBOARD_KEY, d.leaderboard); 
    return true; 
  } catch { return false; } 
}
