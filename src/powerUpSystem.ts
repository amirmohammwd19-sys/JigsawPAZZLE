import { Piece } from './types';

// Power-up types
export type PowerUpType = 
  | 'freeze_time'
  | 'auto_place'
  | 'reveal'
  | 'undo_all'
  | 'double_xp'
  | 'auto_solve'
  | 'time_bonus'
  | 'streak_protect'
  | 'hint_master'
  | 'speed_boost';

export interface ActivePowerUp {
  id: PowerUpType;
  expiresAt: number;
  value?: number;
}

// Power-up effects
export function applyPowerUpEffect(
  powerUpId: PowerUpType,
  pieces: Piece[],
  time: number,
  setTime: (time: number) => void,
  setPieces: (pieces: Piece[]) => void,
  setToast: (msg: string) => void
): void {
  switch (powerUpId) {
    case 'freeze_time':
      // Freeze time for 10 seconds
      const freezeTime = 10;
      setToast(`⏸️ زمان برای ${freezeTime} ثانیه متوقف شد!`);
      // This would need to be implemented in the game loop
      break;

    case 'auto_place':
      // Auto-place one random incorrect piece
      const incorrectPieces = pieces.filter(p => p.r !== p.cr || p.c !== p.cc);
      if (incorrectPieces.length > 0) {
        const randomPiece = incorrectPieces[Math.floor(Math.random() * incorrectPieces.length)];
        const newPieces = pieces.map(p => {
          if (p.id === randomPiece.id) {
            return { ...p, r: p.cr, c: p.cc };
          }
          return p;
        });
        setPieces(newPieces);
        setToast(`✨ یک تکه به صورت خودکار قرار گرفت!`);
      }
      break;

    case 'reveal':
      // Reveal 3 correct positions
      setToast(`👁️ 3 جایگاه درست آشکار شد!`);
      // This would highlight pieces on the board
      break;

    case 'undo_all':
      // Reset all pieces to initial state
      setToast(`↩️ تمام حرکات برگردانده شد!`);
      // This would reset the puzzle
      break;

    case 'double_xp':
      // Double XP for next puzzle
      setToast(`💎 XP دوگانه برای پازل بعدی فعال شد!`);
      break;

    case 'auto_solve':
      // Auto-solve 5 pieces
      const unsolvedPieces = pieces.filter(p => p.r !== p.cr || p.c !== p.cc);
      const toSolve = unsolvedPieces.slice(0, 5);
      const newPieces = pieces.map(p => {
        if (toSolve.find(tp => tp.id === p.id)) {
          return { ...p, r: p.cr, c: p.cc };
        }
        return p;
      });
      setPieces(newPieces);
      setToast(`🤖 5 تکه به صورت خودکار حل شد!`);
      break;

    case 'time_bonus':
      // Add 30 seconds to timer
      setTime(time + 30);
      setToast(`⏰ 30 ثانیه به زمان اضافه شد!`);
      break;

    case 'streak_protect':
      // Protect streak for 3 moves
      setToast(`🛡️ Streak برای 3 حرکت محافظت می‌شود!`);
      break;

    case 'hint_master':
      // 5 free hints
      setToast(`🎓 5 راهنمای رایگان دریافت کردید!`);
      break;

    case 'speed_boost':
      // Speed up animations
      setToast(`⚡ سرعت انیمیشن‌ها افزایش یافت!`);
      break;
  }
}

// Check if power-up is active
export function isPowerUpActive(activePowerUps: ActivePowerUp[], powerUpId: PowerUpType): boolean {
  const now = Date.now();
  return activePowerUps.some(p => p.id === powerUpId && p.expiresAt > now);
}

// Clean up expired power-ups
export function cleanupExpiredPowerUps(activePowerUps: ActivePowerUp[]): ActivePowerUp[] {
  const now = Date.now();
  return activePowerUps.filter(p => p.expiresAt > now);
}

// Get remaining time for active power-up
export function getPowerUpRemainingTime(activePowerUps: ActivePowerUp[], powerUpId: PowerUpType): number {
  const powerUp = activePowerUps.find(p => p.id === powerUpId);
  if (!powerUp) return 0;
  return Math.max(0, powerUp.expiresAt - Date.now());
}
