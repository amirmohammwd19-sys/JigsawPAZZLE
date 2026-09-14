let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext { if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); return audioCtx; }
export function beep(f: number, d: number, t: OscillatorType = 'sine', v: number = 0.06): void { try { const c = getCtx(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = t; o.frequency.value = f; g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d); o.start(); o.stop(c.currentTime + d); } catch {} }
export function playClick(): void { beep(800, 0.08, 'sine', 0.03); }
export function playSelect(): void { beep(600, 0.1, 'sine', 0.04); }
export function playSwap(): void { beep(440, 0.15, 'triangle', 0.04); }
export function playCorrect(): void { beep(523.25, 0.2, 'sine', 0.06); setTimeout(() => beep(659.25, 0.2, 'sine', 0.05), 80); setTimeout(() => beep(783.99, 0.25, 'sine', 0.04), 160); }
export function playCombo(): void { beep(880, 0.15, 'sine', 0.06); setTimeout(() => beep(1100, 0.15, 'sine', 0.05), 60); setTimeout(() => beep(1320, 0.2, 'sine', 0.04), 120); }
export function playUndo(): void { beep(400, 0.15, 'sine', 0.04); setTimeout(() => beep(350, 0.15, 'sine', 0.03), 80); }
export function playHint(): void { beep(880, 0.25, 'sine', 0.05); setTimeout(() => beep(1100, 0.2, 'sine', 0.04), 100); }
export function playAutoSolve(): void { beep(600, 0.12, 'sine', 0.04); }
export function playWin(): void { [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => setTimeout(() => beep(f, 0.5, 'sine', 0.05), i * 100)); }
export function playTimeWarning(): void { beep(800, 0.12, 'sine', 0.06); setTimeout(() => beep(800, 0.12, 'sine', 0.06), 200); }
export function playAchievement(): void { [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => setTimeout(() => beep(f, 0.3, 'sine', 0.05), i * 80)); }
export function setMasterVolume(v: number): void { /* placeholder */ }
export function getMasterVolume(): number { return 1; }
