export interface Shape { top: number; right: number; bottom: number; left: number }
export interface Piece { id: number; cr: number; cc: number; r: number; c: number }
export interface Edges { h: number[][]; v: number[][] }
export interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
export interface GameStats { gamesPlayed: number; totalMoves: number; bestStreak: number; totalCorrect: number; maxCombo: number; achievements: string[]; totalXP?: number; totalTime?: number; bestEfficiency?: number }
export interface Record { time: number; moves: number; streak: number; combo: number; date: string }
export interface LeaderboardEntry { name: string; score: number; date: string; puzzle: string }
export interface Quest { id: string; title: string; description: string; emoji: string; target: number; reward: number; type: 'daily' | 'weekly'; progress: number }
export interface Achievement { id: string; title: string; desc: string; emoji: string; target: number }
export interface Theme { id: string; name: string; emoji: string; background: string; accent: string; unlockLevel: number }
export interface PowerUp { id: string; name: string; emoji: string; desc: string; cost: number }
export interface TutorialStep { id: number; title: string; description: string; emoji: string }
