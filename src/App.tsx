import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============= CONSTANTS =============
const VERSION = '14.0';
const PUZZLES = [
  { id: 1, name: 'غروب کوهستان', url: 'https://image.qwenlm.ai/generated-images/e5ed2e87-e4c3-49f6-9598-383bbffa5bfb/_result.png', emoji: '🌅', diff: 'آسان' },
  { id: 2, name: 'بالن‌های رنگی', url: 'https://image.qwenlm.ai/generated-images/3021411d-95e8-4d37-9642-09b8142de79a/_result.png', emoji: '🎈', diff: 'متوسط' },
  { id: 3, name: 'ساحل استوایی', url: 'https://image.qwenlm.ai/generated-images/e4e792cd-e717-4752-a71b-8c2633ba017a/_result.png', emoji: '🏖️', diff: 'آسان' },
  { id: 4, name: 'گربه بامزه', url: 'https://image.qwenlm.ai/generated-images/bf4a9cb1-c10b-4ebb-bdfd-721af8fd4f8e/_result.png', emoji: '🐱', diff: 'آسان' },
  { id: 5, name: 'جنگل جادویی', url: 'https://image.qwenlm.ai/generated-images/8bed5ecc-233d-4761-b29c-5bcbd34590bb/_result.png', emoji: '🌲', diff: 'متوسط' },
  { id: 6, name: 'سحابی فضایی', url: 'https://image.qwenlm.ai/generated-images/f7f668c8-d479-408e-a2ea-97d8e122e4b9/_result.png', emoji: '🌌', diff: 'سخت' },
  { id: 7, name: 'جنگل پاییزی', url: 'https://image.qwenlm.ai/generated-images/b09c52e3-0905-4fb4-85ce-a22a638be308/_result.png', emoji: '🍂', diff: 'متوسط' },
  { id: 8, name: 'توله سگ', url: 'https://image.qwenlm.ai/generated-images/3cddce2f-c8ea-44f1-ad27-2b04e9995d38/_result.png', emoji: '🐶', diff: 'آسان' },
  { id: 9, name: 'صخره مرجانی', url: 'https://image.qwenlm.ai/generated-images/05c5e50c-3e80-4d38-ac07-e1a425b26aaf/_result.png', emoji: '🐠', diff: 'سخت' },
  { id: 10, name: 'شکوفه گیلاس', url: 'https://image.qwenlm.ai/generated-images/4590dfd5-6be4-4026-b8be-0213e712d761/_result.png', emoji: '🌸', diff: 'متوسط' }
];
const DIFFS: Record<string, { cols: number; rows: number; total: number; label: string; emoji: string }> = {
  easy: { cols: 6, rows: 5, total: 30, label: 'آسان', emoji: '🌱' },
  medium: { cols: 10, rows: 7, total: 70, label: 'متوسط', emoji: '🌟' },
  hard: { cols: 12, rows: 10, total: 120, label: 'سخت', emoji: '🔥' }
};
const MODES: Record<string, { label: string; emoji: string }> = {
  classic: { label: 'کلاسیک', emoji: '🎮' },
  timeAttack: { label: 'حمله زمانی', emoji: '⚡' },
  zen: { label: 'ذن', emoji: '🧘' }
};
const ACHIEVEMENTS = [
  { id: 'first_win', title: 'اولین پیروزی', desc: 'اولین پازل رو کامل کن', emoji: '🎉' },
  { id: 'speed_demon', title: 'شیطان سرعت', desc: 'زیر 2 دقیقه حل کن', emoji: '⚡' },
  { id: 'perfectionist', title: 'کمال‌گرا', desc: 'کمتر از 50 حرکت', emoji: '✨' },
  { id: 'streak_master', title: 'استاد Streak', desc: 'Streak 10', emoji: '🔥' },
  { id: 'puzzle_master', title: 'استاد پازل', desc: '10 پازل کامل کن', emoji: '🏆' },
  { id: 'combo_king', title: 'پادشاه Combo', desc: 'Combo 5', emoji: '💎' },
  { id: 'marathon', title: 'ماراتن', desc: '50 حرکت در یک بازی', emoji: '🏃' },
];
const THEMES = [
  { id: 'cosmic', name: 'کهکشانی', emoji: '🌌', bg: 'from-indigo-900 via-purple-900 to-pink-900', lvl: 1 },
  { id: 'ocean', name: 'اقیانوس', emoji: '🌊', bg: 'from-blue-900 via-cyan-900 to-teal-900', lvl: 3 },
  { id: 'forest', name: 'جنگل', emoji: '🌲', bg: 'from-green-900 via-emerald-900 to-teal-900', lvl: 5 },
  { id: 'sunset', name: 'غروب', emoji: '🌅', bg: 'from-orange-900 via-red-900 to-pink-900', lvl: 7 },
];
const POWERUPS = [
  { id: 'hint', name: 'راهنمایی', emoji: '💡', desc: 'یک تکه را نشان بده', cost: 50 },
  { id: 'auto', name: 'خودکار', emoji: '✨', desc: 'یک تکه خودکار قرار بده', cost: 100 },
  { id: 'reveal', name: 'آشکارسازی', emoji: '👁️', desc: '3 تکه درست را نشان بده', cost: 75 },
  { id: 'undo', name: 'برگشت کامل', emoji: '↩️', desc: 'تمام حرکات را برگردان', cost: 150 },
];

// ============= TYPES =============
interface Shape { top: number; right: number; bottom: number; left: number }
interface Piece { id: number; cr: number; cc: number; r: number; c: number }
interface Edges { h: number[][]; v: number[][] }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
interface Stats { games: number; moves: number; streak: number; correct: number; combo: number; achs: string[]; xp: number; time: number; eff: number }
interface Rec { time: number; moves: number; date: string }
interface LB { name: string; score: number; date: string; puzzle: string }

// ============= UTILS =============
const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const genEdges = (cols: number, rows: number): Edges => {
  const h: number[][] = [], v: number[][] = [];
  for (let r = 0; r < rows; r++) { h[r] = []; for (let c = 0; c < cols - 1; c++) h[r][c] = Math.random() > 0.5 ? 1 : -1; }
  for (let r = 0; r < rows - 1; r++) { v[r] = []; for (let c = 0; c < cols; c++) v[r][c] = Math.random() > 0.5 ? 1 : -1; }
  return { h, v };
};
const getShape = (r: number, c: number, e: Edges, cols: number, rows: number): Shape => ({
  top: r === 0 ? 0 : -e.v[r - 1][c], right: c === cols - 1 ? 0 : e.h[r][c],
  bottom: r === rows - 1 ? 0 : e.v[r][c], left: c === 0 ? 0 : -e.h[r][c - 1]
});
const genPath = (pw: number, ph: number, s: Shape): string => {
  const tw = pw * 0.2, th = ph * 0.2;
  let p = `M 0,0 `;
  if (s.top === 0) p += `L ${pw},0 `;
  else { const m = pw / 2, d = s.top; p += `L ${m - tw * 1.2},0 C ${m - tw * 1.2},${-d * th * 0.1} ${m - tw * 0.8},${-d * th * 0.3} ${m - tw * 0.6},${-d * th * 0.5} C ${m - tw * 0.9},${-d * th * 0.8} ${m - tw * 0.5},${-d * th * 1.1} ${m},${-d * th * 1.1} C ${m + tw * 0.5},${-d * th * 1.1} ${m + tw * 0.9},${-d * th * 0.8} ${m + tw * 0.6},${-d * th * 0.5} C ${m + tw * 0.8},${-d * th * 0.3} ${m + tw * 1.2},${-d * th * 0.1} ${m + tw * 1.2},0 L ${pw},0 `; }
  if (s.right === 0) p += `L ${pw},${ph} `;
  else { const m = ph / 2, d = s.right; p += `L ${pw},${m - th * 1.2} C ${pw + d * tw * 0.1},${m - th * 1.2} ${pw + d * tw * 0.3},${m - th * 0.8} ${pw + d * tw * 0.5},${m - th * 0.6} C ${pw + d * tw * 0.8},${m - th * 0.9} ${pw + d * tw * 1.1},${m - th * 0.5} ${pw + d * tw * 1.1},${m} C ${pw + d * tw * 1.1},${m + th * 0.5} ${pw + d * tw * 0.8},${m + th * 0.9} ${pw + d * tw * 0.5},${m + th * 0.6} C ${pw + d * tw * 0.3},${m + th * 0.8} ${pw + d * tw * 0.1},${m + th * 1.2} ${pw},${m + th * 1.2} L ${pw},${ph} `; }
  if (s.bottom === 0) p += `L 0,${ph} `;
  else { const m = pw / 2, d = s.bottom; p += `L ${m + tw * 1.2},${ph} C ${m + tw * 1.2},${ph + d * th * 0.1} ${m + tw * 0.8},${ph + d * th * 0.3} ${m + tw * 0.6},${ph + d * th * 0.5} C ${m + tw * 0.9},${ph + d * th * 0.8} ${m + tw * 0.5},${ph + d * th * 1.1} ${m},${ph + d * th * 1.1} C ${m - tw * 0.5},${ph + d * th * 1.1} ${m - tw * 0.9},${ph + d * th * 0.8} ${m - tw * 0.6},${ph + d * th * 0.5} C ${m - tw * 0.8},${ph + d * th * 0.3} ${m - tw * 1.2},${ph + d * th * 0.1} ${m - tw * 1.2},${ph} L 0,${ph} `; }
  if (s.left === 0) p += `L 0,0 `;
  else { const m = ph / 2, d = s.left; p += `L 0,${m + th * 1.2} C ${-d * tw * 0.1},${m + th * 1.2} ${-d * tw * 0.3},${m + th * 0.8} ${-d * tw * 0.5},${m + th * 0.6} C ${-d * tw * 0.8},${m + th * 0.9} ${-d * tw * 1.1},${m + th * 0.5} ${-d * tw * 1.1},${m} C ${-d * tw * 1.1},${m - th * 0.5} ${-d * tw * 0.8},${m - th * 0.9} ${-d * tw * 0.5},${m - th * 0.6} C ${-d * tw * 0.3},${m - th * 0.8} ${-d * tw * 0.1},${m - th * 1.2} 0,${m - th * 1.2} L 0,0 `; }
  return p + 'Z';
};
const mkPieces = (cols: number, rows: number): Piece[] => {
  const t = cols * rows, pos = shuffle(Array.from({ length: t }, (_, i) => ({ r: Math.floor(i / cols), c: i % cols })));
  return Array.from({ length: t }, (_, i) => ({ id: i, cr: Math.floor(i / cols), cc: i % cols, r: pos[i].r, c: pos[i].c }));
};
const swap = (ps: Piece[], a: number, b: number): Piece[] => {
  const n = ps.map(p => ({ ...p })), p1 = n.find(p => p.id === a)!, p2 = n.find(p => p.id === b)!;
  [p1.r, p2.r] = [p2.r, p1.r]; [p1.c, p2.c] = [p2.c, p1.c]; return n;
};
const isOk = (p: Piece) => p.r === p.cr && p.c === p.cc;
const isDone = (ps: Piece[]) => ps.every(isOk);
const cntOk = (ps: Piece[]) => ps.filter(isOk).length;
const prog = (ps: Piece[]) => Math.round((cntOk(ps) / ps.length) * 100);

// ============= AUDIO =============
let actx: AudioContext | null = null;
const gctx = () => { if (!actx) actx = new (window.AudioContext || (window as any).webkitAudioContext)(); return actx; };
const beep = (f: number, d: number, t: OscillatorType = 'sine', v = 0.06) => { try { const c = gctx(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = t; o.frequency.value = f; g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d); o.start(); o.stop(c.currentTime + d); } catch {} };
const sndClick = () => beep(800, 0.08, 'sine', 0.03);
const sndSel = () => beep(600, 0.1, 'sine', 0.04);
const sndSwap = () => beep(440, 0.15, 'triangle', 0.04);
const sndOk = () => { beep(523, 0.2, 'sine', 0.06); setTimeout(() => beep(659, 0.2, 'sine', 0.05), 80); setTimeout(() => beep(784, 0.25, 'sine', 0.04), 160); };
const sndCombo = () => { beep(880, 0.15, 'sine', 0.06); setTimeout(() => beep(1100, 0.15, 'sine', 0.05), 60); };
const sndUndo = () => beep(400, 0.15, 'sine', 0.04);
const sndHint = () => beep(880, 0.25, 'sine', 0.05);
const sndWin = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.5, 'sine', 0.05), i * 100));
const sndWarn = () => { beep(800, 0.12, 'sine', 0.06); setTimeout(() => beep(800, 0.12, 'sine', 0.06), 200); };
const sndAch = () => [523, 659, 784, 1047, 1318].forEach((f, i) => setTimeout(() => beep(f, 0.3, 'sine', 0.05), i * 80));

// ============= STORAGE =============
const getStats = (): Stats => { try { const d = localStorage.getItem('pzStats'); if (d) return JSON.parse(d); } catch {} return { games: 0, moves: 0, streak: 0, correct: 0, combo: 0, achs: [], xp: 0, time: 0, eff: 0 }; };
const saveStats = (s: Stats) => { try { localStorage.setItem('pzStats', JSON.stringify(s)); } catch {} };
const getRec = (n: string): Rec | null => { try { const d = localStorage.getItem('pzRec'); if (d) { const r = JSON.parse(d); return r[n] || null; } } catch {} return null; };
const saveRec = (n: string, t: number, m: number): boolean => { try { const r: Record<string, Rec> = JSON.parse(localStorage.getItem('pzRec') || '{}'); const e = r[n]; const nw = !e || t < e.time || (t === e.time && m < e.moves); if (nw) { r[n] = { time: t, moves: m, date: new Date().toISOString() }; localStorage.setItem('pzRec', JSON.stringify(r)); return true; } return false; } catch { return false; } };
const getLB = (): LB[] => { try { const d = localStorage.getItem('pzLB'); if (d) return JSON.parse(d); } catch {} return []; };
const saveLB = (e: LB) => { try { const lb = getLB(); lb.push(e); lb.sort((a, b) => b.score - a.score); localStorage.setItem('pzLB', JSON.stringify(lb.slice(0, 10))); } catch {} };
const calcXP = (m: number, t: number, s: number, c: number) => { let x = 100; if (m < 50) x += 200; else if (m < 100) x += 100; if (t < 60) x += 300; else if (t < 120) x += 200; x += s * 10 + c * 15; return x; };
const calcLvl = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;
const calcProg = (xp: number) => { const l = calcLvl(xp), c = (l - 1) ** 2 * 100, n = l ** 2 * 100; return Math.round(((xp - c) / (n - c)) * 100); };
const theme = () => { try { return localStorage.getItem('pzTheme') || 'cosmic'; } catch { return 'cosmic'; } };
const setTheme = (id: string) => { try { localStorage.setItem('pzTheme', id); } catch {} };
const tutSeen = () => { try { return localStorage.getItem('pzTut') === '1'; } catch { return false; } };
const seeTut = () => { try { localStorage.setItem('pzTut', '1'); } catch {} };
const dailyDone = () => { try { const d = localStorage.getItem('pzDaily'); if (!d) return false; const { date, done } = JSON.parse(d); return date === new Date().toISOString().split('T')[0] && done; } catch { return false; } };
const doDaily = () => { try { localStorage.setItem('pzDaily', JSON.stringify({ date: new Date().toISOString().split('T')[0], done: true })); } catch {} };
const dailyChal = () => { const t = new Date(), s = t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate(); return { date: t.toISOString().split('T')[0], pid: (s % 10) + 1, diff: ['easy', 'medium', 'hard'][s % 3] }; };
const loginStrk = () => { try { const d = localStorage.getItem('pzLogin'); if (!d) return 0; const { last, s } = JSON.parse(d); const t = new Date().toDateString(), y = new Date(Date.now() - 864e5).toDateString(); if (last === t || last === y) return s; return 0; } catch { return 0; } };
const claimDaily = (): { ok: boolean; rwd: number } => { try { const t = new Date().toDateString(), d = localStorage.getItem('pzLogin'); let s = 0, l = ''; if (d) { const p = JSON.parse(d); s = p.s || 0; l = p.last || ''; } if (l === t) return { ok: false, rwd: 0 }; const y = new Date(Date.now() - 864e5).toDateString(); s = l === y ? s + 1 : 1; const rwds = [50, 75, 100, 150, 200, 250, 500]; const rwd = rwds[(s - 1) % 7]; localStorage.setItem('pzLogin', JSON.stringify({ s, last: t })); return { ok: true, rwd }; } catch { return { ok: false, rwd: 0 }; } };
const achUnlk = (id: string) => { try { const s = getStats(); if (!s.achs.includes(id)) { s.achs.push(id); saveStats(s); return true; } return false; } catch { return false; } };
const achHas = (id: string) => getStats().achs.includes(id);
const checkAch = (g: number, t: number, m: number, bs: number, mc: number): string[] => {
  const n: string[] = [];
  if (g >= 1 && !achHas('first_win') && achUnlk('first_win')) n.push('first_win');
  if (t < 120 && !achHas('speed_demon') && achUnlk('speed_demon')) n.push('speed_demon');
  if (m < 50 && !achHas('perfectionist') && achUnlk('perfectionist')) n.push('perfectionist');
  if (bs >= 10 && !achHas('streak_master') && achUnlk('streak_master')) n.push('streak_master');
  if (g >= 10 && !achHas('puzzle_master') && achUnlk('puzzle_master')) n.push('puzzle_master');
  if (mc >= 5 && !achHas('combo_king') && achUnlk('combo_king')) n.push('combo_king');
  if (m >= 50 && !achHas('marathon') && achUnlk('marathon')) n.push('marathon');
  return n;
};

// ============= MAIN APP =============
type Scr = 'menu' | 'game' | 'stats' | 'achs' | 'tut' | 'daily' | 'pu' | 'themes' | 'set' | 'lb';
export default function App() {
  const [scr, setScr] = useState<Scr>('menu');
  const [url, setUrl] = useState('');
  const [nm, setNm] = useState('');
  const [diff, setDiff] = useState<keyof typeof DIFFS>('medium');
  const [mode, setMode] = useState<keyof typeof MODES>('classic');
  const [dRwd, setDRwd] = useState<{ show: boolean; amt: number }>({ show: false, amt: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = loginStrk(), rwds = [50, 75, 100, 150, 200, 250, 500];
    const last = localStorage.getItem('pzLastDaily'), today = new Date().toDateString();
    if (last !== today) setDRwd({ show: true, amt: rwds[s % 7] });
  }, []);

  const claimRwd = () => {
    const r = claimDaily();
    if (r.ok) { const s = getStats(); saveStats({ ...s, xp: (s.xp || 0) + r.rwd }); localStorage.setItem('pzLastDaily', new Date().toDateString()); }
    setDRwd({ show: false, amt: 0 });
  };

  if (scr === 'game') return <Game url={url} nm={nm} diff={diff} mode={mode} onBack={() => setScr('menu')} />;
  if (scr === 'stats') return <StatsScr onBack={() => setScr('menu')} />;
  if (scr === 'achs') return <AchsScr onBack={() => setScr('menu')} />;
  if (scr === 'tut') return <TutScr onBack={() => setScr('menu')} />;
  if (scr === 'daily') return <DailyScr onBack={() => setScr('menu')} onStart={(u, n, d) => { setUrl(u); setNm(n); setDiff(d as any); setScr('game'); }} />;
  if (scr === 'pu') return <PUScr onBack={() => setScr('menu')} />;
  if (scr === 'themes') return <ThScr onBack={() => setScr('menu')} />;
  if (scr === 'set') return <SetScr onBack={() => setScr('menu')} />;
  if (scr === 'lb') return <LBScr onBack={() => setScr('menu')} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {dRwd.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl p-8 max-w-md w-full text-center border-2 border-yellow-400/50 shadow-2xl">
            <div className="text-8xl mb-4">🎁</div>
            <h2 className="text-3xl font-black text-white mb-2">پاداش روزانه!</h2>
            <p className="text-yellow-200 text-lg mb-6">روز {loginStrk() + 1} ورود متوالی</p>
            <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-yellow-400/30">
              <div className="text-5xl font-black text-yellow-300 mb-2">+{dRwd.amt}</div>
              <div className="text-yellow-200">XP</div>
            </div>
            <button onClick={claimRwd} className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold">دریافت پاداش</button>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="text-7xl mb-4">🧩</div>
        <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 mb-3">Puzzle Master</h1>
        <p className="text-xl text-purple-200 mb-8">پازل جیگساو حرفه‌ای</p>

        <div className="mb-8">
          <h3 className="text-white font-bold mb-3">سطح دشواری</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(DIFFS).map(([k, v]) => (
              <button key={k} onClick={() => setDiff(k as any)} className={`px-6 py-3 rounded-xl font-bold ${diff === k ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <span className="text-2xl mr-2">{v.emoji}</span>{v.label}<span className="block text-xs mt-1 opacity-70">{v.total} تکه</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-white font-bold mb-3">حالت بازی</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(MODES).map(([k, v]) => (
              <button key={k} onClick={() => setMode(k as any)} className={`px-6 py-3 rounded-xl font-bold ${mode === k ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <span className="text-2xl mr-2">{v.emoji}</span>{v.label}
              </button>
            ))}
          </div>
        </div>

        <div onClick={() => fileRef.current?.click()} className="max-w-lg mx-auto cursor-pointer group mb-8">
          <div className="bg-white/5 border-2 border-dashed border-white/30 hover:border-yellow-400 rounded-3xl p-8 group-hover:bg-white/10 group-hover:scale-105">
            <div className="text-5xl mb-4">📸</div>
            <h3 className="text-xl font-bold text-white mb-2">عکس خودت رو آپلود کن</h3>
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white font-bold">انتخاب فایل ↑</div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
          const f = e.target.files?.[0];
          if (f) { setUrl(URL.createObjectURL(f)); setNm(f.name); setScr('game'); }
        }} />

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-white/30"></div>
          <span className="text-white/60 text-sm">یا از پازل‌های آماده</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-white/30"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {PUZZLES.map(p => {
            const r = getRec(p.name);
            return (
              <div key={p.id} onClick={() => { setUrl(p.url); setNm(p.name); setScr('game'); }} className="cursor-pointer group rounded-2xl overflow-hidden hover:scale-105 hover:shadow-2xl">
                <div className="aspect-[4/3] relative">
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2"><span className="text-xl">{p.emoji}</span><span className="text-white font-bold text-sm">{p.name}</span></div>
                    {r && <span className="text-xs text-green-300 bg-green-500/20 px-1.5 py-0.5 rounded-full mt-1 inline-block">🏆 {fmt(r.time)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 max-w-4xl mx-auto">
          <button onClick={() => setScr('daily')} className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-bold"><div className="text-2xl mb-1">🎯</div><div className="text-sm">چالش روزانه</div></button>
          <button onClick={() => setScr('lb')} className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold"><div className="text-2xl mb-1">🏆</div><div className="text-sm">جدول امتیازات</div></button>
          <button onClick={() => setScr('pu')} className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-bold"><div className="text-2xl mb-1">✨</div><div className="text-sm">Power-ups</div></button>
          <button onClick={() => setScr('themes')} className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-bold"><div className="text-2xl mb-1">🎨</div><div className="text-sm">تم‌ها</div></button>
          <button onClick={() => setScr('stats')} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold"><div className="text-2xl mb-1">📊</div><div className="text-sm">آمار</div></button>
          <button onClick={() => setScr('achs')} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold"><div className="text-2xl mb-1">🏅</div><div className="text-sm">Achievements</div></button>
          <button onClick={() => setScr('tut')} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold"><div className="text-2xl mb-1">📖</div><div className="text-sm">آموزش</div></button>
          <button onClick={() => setScr('set')} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold"><div className="text-2xl mb-1">⚙️</div><div className="text-sm">تنظیمات</div></button>
        </div>

        <div className="text-purple-400/60 text-sm">ساخته شده با ❤️ | v{VERSION}</div>
      </div>
    </div>
  );
}

// ============= GAME =============
function Game({ url, nm, diff, mode, onBack }: { url: string; nm: string; diff: keyof typeof DIFFS; mode: keyof typeof MODES; onBack: () => void }) {
  const cfg = DIFFS[diff];
  const [pcs, setPcs] = useState<Piece[]>([]);
  const [eds, setEds] = useState<Edges | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [mv, setMv] = useState(0);
  const [tm, setTm] = useState(mode === 'timeAttack' ? 60 : 0);
  const [dn, setDn] = useState(false);
  const [pv, setPv] = useState(false);
  const [ht, setHt] = useState<number | null>(null);
  const [cf, setCf] = useState(false);
  const [snd, setSnd] = useState(true);
  const [thumb, setThumb] = useState(true);
  const [hist, setHist] = useState<Piece[][]>([]);
  const [redo, setRedo] = useState<Piece[][]>([]);
  const [stk, setStk] = useState(0);
  const [bstk, setBstk] = useState(0);
  const [cmb, setCmb] = useState(0);
  const [mcmb, setMcmb] = useState(0);
  const [lpId, setLpId] = useState<number | null>(null);
  const [dp, setDp] = useState<number | null>(null);
  const [dpos, setDpos] = useState<{ x: number; y: number } | null>(null);
  const [hp, setHp] = useState<number | null>(null);
  const [pts, setPts] = useState<Particle[]>([]);
  const [grid, setGrid] = useState(true);
  const [tst, setTst] = useState<string | null>(null);
  const [ld, setLd] = useState(true);
  const [paused, setPaused] = useState(false);
  const cref = useRef<HTMLDivElement>(null);
  const sref = useRef<SVGSVGElement>(null);
  const tref = useRef<any>(null);
  const [cw, setCw] = useState(800);
  const drag = useRef(false);
  const dstart = useRef<{ x: number; y: number } | null>(null);
  const dpId = useRef<number | null>(null);

  useEffect(() => {
    const i = new Image();
    if (url.startsWith('blob:')) { i.onload = () => { setImg(i); setLd(false); }; i.src = url; }
    else { i.crossOrigin = 'anonymous'; i.onload = () => { setImg(i); setLd(false); }; i.onerror = () => { const i2 = new Image(); i2.onload = () => { setImg(i2); setLd(false); }; i2.src = url; }; i.src = url; }
  }, [url]);

  useEffect(() => {
    if (img) { setEds(genEdges(cfg.cols, cfg.rows)); setPcs(mkPieces(cfg.cols, cfg.rows)); setTm(mode === 'timeAttack' ? 60 : 0); setMv(0); setSel(null); setDn(false); setHist([]); setRedo([]); setStk(0); setBstk(0); setCmb(0); setMcmb(0); }
  }, [img, cfg.cols, cfg.rows, mode]);

  useEffect(() => { const r = () => { if (cref.current) setCw(Math.min(cref.current.clientWidth - 20, 850)); }; r(); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);

  useEffect(() => {
    if (!dn && !paused && mode !== 'zen') {
      if (mode === 'timeAttack') tref.current = setInterval(() => setTm(t => { if (t <= 11 && t > 0 && snd) sndWarn(); if (t <= 1) { setDn(true); return 0; } return t - 1; }), 1000);
      else tref.current = setInterval(() => setTm(t => t + 1), 1000);
    }
    return () => clearInterval(tref.current);
  }, [dn, paused, mode, snd]);

  useEffect(() => {
    if (pcs.length > 0 && isDone(pcs)) {
      setDn(true); setCf(true); if (snd) sndWin();
      const ft = mode === 'timeAttack' ? 60 - tm : tm;
      const nr = saveRec(nm, ft, mv);
      const s = getStats(), xp = calcXP(mv, ft, bstk, mcmb), eff = Math.min(100, Math.round((pcs.length / mv) * 100));
      saveStats({ ...s, games: s.games + 1, moves: s.moves + mv, streak: Math.max(s.streak, bstk), combo: Math.max(s.combo, mcmb), correct: s.correct + pcs.length, xp: (s.xp || 0) + xp, time: (s.time || 0) + ft, eff: Math.max(s.eff || 0, eff) });
      const score = Math.round((10000 / Math.max(1, ft)) * (100 / Math.max(1, mv)));
      saveLB({ name: 'Player', score, date: new Date().toISOString(), puzzle: nm });
      const na = checkAch(s.games + 1, ft, mv, bstk, mcmb);
      if (na.length > 0) { if (snd) sndAch(); setTst(`🏆 ${na.length} Achievement جدید!`); setTimeout(() => setTst(null), 2500); }
      if (nr) { setTst('🎉 رکورد جدید!'); setTimeout(() => setTst(null), 2500); }
      setTimeout(() => setCf(false), 8000);
    }
  }, [pcs, snd, nm, tm, mv, bstk, mcmb, mode, diff]);

  useEffect(() => { if (pts.length === 0) return; const id = setInterval(() => setPts(p => p.map(x => ({ ...x, x: x.x + x.vx, y: x.y + x.vy, vy: x.vy + 0.3, life: x.life - 1 })).filter(x => x.life > 0)), 16); return () => clearInterval(id); }, [pts.length]);

  const dims = useMemo(() => { if (!img) return null; const ia = img.width / img.height, pw = cw / (cfg.cols + 0.5), ph = pw / ia, ext = pw * 0.22; return { pw, ph, ext, sw: cfg.cols * pw + ext * 2, sh: cfg.rows * ph + ext * 2 }; }, [img, cw, cfg.cols, cfg.rows]);

  const spawn = useCallback((x: number, y: number, n = 20) => {
    const np: Particle[] = [];
    for (let i = 0; i < n; i++) np.push({ id: Date.now() + i + Math.random(), x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 - 4, life: 40 + Math.random() * 20, color: ['#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#a78bfa'][Math.floor(Math.random() * 5)], size: 2 + Math.random() * 5 });
    setPts(p => [...p, ...np]);
  }, []);

  const doSwap = useCallback((a: number, b: number) => {
    setHist(h => [...h.slice(-15), pcs.map(x => ({ ...x }))]); setRedo([]);
    const np = swap(pcs, a, b); setPcs(np); setMv(m => m + 1);
    const p1 = np.find(p => p.id === a)!, p2 = np.find(p => p.id === b)!, o1 = isOk(p1), o2 = isOk(p2);
    if (o1 || o2) {
      setStk(s => { const ns = s + 1; setBstk(b => Math.max(b, ns)); return ns; });
      setCmb(c => { const nc = c + 1; setMcmb(m => Math.max(m, nc)); if (nc >= 3 && snd) sndCombo(); return nc; });
      if (snd && cmb < 3) sndOk();
      if (o1 && dims) { setLpId(p1.id); spawn(p1.c * dims.pw + dims.ext + dims.pw / 2, p1.r * dims.ph + dims.ext + dims.ph / 2); }
      if (o2 && dims) { setLpId(p2.id); spawn(p2.c * dims.pw + dims.ext + dims.pw / 2, p2.r * dims.ph + dims.ext + dims.ph / 2); }
      setTimeout(() => setLpId(null), 800);
    } else { setStk(0); setCmb(0); if (snd) sndSwap(); }
  }, [pcs, snd, dims, spawn, cmb]);

  const click = useCallback((id: number) => {
    if (dn || drag.current) return;
    if (sel === null) { setSel(id); if (snd) sndClick(); }
    else if (sel === id) setSel(null);
    else { doSwap(sel, id); setSel(null); }
  }, [sel, dn, snd, doSwap]);

  const dStart = (e: React.PointerEvent, id: number) => { if (dn) return; e.preventDefault(); e.stopPropagation(); drag.current = false; dstart.current = { x: e.clientX, y: e.clientY }; dpId.current = id; };
  const dMove = (e: React.PointerEvent) => {
    if (dpId.current === null || !dstart.current || !dims || !sref.current) return;
    const dx = e.clientX - dstart.current.x, dy = e.clientY - dstart.current.y;
    if (!drag.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) { drag.current = true; setDp(dpId.current); if (snd) sndSel(); }
    if (drag.current) {
      const r = sref.current.getBoundingClientRect(), sx = dims.sw / r.width, sy = dims.sh / r.height;
      const x = (e.clientX - r.left) * sx, y = (e.clientY - r.top) * sy;
      setDpos({ x, y });
      const { pw, ph, ext } = dims; let f: number | null = null;
      for (const p of pcs) { const px = p.c * pw + ext, py = p.r * ph + ext; if (x >= px && x <= px + pw && y >= py && y <= py + ph) { f = p.id; break; } }
      setHp(f);
    }
  };
  const dEnd = () => {
    const id = dpId.current;
    if (drag.current && dp !== null && hp !== null && hp !== dp) doSwap(dp, hp);
    else if (!drag.current && id !== null) click(id);
    setDp(null); setDpos(null); setHp(null); drag.current = false; dstart.current = null; dpId.current = null;
  };

  const reset = () => { setEds(genEdges(cfg.cols, cfg.rows)); setPcs(mkPieces(cfg.cols, cfg.rows)); setTm(mode === 'timeAttack' ? 60 : 0); setMv(0); setSel(null); setDn(false); setCf(false); setHist([]); setRedo([]); setStk(0); setBstk(0); setCmb(0); setMcmb(0); };
  const hint = () => { const w = pcs.filter(p => !isOk(p)); if (w.length) { const r = w[Math.floor(Math.random() * w.length)]; setHt(r.id); setTimeout(() => setHt(null), 3000); if (snd) sndHint(); } };
  const undo = () => { if (hist.length > 0) { setRedo(r => [...r, pcs]); setPcs(hist[hist.length - 1]); setHist(h => h.slice(0, -1)); setMv(m => Math.max(0, m - 1)); setStk(0); if (snd) sndUndo(); } };
  const redoAct = () => { if (redo.length > 0) { setHist(h => [...h, pcs]); setPcs(redo[redo.length - 1]); setRedo(r => r.slice(0, -1)); setMv(m => m + 1); } };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (dn) return;
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (e.shiftKey) redoAct(); else undo(); }
      else if ((e.key === 'y' || e.key === 'Y') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redoAct(); }
      else if (e.key === 'h' || e.key === 'H') { if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); hint(); } }
      else if (e.key === 'p' || e.key === 'P') { if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setPv(p => !p); } }
      else if (e.key === 'Escape') { if (pv) setPv(false); else if (sel !== null) setSel(null); }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [dn, undo, redoAct, hint, pv, sel]);

  const ok = cntOk(pcs), pr = prog(pcs), rec = getRec(nm);

  if (!img || !eds || !dims || ld) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="text-center">
        {url && <div className="mb-6 max-w-xs mx-auto"><img src={url} alt="" className="w-full h-auto rounded-xl shadow-2xl border-2 border-white/20 opacity-50" style={{ maxHeight: '200px', objectFit: 'contain' }} /></div>}
        <div className="relative w-16 h-16 mx-auto mb-4"><div className="absolute inset-0 border-4 border-purple-400/30 rounded-full"></div><div className="absolute inset-0 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"></div></div>
        <p className="text-white text-lg font-bold">در حال آماده‌سازی...</p>
        <p className="text-purple-300 text-sm mt-2">{cfg.total} تکه جیگساو 🧩</p>
      </div>
    </div>
  );

  const { pw, ph, ext, sw, sh } = dims;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-2 md:p-4">
      {cf && <Confetti />}
      {tst && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl">{tst}</div>}
      
      {/* PREVIEW - z-index بالا برای اطمینان از نمایش */}
      {pv && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setPv(false)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={url} alt="Preview" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl border-4 border-white/30" />
            <div className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-full text-white font-bold">👁️ پیش‌نمایش تصویر اصلی</div>
            <button onClick={() => setPv(false)} className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full text-white text-2xl font-bold">×</button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white text-sm">برای بستن کلیک کنید</div>
          </div>
        </div>
      )}

      {paused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setPaused(false)}>
          <div className="text-center"><div className="text-8xl mb-4">⏸️</div><h2 className="text-4xl font-black text-white mb-4">توقف موقت</h2><p className="text-purple-200 text-lg mb-6">برای ادامه کلیک کنید</p><button onClick={() => setPaused(false)} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold">▶️ ادامه بازی</button></div>
        </div>
      )}

      <div className="max-w-5xl mx-auto mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/10">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm">→ بازگشت</button>
            <h2 className="text-white font-bold truncate max-w-[120px] md:max-w-none text-sm md:text-base">{nm}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1"><span className="text-yellow-300 text-xs">⏱️</span><span className="text-white font-mono text-xs">{fmt(tm)}</span></div>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1"><span className="text-blue-300 text-xs">🔄</span><span className="text-white font-mono text-xs">{mv}</span></div>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1"><span className="text-green-300 text-xs">✅</span><span className="text-white font-mono text-xs">{ok}/{cfg.total}</span></div>
            {stk >= 2 && <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-lg px-2 py-1 border border-orange-400/30"><span className="text-orange-300 text-xs">🔥</span><span className="text-white font-mono text-xs font-bold">{stk}</span></div>}
            {cmb >= 3 && <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-lg px-2 py-1 border border-purple-400/30"><span className="text-purple-300 text-xs">💎</span><span className="text-white font-mono text-xs font-bold">x{cmb}</span></div>}
            <button onClick={() => setPv(true)} className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs" title="پیش‌نمایش (P)">👁️</button>
            <button onClick={() => setThumb(!thumb)} className={`px-2 py-1 rounded-lg text-white text-xs ${thumb ? 'bg-purple-500' : 'bg-white/10'}`}>🖼️</button>
            <button onClick={() => setGrid(!grid)} className={`px-2 py-1 rounded-lg text-white text-xs ${grid ? 'bg-blue-500/80' : 'bg-white/10'}`}>⊞</button>
            <button onClick={undo} disabled={hist.length === 0} className={`px-2 py-1 rounded-lg text-white text-xs ${hist.length > 0 ? 'bg-blue-500/80 hover:bg-blue-500' : 'bg-white/5 opacity-50'}`} title="برگشت (Ctrl+Z)">↩️</button>
            <button onClick={redoAct} disabled={redo.length === 0} className={`px-2 py-1 rounded-lg text-white text-xs ${redo.length > 0 ? 'bg-purple-500/80 hover:bg-purple-500' : 'bg-white/5 opacity-50'}`} title="بازگشت (Ctrl+Y)">↪️</button>
            <button onClick={hint} className="px-2 py-1 bg-amber-500/80 hover:bg-amber-500 rounded-lg text-white text-xs" title="راهنما (H)">💡</button>
            {mode === 'timeAttack' && <button onClick={() => setPaused(!paused)} className={`px-2 py-1 rounded-lg text-white text-xs ${paused ? 'bg-yellow-500/80' : 'bg-white/10'}`}>{paused ? '▶️' : '⏸️'}</button>}
            <button onClick={() => setSnd(!snd)} className={`px-2 py-1 rounded-lg text-white text-xs ${snd ? 'bg-green-500/80' : 'bg-white/10'}`}>{snd ? '🔊' : '🔇'}</button>
            <button onClick={reset} className="px-2 py-1 bg-red-500/80 hover:bg-red-500 rounded-lg text-white text-xs">🔄</button>
          </div>
        </div>
        <div className="mt-2 bg-black/30 rounded-full p-1 border border-white/10">
          <div className="flex items-center gap-3 px-3">
            <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full relative overflow-hidden" style={{ width: `${pr}%`, background: pr === 100 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b)' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <span className="text-white font-bold text-sm min-w-[2.5rem] text-left">{pr}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex justify-center">
        <div ref={cref} className="w-full relative" style={{ maxWidth: '900px' }}>
          {thumb && <div className="fixed bottom-4 right-4 w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl bg-black/70 backdrop-blur-md hover:scale-110 cursor-pointer z-30" onClick={() => setPv(true)}><img src={url} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div></div>}
          <div className="bg-black/40 rounded-xl border-2 border-white/20 overflow-hidden shadow-2xl p-2">
            <svg ref={sref} width="100%" viewBox={`0 0 ${sw} ${sh}`} style={{ aspectRatio: `${sw}/${sh}`, touchAction: 'none' }} className={dp !== null ? 'cursor-grabbing' : 'cursor-grab'} onPointerMove={dMove} onPointerUp={dEnd} onPointerLeave={dEnd}>
              <defs>
                {pcs.map(p => { const s = getShape(p.cr, p.cc, eds, cfg.cols, cfg.rows); return <clipPath key={`c-${p.id}`} id={`c-${p.id}`}><path d={genPath(pw, ph, s)} /></clipPath>; })}
                <filter id="gy" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b" /><feFlood floodColor="#fbbf24" floodOpacity="0.8" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id="gg" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="b" /><feFlood floodColor="#34d399" floodOpacity="0.7" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.5" /></filter>
              </defs>
              <rect x={ext} y={ext} width={cfg.cols * pw} height={cfg.rows * ph} fill="rgba(0,0,0,0.3)" rx="2" />
              {grid && <g opacity="0.08">{Array.from({ length: cfg.cols + 1 }).map((_, i) => <line key={`v${i}`} x1={ext + i * pw} y1={ext} x2={ext + i * pw} y2={ext + cfg.rows * ph} stroke="white" strokeWidth="0.5" />)}{Array.from({ length: cfg.rows + 1 }).map((_, i) => <line key={`h${i}`} x1={ext} y1={ext + i * ph} x2={ext + cfg.cols * pw} y2={ext + i * ph} stroke="white" strokeWidth="0.5" />)}</g>}
              {pcs.map(p => {
                const s = getShape(p.cr, p.cc, eds, cfg.cols, cfg.rows), x = p.c * pw + ext, y = p.r * ph + ext;
                const isSel = sel === p.id, isHt = ht === p.id, isOkP = isOk(p), isDp = dp === p.id, isHp = hp === p.id && dp !== null && dp !== p.id, isLp = lpId === p.id;
                if (isDp) return null;
                let sc = 'rgba(255,255,255,0.15)', sw2 = 0.8, f = '';
                if (isSel) { sc = '#fbbf24'; sw2 = 2.5; f = 'url(#gy)'; }
                else if (isHt) { sc = '#34d399'; sw2 = 2; f = 'url(#gg)'; }
                else if (isLp) { sc = '#34d399'; sw2 = 2; f = 'url(#gg)'; }
                else if (isOkP && !dn) { sc = 'rgba(52,211,153,0.35)'; sw2 = 1.2; }
                else if (isHp) { sc = 'rgba(251,191,36,0.5)'; sw2 = 1.8; }
                return (
                  <g key={p.id} transform={`translate(${x},${y})`} onPointerDown={e => dStart(e, p.id)} style={{ cursor: 'pointer' }} filter={f} opacity={isHp ? 0.85 : 1}>
                    <g clipPath={`url(#c-${p.id})`}><image href={url} x={-p.cc * pw} y={-p.cr * ph} width={cfg.cols * pw} height={cfg.rows * ph} preserveAspectRatio="none" /></g>
                    <path d={genPath(pw, ph, s)} fill="none" stroke={sc} strokeWidth={sw2} strokeLinejoin="round" />
                    {isOkP && !dn && <path d={genPath(pw, ph, s)} fill="rgba(52,211,153,0.04)" stroke="none" />}
                  </g>
                );
              })}
              {dp !== null && dpos && (() => { const p = pcs.find(pc => pc.id === dp); if (!p) return null; const s = getShape(p.cr, p.cc, eds, cfg.cols, cfg.rows); return <g transform={`translate(${dpos.x - pw / 2},${dpos.y - ph / 2})`} filter="url(#ds)" opacity="0.9"><g clipPath={`url(#c-${p.id})`}><image href={url} x={-p.cc * pw} y={-p.cr * ph} width={cfg.cols * pw} height={cfg.rows * ph} preserveAspectRatio="none" /></g><path d={genPath(pw, ph, s)} fill="none" stroke="#fbbf24" strokeWidth={2} strokeLinejoin="round" /></g>; })()}
              {ht !== null && (() => { const hp2 = pcs.find(p => p.id === ht); if (!hp2) return null; const s = getShape(hp2.cr, hp2.cc, eds, cfg.cols, cfg.rows); return <g transform={`translate(${hp2.cc * pw + ext},${hp2.cr * ph + ext})`}><path d={genPath(pw, ph, s)} fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth={1.5} strokeDasharray="6 3"><animate attributeName="stroke-dashoffset" from="0" to="18" dur="1s" repeatCount="indefinite" /></path></g>; })()}
              {pts.map(p => <circle key={p.id} cx={p.x} cy={p.y} r={p.size * (p.life / 50)} fill={p.color} opacity={Math.min(1, p.life / 30)} />)}
            </svg>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-purple-300/60 text-xs">
            <span>💡 کلیک یا Drag</span><span>↩️ برگشت</span><span>🔥 Best: {bstk}</span><span>💎 Max Combo: {mcmb}</span>
            {rec && <span>🏆 رکورد: {fmt(rec.time)}</span>}
          </div>
          <div className="mt-2 text-center text-purple-400/40 text-[10px] hidden md:block">⌨️ میانبرها: Ctrl+Z (برگشت) | Ctrl+Y (بازگشت) | H (راهنما) | P (پیش‌نمایش) | Esc (لغو)</div>
        </div>
      </div>

      {dn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-purple-800 via-indigo-800 to-pink-800 rounded-3xl p-6 md:p-8 max-w-md w-full text-center border border-white/20 shadow-2xl">
            {mode === 'timeAttack' && tm === 0 ? (<><div className="text-7xl mb-4">⏰</div><h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-2">وقت تمام شد!</h2><p className="text-purple-200 text-lg mb-6">متأسفانه نتونستی پازل رو کامل کنی</p></>) : (<><div className="text-7xl mb-4">🏆</div><h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200 mb-2">تبریک!</h2><p className="text-purple-200 text-lg mb-6">پازل {cfg.total} تکه رو تکمیل کردی!</p></>)}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10"><div className="text-yellow-300 text-2xl font-black font-mono">{fmt(mode === 'timeAttack' ? 60 - tm : tm)}</div><div className="text-purple-200 text-sm mt-1">⏱️ زمان</div></div>
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10"><div className="text-blue-300 text-2xl font-black font-mono">{mv}</div><div className="text-purple-200 text-sm mt-1">🔄 حرکات</div></div>
            </div>
            {bstk >= 3 && <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-3 mb-4 border border-orange-400/30"><div className="text-orange-300 text-lg font-bold">🔥 بهترین Streak: {bstk}</div></div>}
            {mcmb >= 3 && <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 mb-4 border border-purple-400/30"><div className="text-purple-300 text-lg font-bold">💎 بیشترین Combo: x{mcmb}</div></div>}
            {rec && <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10"><div className="text-purple-200 text-sm">🏆 رکورد قبلی: {fmt(rec.time)}</div>{(mode !== 'timeAttack' || tm > 0) && (tm < rec.time || (tm === rec.time && mv < rec.moves)) && <div className="text-green-300 text-sm font-bold mt-1">🎉 رکورد جدید!</div>}</div>}
            <div className="mb-6"><div className="text-3xl">{mv < 80 ? '⭐⭐⭐' : mv < 140 ? '⭐⭐' : '⭐'}</div><p className="text-purple-300 text-sm mt-2">{mv < 80 ? 'فوق‌العاده! استاد پازل!' : mv < 140 ? 'عالی بود!' : 'آفرین!'}</p></div>
            <div className="flex flex-col gap-3">
              <button onClick={reset} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold">🔄 بازی مجدد</button>
              <button onClick={onBack} className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold border border-white/10">🏠 منوی اصلی</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Confetti() {
  const cs = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0', '#10b981', '#fbbf24'];
  const ps = Array.from({ length: 120 }, (_, i) => ({ id: i, x: Math.random() * 100, c: cs[i % cs.length], s: 5 + Math.random() * 10, d: Math.random() * 3, dur: 2 + Math.random() * 4, rot: Math.random() * 360, sh: Math.random() > 0.5 ? '50%' : '2px' }));
  return <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">{ps.map(p => <div key={p.id} className="absolute" style={{ left: `${p.x}%`, top: '-5%', width: `${p.s}px`, height: `${p.s * 0.6}px`, backgroundColor: p.c, borderRadius: p.sh, transform: `rotate(${p.rot}deg)`, animation: `confetti ${p.dur}s ease-in ${p.d}s forwards` }} />)}</div>;
}

// ============= OTHER SCREENS =============
function StatsScr({ onBack }: { onBack: () => void }) {
  const s = getStats(), lvl = calcLvl(s.xp || 0), pr = calcProg(s.xp || 0);
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <h2 className="text-4xl font-black text-white mb-8 text-center">📊 آمار بازی</h2>
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-3xl p-6 border border-yellow-400/30 mb-8">
          <div className="flex items-center justify-between mb-4"><div><div className="text-5xl font-black text-yellow-300 mb-1">سطح {lvl}</div><div className="text-yellow-200">{s.xp || 0} XP</div></div><div className="text-7xl">🏆</div></div>
          <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500" style={{ width: `${pr}%` }} /></div>
          <div className="text-yellow-200 text-sm mt-2 text-center">{pr}% تا سطح بعدی</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{ i: '🎮', v: s.games, l: 'بازی‌ها' }, { i: '🔄', v: s.moves, l: 'حرکات' }, { i: '🔥', v: s.streak, l: 'Streak' }, { i: '💎', v: s.combo, l: 'Combo' }, { i: '✅', v: s.correct, l: 'تکه‌ها' }].map((x, i) => (
            <div key={i} className="bg-white/10 rounded-2xl p-6 border border-white/10"><div className="text-4xl mb-2">{x.i}</div><div className="text-3xl font-black text-white">{x.v}</div><div className="text-purple-200 text-sm">{x.l}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AchsScr({ onBack }: { onBack: () => void }) {
  const s = getStats();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <h2 className="text-4xl font-black text-white mb-8 text-center">🏆 Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACHIEVEMENTS.map(a => {
            const u = s.achs.includes(a.id);
            return (<div key={a.id} className={`rounded-2xl p-6 border ${u ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30' : 'bg-white/5 border-white/10 opacity-60'}`}><div className="flex items-start gap-4"><div className="text-5xl">{a.emoji}</div><div className="flex-1"><h3 className="text-xl font-bold text-white mb-1">{a.title}</h3><p className="text-purple-200 text-sm mb-3">{a.desc}</p>{u ? <div className="text-green-300 font-bold">✓ باز شده!</div> : <div className="text-purple-300 text-sm">هنوز باز نشده</div>}</div></div></div>);
          })}
        </div>
      </div>
    </div>
  );
}

function TutScr({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [{ e: '👋', t: 'به بازی پازل خوش آمدید!', d: 'این بازی به شما کمک می‌کند تا مهارت‌های حل مسئله خود را تقویت کنید.' }, { e: '🎯', t: 'هدف بازی', d: 'تمام تکه‌های پازل را در جای درست قرار دهید.' }, { e: '🖱️', t: 'نحوه بازی', d: 'روی تکه‌ها کلیک کنید یا آنها را بکشید و رها کنید.' }, { e: '🔥', t: 'Streak و Combo', d: 'با قرار دادن متوالی تکه‌ها، Streak و Combo افزایش می‌یابد.' }, { e: '🏆', t: 'Achievements', d: 'با انجام چالش‌ها، Achievements باز کنید.' }, { e: '🚀', t: 'آماده‌اید؟', d: 'حالا یک پازل انتخاب کنید و شروع کنید!' }];
  const s = steps[step];
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-8"><div className="text-8xl mb-4">{s.e}</div><h2 className="text-3xl font-black text-white mb-4">{s.t}</h2><p className="text-purple-200 text-lg">{s.d}</p></div>
        <div className="flex justify-center gap-2 mb-8">{steps.map((_, i) => <div key={i} className={`w-3 h-3 rounded-full ${i === step ? 'bg-white scale-125' : i < step ? 'bg-white/50' : 'bg-white/20'}`} />)}</div>
        <div className="flex gap-4">
          <button onClick={() => { seeTut(); onBack(); }} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold">رد شدن</button>
          <button onClick={() => { if (step < steps.length - 1) setStep(step + 1); else { seeTut(); onBack(); } }} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold">{step === steps.length - 1 ? 'شروع بازی' : 'بعدی'}</button>
        </div>
      </div>
    </div>
  );
}

function DailyScr({ onBack, onStart }: { onBack: () => void; onStart: (u: string, n: string, d: string) => void }) {
  const ch = dailyChal(), done = dailyDone(), p = PUZZLES.find(x => x.id === ch.pid);
  if (!p) return null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8"><div className="text-8xl mb-4">🎯</div><h2 className="text-4xl font-black text-white mb-2">چالش روزانه</h2><p className="text-purple-200 text-lg">هر روز یک چالش جدید!</p></div>
        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2"><img src={p.url} alt={p.name} className="w-full h-auto rounded-2xl shadow-2xl" /></div>
            <div className="w-full md:w-1/2 text-center md:text-left">
              <div className="text-6xl mb-4">{p.emoji}</div>
              <h3 className="text-3xl font-bold text-white mb-4">{p.name}</h3>
              {done ? <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 mb-4"><div className="text-green-300 font-bold text-lg">✓ چالش امروز را کامل کردید!</div></div> : <button onClick={() => { onStart(p.url, p.name, ch.diff); doDaily(); }} className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-bold">🚀 شروع چالش</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PUScr({ onBack }: { onBack: () => void }) {
  const s = getStats();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8"><div className="text-8xl mb-4">✨</div><h2 className="text-4xl font-black text-white mb-2">Power-ups</h2></div>
        <div className="bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"><div className="text-3xl font-black text-yellow-300">{s.xp || 0} XP</div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POWERUPS.map(p => {
            const ca = (s.xp || 0) >= p.cost;
            return (<div key={p.id} className={`rounded-2xl p-6 border ${ca ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30' : 'bg-white/5 border-white/10 opacity-50'}`}><div className="flex items-start gap-4"><div className="text-5xl">{p.emoji}</div><div className="flex-1"><h3 className="text-xl font-bold text-white mb-1">{p.name}</h3><p className="text-purple-200 text-sm mb-3">{p.desc}</p><div className="flex items-center justify-between"><span className="text-yellow-300 font-bold">{p.cost} XP</span>{ca ? <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white text-sm font-bold">خرید</button> : <span className="text-red-300 text-sm">XP کافی نیست</span>}</div></div></div></div>);
          })}
        </div>
      </div>
    </div>
  );
}

function ThScr({ onBack }: { onBack: () => void }) {
  const s = getStats(), lvl = calcLvl(s.xp || 0), cur = theme();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8"><div className="text-8xl mb-4">🎨</div><h2 className="text-4xl font-black text-white mb-2">تم‌ها</h2><p className="text-purple-300 text-sm mt-2">سطح شما: {lvl}</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {THEMES.map(t => {
            const u = t.lvl <= lvl, c = t.id === cur;
            return (<div key={t.id} onClick={() => { if (u) { setTheme(t.id); window.location.reload(); } }} className={`rounded-2xl p-6 border-2 ${c ? 'border-yellow-400 scale-105' : u ? 'border-white/20 hover:border-white/40 cursor-pointer' : 'border-white/10 opacity-50 cursor-not-allowed'}`}><div className={`bg-gradient-to-br ${t.bg} rounded-xl p-4 mb-3`}><div className="text-5xl text-center">{t.emoji}</div></div><h3 className="text-white font-bold text-center">{t.name}</h3>{c && <div className="text-center text-yellow-300 text-sm font-bold mt-2">✓ فعال</div>}{!u && <div className="text-center text-purple-300 text-sm mt-2">🔒 سطح {t.lvl}</div>}</div>);
          })}
        </div>
      </div>
    </div>
  );
}

function SetScr({ onBack }: { onBack: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8"><div className="text-8xl mb-4">⚙️</div><h2 className="text-4xl font-black text-white mb-2">تنظیمات</h2></div>
        <div className="space-y-4">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">💾 مدیریت داده‌ها</h3>
            <button onClick={() => { const d = JSON.stringify({ stats: localStorage.getItem('pzStats'), rec: localStorage.getItem('pzRec'), lb: localStorage.getItem('pzLB'), date: new Date().toISOString() }, null, 2); const b = new Blob([d], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `puzzle-master-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(u); }} className="w-full px-6 py-3 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-white font-bold mb-3">📥 خروجی گرفتن از داده‌ها</button>
            <button onClick={() => setShow(true)} className="w-full px-6 py-3 bg-red-500/80 hover:bg-red-500 rounded-xl text-white font-bold">🗑️ حذف تمام داده‌ها</button>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">ℹ️ درباره بازی</h3>
            <div className="text-purple-200 space-y-2"><p>نسخه: {VERSION}</p><p>ساخته شده با ❤️ و React</p></div>
          </div>
        </div>
        {show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-br from-red-800 to-pink-800 rounded-3xl p-8 max-w-md w-full text-center border border-white/20">
              <div className="text-6xl mb-4">⚠️</div><h3 className="text-2xl font-bold text-white mb-4">آیا مطمئن هستید؟</h3><p className="text-red-200 mb-6">تمام داده‌های شما حذف خواهد شد!</p>
              <div className="flex gap-3"><button onClick={() => setShow(false)} className="flex-1 px-6 py-3 bg-white/10 rounded-xl text-white font-bold">انصراف</button><button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex-1 px-6 py-3 bg-red-500 rounded-xl text-white font-bold">حذف کامل</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LBScr({ onBack }: { onBack: () => void }) {
  const lb = getLB();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8"><div className="text-8xl mb-4">🏆</div><h2 className="text-4xl font-black text-white mb-2">جدول امتیازات</h2></div>
        {lb.length === 0 ? <div className="bg-white/10 rounded-2xl p-12 border border-white/20 text-center"><div className="text-6xl mb-4">🎮</div><h3 className="text-2xl font-bold text-white mb-2">هنوز رکوردی ثبت نشده</h3><p className="text-purple-200">اولین نفری باش که رکورد ثبت می‌کنه!</p></div> : (
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="space-y-3">{lb.map((e, i) => { const m = ['🥇', '🥈', '🥉']; const md = i < 3 ? m[i] : `#${i + 1}`; return <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${i === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30' : i === 1 ? 'bg-gradient-to-r from-gray-400/20 to-slate-500/20 border border-gray-400/30' : i === 2 ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-500/30' : 'bg-white/5 border border-white/10'}`}><div className="flex items-center gap-4"><div className="text-4xl">{md}</div><div><div className="text-white font-bold text-lg">{e.name}</div><div className="text-purple-200 text-sm">{e.puzzle}</div></div></div><div className="text-right"><div className="text-yellow-300 font-black text-2xl">{e.score}</div><div className="text-purple-200 text-xs">{new Date(e.date).toLocaleDateString('fa-IR')}</div></div></div>; })}</div>
          </div>
        )}
      </div>
    </div>
  );
}
