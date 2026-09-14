// ============= TYPES =============
export interface Shape { top: number; right: number; bottom: number; left: number }
export interface Piece { id: number; cr: number; cc: number; r: number; c: number }
export interface Edges { h: number[][]; v: number[][] }
export interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
export interface GameStats { gamesPlayed: number; totalMoves: number; bestStreak: number; totalCorrect: number; maxCombo: number; achievements: string[]; totalXP?: number; totalTime?: number; bestEfficiency?: number }
export interface Record { time: number; moves: number; streak: number; combo: number; date: string }
