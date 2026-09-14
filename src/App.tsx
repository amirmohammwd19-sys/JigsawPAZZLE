import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Piece, Edges, Particle } from './types';
import { genEdges, getShape, generatePiecePath, createPieces, swapPieces, isPieceCorrect, isPuzzleComplete, getCorrectCount, formatTime, calculateProgress } from './utils';
import { playClick, playSelect, playSwap, playCorrect, playCombo, playUndo, playHint, playWin, playTimeWarning, playAchievement, beep } from './audio';
import { getStats, saveStats, getRecord, saveRecord, getLeaderboard, saveToLeaderboard, clearAutoSave, exportSaveData } from './storage';

const getRec = getRecord;
const saveRec = saveRecord;
import { checkAchievements, ACHIEVEMENTS } from './achievements';
import { DIFFICULTIES, GAME_MODES, PUZZLES, VERSION, MAX_HISTORY, TIME_ATTACK_DURATION, PARTICLE_COUNT, TOAST_DURATION, HINT_DURATION, CONFETTI_DURATION } from './config';
import { calculateXP, calculateLevel, getProgressToNextLevel, POWER_UPS, getDailyChallenge, hasCompletedDailyChallenge, completeDailyChallenge, calculateStreakBonus, calculateMoveEfficiency, calculateTimeBonus, hasSeenTutorial, markTutorialAsSeen, TUTORIAL_STEPS, THEMES, getCurrentTheme, setTheme, getUnlockedThemes } from './features';
import { getDailyRewards, getLoginStreak, claimDailyReward, loadQuestProgress, saveQuestProgress } from './gameSystems';
import type { Quest } from './types';

type Screen = 'menu' | 'game' | 'stats' | 'achs' | 'tut' | 'daily' | 'pu' | 'themes' | 'set' | 'lb' | 'quests' | 'minigames';
type DiffKey = keyof typeof DIFFICULTIES;
type ModeKey = keyof typeof GAME_MODES;

export default function App() {
  const [scr, setScr] = useState<Screen>('menu');
  const [url, setUrl] = useState('');
  const [nm, setNm] = useState('');
  const [diff, setDiff] = useState<DiffKey>('medium');
  const [mode, setMode] = useState<ModeKey>('classic');
  const [dRwd, setDRwd] = useState<{ show: boolean; amt: number }>({ show: false, amt: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = getLoginStreak(), rwds = getDailyRewards();
    const last = localStorage.getItem('pzLastDaily'), today = new Date().toDateString();
    if (last !== today) setDRwd({ show: true, amt: rwds[s % 7].reward });
  }, []);

  const claimRwd = () => {
    const r = claimDailyReward();
    if (r.success) { const s = getStats(); saveStats({ ...s, totalXP: (s.totalXP || 0) + r.reward }); localStorage.setItem('pzLastDaily', new Date().toDateString()); }
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
  if (scr === 'quests') return <QuestsScreen onBack={() => setScr('menu')} />;
  if (scr === 'minigames') return <MiniGamesScreen onBack={() => setScr('menu')} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {dRwd.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl p-8 max-w-md w-full text-center border-2 border-yellow-400/50 shadow-2xl animate-scale-in">
            <div className="text-8xl mb-4 animate-float">🎁</div>
            <h2 className="text-3xl font-black text-white mb-2">پاداش روزانه!</h2>
            <p className="text-yellow-200 text-lg mb-6">روز {getLoginStreak() + 1} ورود متوالی</p>
            <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-yellow-400/30">
              <div className="text-5xl font-black text-yellow-300 mb-2">+{dRwd.amt}</div>
              <div className="text-yellow-200">XP</div>
            </div>
            <button onClick={claimRwd} className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold hover:scale-105 transition-transform">
              دریافت پاداش
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="text-7xl mb-4 animate-float">🧩</div>
        <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 mb-3">Puzzle Master</h1>
        <p className="text-xl text-purple-200 mb-8">پازل جیگساو حرفه‌ای</p>

        <div className="mb-8">
          <h3 className="text-white font-bold mb-3">سطح دشواری</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(DIFFICULTIES).map(([k, v]) => (
              <button key={k} onClick={() => setDiff(k as any)} className={`px-6 py-3 rounded-xl font-bold transition-all ${diff === k ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <span className="text-2xl mr-2">{v.emoji}</span>{v.label}
                <span className="block text-xs mt-1 opacity-70">{v.total} تکه</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-white font-bold mb-3">حالت بازی</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(GAME_MODES).map(([k, v]) => (
              <button key={k} onClick={() => setMode(k as any)} className={`px-6 py-3 rounded-xl font-bold transition-all ${mode === k ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <span className="text-2xl mr-2">{v.emoji}</span>{v.label}
              </button>
            ))}
          </div>
        </div>

        <div onClick={() => fileRef.current?.click()} className="max-w-lg mx-auto cursor-pointer group mb-8">
          <div className="bg-white/5 border-2 border-dashed border-white/30 hover:border-yellow-400 rounded-3xl p-8 transition-all group-hover:bg-white/10 group-hover:scale-105">
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
              <div key={p.id} onClick={() => { setUrl(p.url); setNm(p.name); setScr('game'); }} className="cursor-pointer group rounded-2xl overflow-hidden hover:scale-105 transition-all">
                <div className="aspect-[4/3] relative">
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2"><span className="text-xl">{p.emoji}</span><span className="text-white font-bold text-sm">{p.name}</span></div>
                    {r && <span className="text-xs text-green-300 bg-green-500/20 px-1.5 py-0.5 rounded-full mt-1 inline-block">🏆 {formatTime(r.time)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 max-w-4xl mx-auto">
          <Btn onClick={() => setScr('daily')} icon="🎯" label="چالش روزانه" gradient="from-orange-500 to-red-500" />
          <Btn onClick={() => setScr('quests')} icon="📜" label="ماموریت‌ها" gradient="from-indigo-500 to-purple-500" />
          <Btn onClick={() => setScr('lb')} icon="🏆" label="جدول امتیازات" gradient="from-yellow-500 to-orange-500" />
          <Btn onClick={() => setScr('minigames')} icon="🎮" label="بازی‌های کوچک" gradient="from-green-500 to-emerald-500" />
          <Btn onClick={() => setScr('pu')} icon="✨" label="Power-ups" gradient="from-pink-500 to-purple-500" />
          <Btn onClick={() => setScr('themes')} icon="🎨" label="تم‌ها" gradient="from-cyan-500 to-blue-500" />
          <Btn onClick={() => setScr('stats')} icon="📊" label="آمار" />
          <Btn onClick={() => setScr('achs')} icon="🏅" label="Achievements" />
          <Btn onClick={() => setScr('tut')} icon="📖" label="آموزش" />
          <Btn onClick={() => setScr('set')} icon="⚙️" label="تنظیمات" />
        </div>

        <div className="text-purple-400/60 text-sm">ساخته شده با ❤️ | v{VERSION}</div>
      </div>
    </div>
  );
}

function Btn({ onClick, icon, label, gradient }: { onClick: () => void; icon: string; label: string; gradient?: string }) {
  return (
    <button onClick={onClick} className={`px-4 py-3 ${gradient ? `bg-gradient-to-r ${gradient} hover:scale-105` : 'bg-white/10 hover:bg-white/20'} rounded-xl text-white font-bold transition-all`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm">{label}</div>
    </button>
  );
}

// ============= GAME =============
function Game({ url, nm, diff, mode, onBack }: { url: string; nm: string; diff: DiffKey; mode: ModeKey; onBack: () => void }) {
  const cfg = DIFFICULTIES[diff];
  const [pcs, setPcs] = useState<Piece[]>([]);
  const [eds, setEds] = useState<Edges | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [mv, setMv] = useState(0);
  const [tm, setTm] = useState(mode === 'timeAttack' ? TIME_ATTACK_DURATION : 0);
  const [dn, setDn] = useState(false);
  const [pv, setPv] = useState(false);
  const [ht, setHt] = useState<number | null>(null);
  const [cf, setCf] = useState(false);
  const [snd, setSnd] = useState(true);
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
    setLd(true);
    let cancelled = false;
    const i = new Image();
    if (url.startsWith('blob:')) {
      i.onload = () => { if (!cancelled) { setImg(i); setLd(false); } };
      i.onerror = () => { if (!cancelled) setLd(false); };
      i.src = url;
    } else {
      i.crossOrigin = 'anonymous';
      i.onload = () => { if (!cancelled) { setImg(i); setLd(false); } };
      i.onerror = () => {
        if (cancelled) return;
        const i2 = new Image();
        i2.onload = () => { if (!cancelled) { setImg(i2); setLd(false); } };
        i2.onerror = () => { if (!cancelled) setLd(false); };
        i2.src = url;
      };
      i.src = url;
    }
    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    if (img) {
      setEds(genEdges(cfg.cols, cfg.rows));
      setPcs(createPieces(cfg.cols, cfg.rows));
      setTm(mode === 'timeAttack' ? TIME_ATTACK_DURATION : 0);
      setMv(0); setSel(null); setDn(false); setHist([]); setRedo([]);
      setStk(0); setBstk(0); setCmb(0); setMcmb(0);
      setPaused(false); setCf(false); setTst(null); setHt(null);
      setDp(null); setDpos(null); setHp(null); setPts([]); setLpId(null);
    }
  }, [img, cfg.cols, cfg.rows, mode]);

  useEffect(() => {
    let tid: any;
    const resize = () => { if (cref.current) setCw(Math.min(cref.current.clientWidth - 20, 850)); };
    const debounced = () => { clearTimeout(tid); tid = setTimeout(resize, 100); };
    resize();
    window.addEventListener('resize', debounced);
    return () => { window.removeEventListener('resize', debounced); clearTimeout(tid); };
  }, []);

  useEffect(() => {
    if (!dn && !paused && mode !== 'zen') {
      if (mode === 'timeAttack') {
        tref.current = setInterval(() => {
          setTm(t => {
            if (t <= 11 && t > 0 && snd) playTimeWarning();
            if (t <= 1) { setDn(true); return 0; }
            return t - 1;
          });
        }, 1000);
      } else {
        tref.current = setInterval(() => setTm(t => t + 1), 1000);
      }
    }
    return () => { if (tref.current) { clearInterval(tref.current); tref.current = null; } };
  }, [dn, paused, mode, snd]);

  useEffect(() => {
    if (pcs.length > 0 && isPuzzleComplete(pcs) && !dn) {
      setDn(true); setCf(true);
      if (snd) playWin();
      const ft = mode === 'timeAttack' ? TIME_ATTACK_DURATION - tm : tm;
      const nr = saveRec(nm, ft, mv, bstk, mcmb);
      const s = getStats();
      const xp = calcXP(mv, ft, bstk, mcmb);
      const sb = calcStreakBonus(bstk);
      const tb = calcTimeBonus(ft, pcs.length);
      const eff = Math.min(100, Math.round((pcs.length / mv) * 100));
      saveStats({ ...s, gamesPlayed: s.gamesPlayed + 1, totalMoves: s.totalMoves + mv, bestStreak: Math.max(s.bestStreak, bstk), maxCombo: Math.max(s.maxCombo, mcmb), totalCorrect: s.totalCorrect + pcs.length, totalXP: (s.totalXP || 0) + xp + sb + tb, totalTime: (s.totalTime || 0) + ft, bestEfficiency: Math.max(s.bestEfficiency || 0, eff) });
      const score = Math.round((10000 / Math.max(1, ft)) * (100 / Math.max(1, mv)));
      saveToLeaderboard({ name: 'Player', score, date: new Date().toISOString(), puzzle: nm });
      clearAutoSave();
      const na = checkAch(s.gamesPlayed + 1, ft, mv, bstk, mcmb);
      if (na.length > 0) { if (snd) playAchievement(); setTst(`🏆 ${na.length} Achievement جدید!`); setTimeout(() => setTst(null), TOAST_DURATION); }
      if (nr) { setTst('🎉 رکورد جدید!'); setTimeout(() => setTst(null), TOAST_DURATION); }
      setTimeout(() => setCf(false), CONFETTI_DURATION);
    }
  }, [pcs, snd, nm, tm, mv, bstk, mcmb, mode, diff, dn]);

  useEffect(() => {
    if (pts.length === 0) return;
    let af: number;
    const animate = () => {
      setPts(p => p.map(x => ({ ...x, x: x.x + x.vx, y: x.y + x.vy, vy: x.vy + 0.3, life: x.life - 1 })).filter(x => x.life > 0));
      af = requestAnimationFrame(animate);
    };
    af = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(af);
  }, [pts.length]);

  const dims = useMemo(() => {
    if (!img) return null;
    const ia = img.width / img.height, pw = cw / (cfg.cols + 0.5), ph = pw / ia, ext = pw * 0.22;
    return { pw, ph, ext, sw: cfg.cols * pw + ext * 2, sh: cfg.rows * ph + ext * 2 };
  }, [img, cw, cfg.cols, cfg.rows]);

  const spawn = useCallback((x: number, y: number, n = PARTICLE_COUNT) => {
    const np: Particle[] = [];
    for (let i = 0; i < n; i++) np.push({ id: Date.now() + i + Math.random(), x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 - 4, life: 40 + Math.random() * 20, color: ['#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#a78bfa'][Math.floor(Math.random() * 5)], size: 2 + Math.random() * 5 });
    setPts(p => [...p, ...np]);
  }, []);

  const doSwap = useCallback((a: number, b: number) => {
    setHist(h => [...h.slice(-MAX_HISTORY), pcs.map(x => ({ ...x }))]);
    setRedo([]);
    const np = swapPieces(pcs, a, b);
    setPcs(np); setMv(m => m + 1);
    const p1 = np.find(p => p.id === a)!, p2 = np.find(p => p.id === b)!;
    const o1 = isPieceCorrect(p1), o2 = isPieceCorrect(p2);
    if (o1 || o2) {
      setStk(s => { const ns = s + 1; setBstk(b => Math.max(b, ns)); return ns; });
      setCmb(c => { const nc = c + 1; setMcmb(m => Math.max(m, nc)); if (nc >= 3 && snd) playCombo(); return nc; });
      if (snd && cmb < 3) playCorrect();
      if (o1 && dims) { setLpId(p1.id); spawn(p1.c * dims.pw + dims.ext + dims.pw / 2, p1.r * dims.ph + dims.ext + dims.ph / 2); }
      if (o2 && dims) { setLpId(p2.id); spawn(p2.c * dims.pw + dims.ext + dims.pw / 2, p2.r * dims.ph + dims.ext + dims.ph / 2); }
      setTimeout(() => setLpId(null), 800);
    } else { setStk(0); setCmb(0); if (snd) playSwap(); }
  }, [pcs, snd, dims, spawn, cmb]);

  const click = useCallback((id: number) => {
    if (dn || drag.current) return;
    if (sel === null) { setSel(id); if (snd) playClick(); }
    else if (sel === id) setSel(null);
    else { doSwap(sel, id); setSel(null); }
  }, [sel, dn, snd, doSwap]);

  const dStart = (e: React.PointerEvent, id: number) => { if (dn) return; e.preventDefault(); e.stopPropagation(); drag.current = false; dstart.current = { x: e.clientX, y: e.clientY }; dpId.current = id; };
  const dMove = (e: React.PointerEvent) => {
    if (dpId.current === null || !dstart.current || !dims || !sref.current) return;
    const dx = e.clientX - dstart.current.x, dy = e.clientY - dstart.current.y;
    if (!drag.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) { drag.current = true; setDp(dpId.current); if (snd) playSelect(); }
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

  const reset = () => { setEds(genEdges(cfg.cols, cfg.rows)); setPcs(createPieces(cfg.cols, cfg.rows)); setTm(mode === 'timeAttack' ? TIME_ATTACK_DURATION : 0); setMv(0); setSel(null); setDn(false); setCf(false); setHist([]); setRedo([]); setStk(0); setBstk(0); setCmb(0); setMcmb(0); };
  const hint = () => { const w = pcs.filter(p => !isPieceCorrect(p)); if (w.length) { const r = w[Math.floor(Math.random() * w.length)]; setHt(r.id); setTimeout(() => setHt(null), HINT_DURATION); if (snd) playHint(); } };
  const undo = () => { if (hist.length > 0) { setRedo(r => [...r, pcs]); setPcs(hist[hist.length - 1]); setHist(h => h.slice(0, -1)); setMv(m => Math.max(0, m - 1)); setStk(0); if (snd) playUndo(); } };
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
  }, [dn, pv, sel]);

  const ok = getCorrectCount(pcs), pr = calculateProgress(pcs), rec = getRec(nm);

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
      {tst && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-scale-in">{tst}</div>}
      
      {pv && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setPv(false)}>
          <div className="relative max-w-4xl w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <img src={url} alt="Preview" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl border-4 border-white/30" />
            <div className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-full text-white font-bold">👁️ پیش‌نمایش</div>
            <button onClick={() => setPv(false)} className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full text-white text-2xl font-bold">×</button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/10">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all">→ بازگشت</button>
            <h2 className="text-white font-bold truncate max-w-[120px] md:max-w-none text-sm md:text-base">{nm}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1"><span className="text-yellow-300 text-xs">⏱️</span><span className="text-white font-mono text-xs">{formatTime(tm)}</span></div>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1"><span className="text-blue-300 text-xs">🔄</span><span className="text-white font-mono text-xs">{mv}</span></div>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1"><span className="text-green-300 text-xs">✅</span><span className="text-white font-mono text-xs">{ok}/{cfg.total}</span></div>
            {stk >= 2 && <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-lg px-2 py-1 border border-orange-400/30"><span className="text-orange-300 text-xs">🔥</span><span className="text-white font-mono text-xs font-bold">{stk}</span></div>}
            <button onClick={() => setPv(true)} className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs transition-all">👁️</button>
            <button onClick={() => setGrid(!grid)} className={`px-2 py-1 rounded-lg text-white text-xs transition-all ${grid ? 'bg-blue-500/80' : 'bg-white/10'}`}>⊞</button>
            <button onClick={undo} disabled={hist.length === 0} className={`px-2 py-1 rounded-lg text-white text-xs transition-all ${hist.length > 0 ? 'bg-blue-500/80 hover:bg-blue-500' : 'bg-white/5 opacity-50'}`}>↩️</button>
            <button onClick={redoAct} disabled={redo.length === 0} className={`px-2 py-1 rounded-lg text-white text-xs transition-all ${redo.length > 0 ? 'bg-purple-500/80 hover:bg-purple-500' : 'bg-white/5 opacity-50'}`}>↪️</button>
            <button onClick={hint} className="px-2 py-1 bg-amber-500/80 hover:bg-amber-500 rounded-lg text-white text-xs transition-all">💡</button>
            <button onClick={() => setSnd(!snd)} className={`px-2 py-1 rounded-lg text-white text-xs transition-all ${snd ? 'bg-green-500/80' : 'bg-white/10'}`}>{snd ? '🔊' : '🔇'}</button>
            <button onClick={reset} className="px-2 py-1 bg-red-500/80 hover:bg-red-500 rounded-lg text-white text-xs transition-all">🔄</button>
          </div>
        </div>
        <div className="mt-2 bg-black/30 rounded-full p-1 border border-white/10">
          <div className="flex items-center gap-3 px-3">
            <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500 relative overflow-hidden" style={{ width: `${pr}%`, background: pr === 100 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b)' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <span className="text-white font-bold text-sm min-w-[2.5rem] text-left">{pr}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex justify-center">
        <div ref={cref} className="w-full relative" style={{ maxWidth: '900px' }}>
          <div className="bg-black/40 rounded-xl border-2 border-white/20 overflow-hidden shadow-2xl p-2">
            <svg ref={sref} width="100%" viewBox={`0 0 ${sw} ${sh}`} style={{ aspectRatio: `${sw}/${sh}`, touchAction: 'none' }} className={dp !== null ? 'cursor-grabbing' : 'cursor-grab'} onPointerMove={dMove} onPointerUp={dEnd} onPointerLeave={dEnd}>
              <defs>
                {pcs.map(p => { const s = getShape(p.cr, p.cc, eds, cfg.cols, cfg.rows); return <clipPath key={`c-${p.id}`} id={`c-${p.id}`}><path d={generatePiecePath(pw, ph, s)} /></clipPath>; })}
                <filter id="gy" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b" /><feFlood floodColor="#fbbf24" floodOpacity="0.8" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id="gg" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="b" /><feFlood floodColor="#34d399" floodOpacity="0.7" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.5" /></filter>
              </defs>
              <rect x={ext} y={ext} width={cfg.cols * pw} height={cfg.rows * ph} fill="rgba(0,0,0,0.3)" rx="2" />
              {grid && <g opacity="0.08">{Array.from({ length: cfg.cols + 1 }).map((_, i) => <line key={`v${i}`} x1={ext + i * pw} y1={ext} x2={ext + i * pw} y2={ext + cfg.rows * ph} stroke="white" strokeWidth="0.5" />)}{Array.from({ length: cfg.rows + 1 }).map((_, i) => <line key={`h${i}`} x1={ext} y1={ext + i * ph} x2={ext + cfg.cols * pw} y2={ext + i * ph} stroke="white" strokeWidth="0.5" />)}</g>}
              {pcs.map(p => {
                const s = getShape(p.cr, p.cc, eds, cfg.cols, cfg.rows), x = p.c * pw + ext, y = p.r * ph + ext;
                const isSel = sel === p.id, isHt = ht === p.id, isOkP = isPieceCorrect(p), isDp = dp === p.id, isHp = hp === p.id && dp !== null && dp !== p.id, isLp = lpId === p.id;
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
                    <path d={generatePiecePath(pw, ph, s)} fill="none" stroke={sc} strokeWidth={sw2} strokeLinejoin="round" />
                    {isOkP && !dn && <path d={generatePiecePath(pw, ph, s)} fill="rgba(52,211,153,0.04)" stroke="none" />}
                  </g>
                );
              })}
              {dp !== null && dpos && (() => { const p = pcs.find(pc => pc.id === dp); if (!p) return null; const s = getShape(p.cr, p.cc, eds, cfg.cols, cfg.rows); return <g transform={`translate(${dpos.x - pw / 2},${dpos.y - ph / 2})`} filter="url(#ds)" opacity="0.9"><g clipPath={`url(#c-${p.id})`}><image href={url} x={-p.cc * pw} y={-p.cr * ph} width={cfg.cols * pw} height={cfg.rows * ph} preserveAspectRatio="none" /></g><path d={generatePiecePath(pw, ph, s)} fill="none" stroke="#fbbf24" strokeWidth={2} strokeLinejoin="round" /></g>; })()}
              {ht !== null && (() => { const hp2 = pcs.find(p => p.id === ht); if (!hp2) return null; const s = getShape(hp2.cr, hp2.cc, eds, cfg.cols, cfg.rows); return <g transform={`translate(${hp2.cc * pw + ext},${hp2.cr * ph + ext})`}><path d={generatePiecePath(pw, ph, s)} fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth={1.5} strokeDasharray="6 3"><animate attributeName="stroke-dashoffset" from="0" to="18" dur="1s" repeatCount="indefinite" /></path></g>; })()}
              {pts.map(p => <circle key={p.id} cx={p.x} cy={p.y} r={p.size * (p.life / 50)} fill={p.color} opacity={Math.min(1, p.life / 30)} />)}
            </svg>
          </div>
          <div className="mt-2 text-center text-purple-400/40 text-[10px] hidden md:block">⌨️ Ctrl+Z (برگشت) | Ctrl+Y (بازگشت) | H (راهنما) | P (پیش‌نمایش) | Esc (لغو)</div>
        </div>
      </div>

      {dn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-purple-800 via-indigo-800 to-pink-800 rounded-3xl p-6 md:p-8 max-w-md w-full text-center border border-white/20 shadow-2xl animate-scale-in">
            {mode === 'timeAttack' && tm === 0 ? (<><div className="text-7xl mb-4">⏰</div><h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-2">وقت تمام شد!</h2><p className="text-purple-200 text-lg mb-6">متأسفانه نتونستی پازل رو کامل کنی</p></>) : (<><div className="text-7xl mb-4">🏆</div><h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200 mb-2">تبریک!</h2><p className="text-purple-200 text-lg mb-6">پازل {cfg.total} تکه رو تکمیل کردی!</p></>)}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10"><div className="text-yellow-300 text-2xl font-black font-mono">{formatTime(mode === 'timeAttack' ? TIME_ATTACK_DURATION - tm : tm)}</div><div className="text-purple-200 text-sm mt-1">⏱️ زمان</div></div>
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10"><div className="text-blue-300 text-2xl font-black font-mono">{mv}</div><div className="text-purple-200 text-sm mt-1">🔄 حرکات</div></div>
            </div>
            {bstk >= 3 && <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-3 mb-4 border border-orange-400/30"><div className="text-orange-300 text-lg font-bold">🔥 بهترین Streak: {bstk}</div></div>}
            {mcmb >= 3 && <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 mb-4 border border-purple-400/30"><div className="text-purple-300 text-lg font-bold">💎 بیشترین Combo: x{mcmb}</div></div>}
            {rec && <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10"><div className="text-purple-200 text-sm">🏆 رکورد قبلی: {formatTime(rec.time)}</div>{(mode !== 'timeAttack' || tm > 0) && (tm < rec.time || (tm === rec.time && mv < rec.moves)) && <div className="text-green-300 text-sm font-bold mt-1">🎉 رکورد جدید!</div>}</div>}
            <div className="mb-6"><div className="text-3xl">{mv < 80 ? '⭐⭐⭐' : mv < 140 ? '⭐⭐' : '⭐'}</div><p className="text-purple-300 text-sm mt-2">{mv < 80 ? 'فوق‌العاده!' : mv < 140 ? 'عالی بود!' : 'آفرین!'}</p></div>
            <div className="flex flex-col gap-3">
              <button onClick={reset} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold hover:scale-105 transition-transform">🔄 بازی مجدد</button>
              <button onClick={onBack} className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold border border-white/10 transition-all">🏠 منوی اصلی</button>
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

// Helper functions
const calcXP = (m: number, t: number, s: number, c: number) => { let x = 100; if (m < 50) x += 200; else if (m < 100) x += 100; if (t < 60) x += 300; else if (t < 120) x += 200; x += s * 10 + c * 15; return x; };
const calcStreakBonus = (s: number) => { if (s >= 20) return 500; if (s >= 15) return 300; if (s >= 10) return 200; if (s >= 5) return 100; if (s >= 3) return 50; return 0; };
const calcTimeBonus = (t: number, total: number) => { const e = total * 2; if (t < e * 0.5) return 500; if (t < e * 0.75) return 300; if (t < e) return 150; return 50; };
const checkAch = (g: number, t: number, m: number, bs: number, mc: number) => { const n: string[] = []; ACHIEVEMENTS.forEach(a => { if (!getStats().achievements.includes(a.id)) { let ok = false; if (a.id === 'first_win' && g >= 1) ok = true; if (a.id === 'speed_demon' && t < 120) ok = true; if (a.id === 'perfectionist' && m < 50) ok = true; if (a.id === 'streak_master' && bs >= 10) ok = true; if (a.id === 'puzzle_master' && g >= 10) ok = true; if (a.id === 'combo_king' && mc >= 5) ok = true; if (a.id === 'marathon' && m >= 50) ok = true; if (ok) { const s = getStats(); s.achievements.push(a.id); saveStats(s); n.push(a.id); } } }); return n; };

// Other screens (simplified for brevity - same as before)
function StatsScr({ onBack }: { onBack: () => void }) {
  const s = getStats(), lvl = calculateLevel(s.totalXP || 0), pr = getProgressToNextLevel(s.totalXP || 0);
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <h2 className="text-4xl font-black text-white mb-8 text-center">📊 آمار بازی</h2>
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-3xl p-6 border border-yellow-400/30 mb-8">
          <div className="flex items-center justify-between mb-4"><div><div className="text-5xl font-black text-yellow-300 mb-1">سطح {lvl}</div><div className="text-yellow-200">{s.totalXP || 0} XP</div></div><div className="text-7xl">🏆</div></div>
          <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all" style={{ width: `${pr}%` }} /></div>
          <div className="text-yellow-200 text-sm mt-2 text-center">{pr}% تا سطح بعدی</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{ i: '🎮', v: s.gamesPlayed, l: 'بازی‌ها' }, { i: '🔄', v: s.totalMoves, l: 'حرکات' }, { i: '🔥', v: s.bestStreak, l: 'Streak' }, { i: '💎', v: s.maxCombo, l: 'Combo' }, { i: '✅', v: s.totalCorrect, l: 'تکه‌ها' }].map((x, i) => (
            <div key={i} className="bg-white/10 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"><div className="text-4xl mb-2">{x.i}</div><div className="text-3xl font-black text-white">{x.v}</div><div className="text-purple-200 text-sm">{x.l}</div></div>
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
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <h2 className="text-4xl font-black text-white mb-8 text-center">🏆 Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACHIEVEMENTS.map(a => { const u = s.achievements.includes(a.id); return (<div key={a.id} className={`rounded-2xl p-6 border transition-all ${u ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30' : 'bg-white/5 border-white/10 opacity-60'}`}><div className="flex items-start gap-4"><div className="text-5xl">{a.emoji}</div><div className="flex-1"><h3 className="text-xl font-bold text-white mb-1">{a.title}</h3><p className="text-purple-200 text-sm mb-3">{a.desc}</p>{u ? <div className="text-green-300 font-bold">✓ باز شده!</div> : <div className="text-purple-300 text-sm">هنوز باز نشده</div>}</div></div></div>); })}
        </div>
      </div>
    </div>
  );
}

function TutScr({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const s = TUTORIAL_STEPS[step];
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-8"><div className="text-8xl mb-4">{s.emoji}</div><h2 className="text-3xl font-black text-white mb-4">{s.title}</h2><p className="text-purple-200 text-lg">{s.description}</p></div>
        <div className="flex justify-center gap-2 mb-8">{TUTORIAL_STEPS.map((_, i) => <div key={i} className={`w-3 h-3 rounded-full transition-all ${i === step ? 'bg-white scale-125' : i < step ? 'bg-white/50' : 'bg-white/20'}`} />)}</div>
        <div className="flex gap-4"><button onClick={() => { markTutorialAsSeen(); onBack(); }} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all">رد شدن</button><button onClick={() => { if (step < TUTORIAL_STEPS.length - 1) setStep(step + 1); else { markTutorialAsSeen(); onBack(); } }} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold transition-all hover:scale-105">{step === TUTORIAL_STEPS.length - 1 ? 'شروع بازی' : 'بعدی'}</button></div>
      </div>
    </div>
  );
}

function DailyScr({ onBack, onStart }: { onBack: () => void; onStart: (u: string, n: string, d: string) => void }) {
  const ch = getDailyChallenge(), done = hasCompletedDailyChallenge(), p = PUZZLES.find(x => x.id === ch.puzzleId);
  if (!p) return null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8"><div className="text-8xl mb-4">🎯</div><h2 className="text-4xl font-black text-white mb-2">چالش روزانه</h2></div>
        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2"><img src={p.url} alt={p.name} className="w-full h-auto rounded-2xl shadow-2xl" /></div>
            <div className="w-full md:w-1/2 text-center md:text-left">
              <div className="text-6xl mb-4">{p.emoji}</div>
              <h3 className="text-3xl font-bold text-white mb-4">{p.name}</h3>
              {done ? <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 mb-4"><div className="text-green-300 font-bold text-lg">✓ چالش امروز را کامل کردید!</div></div> : <button onClick={() => { onStart(p.url, p.name, ch.difficulty); completeDailyChallenge(); }} className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-bold hover:scale-105 transition-transform">🚀 شروع چالش</button>}
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
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8"><div className="text-8xl mb-4">✨</div><h2 className="text-4xl font-black text-white mb-2">Power-ups</h2></div>
        <div className="bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"><div className="text-3xl font-black text-yellow-300">{s.totalXP || 0} XP</div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POWER_UPS.map(p => { const ca = (s.totalXP || 0) >= p.cost; return (<div key={p.id} className={`rounded-2xl p-6 border transition-all ${ca ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30' : 'bg-white/5 border-white/10 opacity-50'}`}><div className="flex items-start gap-4"><div className="text-5xl">{p.emoji}</div><div className="flex-1"><h3 className="text-xl font-bold text-white mb-1">{p.name}</h3><p className="text-purple-200 text-sm mb-3">{p.desc}</p><div className="flex items-center justify-between"><span className="text-yellow-300 font-bold">{p.cost} XP</span>{ca ? <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white text-sm font-bold">خرید</button> : <span className="text-red-300 text-sm">XP کافی نیست</span>}</div></div></div></div>); })}
        </div>
      </div>
    </div>
  );
}

function ThScr({ onBack }: { onBack: () => void }) {
  const s = getStats(), lvl = calculateLevel(s.totalXP || 0), cur = getCurrentTheme();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8"><div className="text-8xl mb-4">🎨</div><h2 className="text-4xl font-black text-white mb-2">تم‌ها</h2><p className="text-purple-300 text-sm mt-2">سطح شما: {lvl}</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {THEMES.map(t => { const u = t.unlockLevel <= lvl, c = t.id === cur.id; return (<div key={t.id} onClick={() => { if (u) { setTheme(t.id); window.location.reload(); } }} className={`rounded-2xl p-6 border-2 transition-all ${c ? 'border-yellow-400 scale-105' : u ? 'border-white/20 hover:border-white/40 cursor-pointer hover:scale-105' : 'border-white/10 opacity-50 cursor-not-allowed'}`}><div className={`bg-gradient-to-br ${t.background} rounded-xl p-4 mb-3`}><div className="text-5xl text-center">{t.emoji}</div></div><h3 className="text-white font-bold text-center">{t.name}</h3>{c && <div className="text-center text-yellow-300 text-sm font-bold mt-2">✓ فعال</div>}{!u && <div className="text-center text-purple-300 text-sm mt-2">🔒 سطح {t.unlockLevel}</div>}</div>); })}
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
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8"><div className="text-8xl mb-4">⚙️</div><h2 className="text-4xl font-black text-white mb-2">تنظیمات</h2></div>
        <div className="space-y-4">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">💾 مدیریت داده‌ها</h3>
            <button onClick={() => { const d = exportSaveData(); const b = new Blob([d], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `puzzle-master-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(u); }} className="w-full px-6 py-3 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-white font-bold mb-3 transition-all">📥 خروجی گرفتن از داده‌ها</button>
            <button onClick={() => setShow(true)} className="w-full px-6 py-3 bg-red-500/80 hover:bg-red-500 rounded-xl text-white font-bold transition-all">🗑️ حذف تمام داده‌ها</button>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">ℹ️ درباره بازی</h3>
            <div className="text-purple-200 space-y-2"><p>نسخه: {VERSION}</p><p>ساخته شده با ❤️ و React</p></div>
          </div>
        </div>
        {show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-red-800 to-pink-800 rounded-3xl p-8 max-w-md w-full text-center border border-white/20 animate-scale-in">
              <div className="text-6xl mb-4">⚠️</div><h3 className="text-2xl font-bold text-white mb-4">آیا مطمئن هستید؟</h3><p className="text-red-200 mb-6">تمام داده‌های شما حذف خواهد شد!</p>
              <div className="flex gap-3"><button onClick={() => setShow(false)} className="flex-1 px-6 py-3 bg-white/10 rounded-xl text-white font-bold transition-all hover:bg-white/20">انصراف</button><button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex-1 px-6 py-3 bg-red-500 rounded-xl text-white font-bold transition-all hover:bg-red-400">حذف کامل</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LBScr({ onBack }: { onBack: () => void }) {
  const lb = getLeaderboard();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8"><div className="text-8xl mb-4">🏆</div><h2 className="text-4xl font-black text-white mb-2">جدول امتیازات</h2></div>
        {lb.length === 0 ? <div className="bg-white/10 rounded-2xl p-12 border border-white/20 text-center"><div className="text-6xl mb-4">🎮</div><h3 className="text-2xl font-bold text-white mb-2">هنوز رکوردی ثبت نشده</h3><p className="text-purple-200">اولین نفری باش که رکورد ثبت می‌کنه!</p></div> : (
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="space-y-3">{lb.map((e, i) => { const m = ['🥇', '🥈', '🥉']; const md = i < 3 ? m[i] : `#${i + 1}`; return <div key={i} className={`flex items-center justify-between p-4 rounded-xl transition-all ${i === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30' : i === 1 ? 'bg-gradient-to-r from-gray-400/20 to-slate-500/20 border border-gray-400/30' : i === 2 ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-500/30' : 'bg-white/5 border border-white/10'}`}><div className="flex items-center gap-4"><div className="text-4xl">{md}</div><div><div className="text-white font-bold text-lg">{e.name}</div><div className="text-purple-200 text-sm">{e.puzzle}</div></div></div><div className="text-right"><div className="text-yellow-300 font-black text-2xl">{e.score}</div><div className="text-purple-200 text-xs">{new Date(e.date).toLocaleDateString('fa-IR')}</div></div></div>; })}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestsScreen({ onBack }: { onBack: () => void }) {
  const [quests, setQuests] = useState(loadQuestProgress());
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const dailyQuests = quests.filter((q: Quest) => q.type === 'daily');

  const handleClaimReward = (questId: string, reward: number) => {
    const stats = getStats();
    saveStats({ ...stats, totalXP: (stats.totalXP || 0) + reward });
    const newClaimedRewards = [...claimedRewards, questId];
    setClaimedRewards(newClaimedRewards);
    const updatedQuests = quests.map((q: Quest) => q.id === questId ? { ...q, progress: q.target } : q);
    setQuests(updatedQuests);
    saveQuestProgress(updatedQuests);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">📜</div>
          <h2 className="text-4xl font-black text-white mb-2">ماموریت‌ها</h2>
          <p className="text-purple-200 text-lg">ماموریت‌ها را کامل کن و XP دریافت کن!</p>
        </div>
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">🎯 ماموریت‌های روزانه</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailyQuests.map((quest: Quest) => {
              const isCompleted = quest.progress >= quest.target;
              const isClaimed = claimedRewards.includes(quest.id);
              const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
              return (
                <div key={quest.id} className={`rounded-2xl p-6 border transition-all ${isCompleted && !isClaimed ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30' : 'bg-white/10 border-white/20'}`}>
                  <div className="text-5xl mb-3">{quest.emoji}</div>
                  <h4 className="text-xl font-bold text-white mb-2">{quest.title}</h4>
                  <p className="text-purple-200 text-sm mb-3">{quest.description}</p>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200 text-sm">{quest.progress}/{quest.target}</span>
                    <span className="text-yellow-300 font-bold">+{quest.reward} XP</span>
                  </div>
                  {isCompleted && !isClaimed && (
                    <button onClick={() => handleClaimReward(quest.id, quest.reward)} className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white font-bold transition-all hover:scale-105">دریافت پاداش</button>
                  )}
                  {isClaimed && <div className="w-full mt-3 px-4 py-2 bg-white/5 rounded-lg text-center text-green-300 font-bold">✓ دریافت شد</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniGamesScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🎮</div>
          <h2 className="text-4xl font-black text-white mb-2">بازی‌های کوچک</h2>
          <p className="text-purple-200 text-lg">به زودی...</p>
        </div>
      </div>
    </div>
  );
}
