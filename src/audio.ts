let audioCtx: AudioContext | null = null;
let masterVolume = 1.0;
let audioEnabled = true;

function getCtx(): AudioContext { 
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported');
      return null as any;
    }
  }
  return audioCtx; 
}

export function setAudioEnabled(enabled: boolean): void {
  audioEnabled = enabled;
}

export function isAudioEnabled(): boolean {
  return audioEnabled;
}

export function setMasterVolume(v: number): void { 
  masterVolume = Math.max(0, Math.min(1, v)); 
}

export function getMasterVolume(): number { 
  return masterVolume; 
}

function createSmoothTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.05, attack: number = 0.02, release: number = 0.1): void {
  if (!audioEnabled) return;
  
  try {
    const ctx = getCtx();
    if (!ctx) return;
    
    // Resume audio context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
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
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

export function beep(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.06): void {
  createSmoothTone(frequency, duration, type, volume);
}

export function playClick(): void { 
  // صدای کلیک نرم و لذت‌بخش
  createSmoothTone(600, 0.1, 'sine', 0.04, 0.02, 0.06); 
  setTimeout(() => createSmoothTone(800, 0.08, 'sine', 0.03, 0.01, 0.05), 50);
}

export function playPlacement(): void {
  // صدای قرار دادن تکه در جای درست - بسیار رضایت‌بخش
  createSmoothTone(440, 0.15, 'sine', 0.05, 0.02, 0.08);
  setTimeout(() => createSmoothTone(554.37, 0.15, 'sine', 0.04, 0.02, 0.08), 60);
  setTimeout(() => createSmoothTone(659.25, 0.2, 'sine', 0.03, 0.02, 0.1), 120);
}
export function playSelect(): void { createSmoothTone(600, 0.1, 'sine', 0.04, 0.02, 0.06); }
export function playSwap(): void { createSmoothTone(440, 0.15, 'triangle', 0.04, 0.02, 0.08); }
export function playCorrect(): void {
  // خوش‌آهنگ‌تر و لذت‌بخش‌تر - مثل Duolingo
  createSmoothTone(523.25, 0.3, 'sine', 0.07, 0.03, 0.15);
  setTimeout(() => createSmoothTone(659.25, 0.3, 'sine', 0.06, 0.03, 0.15), 100);
  setTimeout(() => createSmoothTone(783.99, 0.4, 'sine', 0.05, 0.03, 0.2), 200);
  setTimeout(() => createSmoothTone(1046.50, 0.5, 'sine', 0.04, 0.05, 0.25), 300);
}
export function playCombo(): void {
  // صدای combo هیجان‌انگیز
  createSmoothTone(880, 0.2, 'sine', 0.07, 0.02, 0.1);
  setTimeout(() => createSmoothTone(1100, 0.2, 'sine', 0.06, 0.02, 0.1), 80);
  setTimeout(() => createSmoothTone(1320, 0.25, 'sine', 0.05, 0.02, 0.12), 160);
  setTimeout(() => createSmoothTone(1760, 0.3, 'sine', 0.04, 0.03, 0.15), 240);
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
  // جشن پیروزی - مثل Candy Crush
  const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  melody.forEach((f, i) => {
    setTimeout(() => createSmoothTone(f, 0.6, 'sine', 0.06, 0.04, 0.3), i * 120);
  });
  // آکورد نهایی
  setTimeout(() => {
    createSmoothTone(1046.50, 1.0, 'sine', 0.05, 0.1, 0.5);
    createSmoothTone(1318.51, 1.0, 'sine', 0.04, 0.1, 0.5);
    createSmoothTone(1567.98, 1.0, 'sine', 0.03, 0.1, 0.5);
  }, 700);
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

// New: Combo sounds
export function playComboLevel(level: number): void {
  const baseFreq = 440;
  const multiplier = 1 + (level * 0.1);
  createSmoothTone(baseFreq * multiplier, 0.2, 'sine', 0.06, 0.01, 0.1);
  setTimeout(() => createSmoothTone(baseFreq * multiplier * 1.25, 0.2, 'sine', 0.05, 0.01, 0.1), 80);
  if (level >= 5) {
    setTimeout(() => createSmoothTone(baseFreq * multiplier * 1.5, 0.25, 'sine', 0.04, 0.01, 0.12), 160);
  }
}

// New: Streak sounds
export function playStreakBreak(): void {
  createSmoothTone(300, 0.15, 'sawtooth', 0.04, 0.01, 0.08);
  setTimeout(() => createSmoothTone(250, 0.15, 'sawtooth', 0.03, 0.01, 0.08), 100);
}

export function playStreakContinue(): void {
  createSmoothTone(600, 0.1, 'sine', 0.05, 0.01, 0.05);
  setTimeout(() => createSmoothTone(700, 0.1, 'sine', 0.04, 0.01, 0.05), 60);
}

// New: Level up sound
export function playLevelUp(): void {
  [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
    setTimeout(() => createSmoothTone(f, 0.4, 'sine', 0.06, 0.03, 0.2), i * 120);
  });
  setTimeout(() => {
    createSmoothTone(1318.51, 0.6, 'sine', 0.05, 0.05, 0.3);
  }, 500);
}

// New: Power-up use sound
export function playPowerUp(): void {
  [400, 500, 600, 700, 800].forEach((f, i) => {
    setTimeout(() => createSmoothTone(f, 0.15, 'sine', 0.04, 0.01, 0.08), i * 50);
  });
}

// New: Error/invalid action sound
export function playError(): void {
  createSmoothTone(200, 0.2, 'square', 0.04, 0.01, 0.1);
  setTimeout(() => createSmoothTone(180, 0.2, 'square', 0.03, 0.01, 0.1), 100);
}

// New: Ambient background sound (optional)
export function playAmbient(): void {
  const notes = [261.63, 329.63, 392.00]; // C4, E4, G4 - C major chord
  notes.forEach((freq, i) => {
    setTimeout(() => {
      createSmoothTone(freq, 2.0, 'sine', 0.02, 0.5, 1.0);
    }, i * 100);
  });
}
