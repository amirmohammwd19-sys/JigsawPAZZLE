let audioCtx: AudioContext | null = null;
let masterVolume = 1.0;

function getCtx(): AudioContext { 
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); 
  return audioCtx; 
}

export function setMasterVolume(v: number): void { 
  masterVolume = Math.max(0, Math.min(1, v)); 
}

export function getMasterVolume(): number { 
  return masterVolume; 
}

function createSmoothTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.05, attack: number = 0.02, release: number = 0.1): void {
  try {
    const ctx = getCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const adjustedVolume = volume * masterVolume;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(adjustedVolume, ctx.currentTime + attack);
    gainNode.gain.setValueAtTime(adjustedVolume, ctx.currentTime + duration - release);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {}
}

export function beep(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.06): void {
  createSmoothTone(frequency, duration, type, volume);
}

export function playClick(): void { createSmoothTone(800, 0.08, 'sine', 0.03, 0.01, 0.05); }
export function playSelect(): void { createSmoothTone(600, 0.1, 'sine', 0.04, 0.02, 0.06); }
export function playSwap(): void { createSmoothTone(440, 0.15, 'triangle', 0.04, 0.02, 0.08); }
export function playCorrect(): void {
  createSmoothTone(523.25, 0.2, 'sine', 0.06, 0.02, 0.1);
  setTimeout(() => createSmoothTone(659.25, 0.2, 'sine', 0.05, 0.02, 0.1), 80);
  setTimeout(() => createSmoothTone(783.99, 0.25, 'sine', 0.04, 0.02, 0.12), 160);
}
export function playCombo(): void {
  createSmoothTone(880, 0.15, 'sine', 0.06, 0.01, 0.08);
  setTimeout(() => createSmoothTone(1100, 0.15, 'sine', 0.05, 0.01, 0.08), 60);
  setTimeout(() => createSmoothTone(1320, 0.2, 'sine', 0.04, 0.01, 0.1), 120);
}
export function playUndo(): void {
  createSmoothTone(400, 0.15, 'sine', 0.04, 0.02, 0.08);
  setTimeout(() => createSmoothTone(350, 0.15, 'sine', 0.03, 0.02, 0.08), 80);
}
export function playHint(): void {
  createSmoothTone(880, 0.25, 'sine', 0.05, 0.02, 0.12);
  setTimeout(() => createSmoothTone(1100, 0.2, 'sine', 0.04, 0.02, 0.1), 100);
}
export function playAutoSolve(): void { createSmoothTone(600, 0.12, 'sine', 0.04, 0.02, 0.06); }
export function playWin(): void {
  [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
    setTimeout(() => createSmoothTone(f, 0.5, 'sine', 0.05, 0.03, 0.2), i * 100);
  });
}
export function playTimeWarning(): void {
  createSmoothTone(800, 0.12, 'sine', 0.06, 0.01, 0.06);
  setTimeout(() => createSmoothTone(800, 0.12, 'sine', 0.06, 0.01, 0.06), 200);
}
export function playAchievement(): void {
  [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => {
    setTimeout(() => createSmoothTone(f, 0.3, 'sine', 0.05, 0.02, 0.15), i * 80);
  });
}
