import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Piece, Edges, Particle } from './types';
import { genEdges, getShape, generatePiecePath, createPieces, swapPieces, isPieceCorrect, isPuzzleComplete, getCorrectCount, formatTime, calculateProgress } from './utils';
import { 
  playClick, playSelect, playSwap, playCorrect, playUndo, playHint, 
  playWin, playTimeWarning, playAchievement, beep, 
  setMasterVolume, getMasterVolume, 
  playComboLevel, playStreakBreak, playStreakContinue, 
  playLevelUp, playPowerUp, playError, playPlacement
} from './audio';
import { getStats, saveStats, getRecord, saveRecord, getLeaderboard, saveToLeaderboard, saveGame, clearAutoSave, exportSaveData, importSaveData } from './storage';
import { checkAchievements, getAchievementById, ACHIEVEMENTS } from './achievements';
import { DIFFICULTIES, GAME_MODES, PUZZLES, VERSION, MAX_HISTORY, TIME_ATTACK_DURATION, AUTO_SOLVE_INTERVAL, PARTICLE_COUNT, TOAST_DURATION, HINT_DURATION, CONFETTI_DURATION, AUTO_SAVE_INTERVAL } from './config';
import { 
  calculateXP, calculateLevel, getProgressToNextLevel, POWER_UPS, getDailyChallenge, 
  hasCompletedDailyChallenge, completeDailyChallenge, calculateStreakBonus, calculateComboBonus, 
  calculateMoveEfficiency, calculateTimeBonus, generateShareResult, copyToClipboard, 
  hasSeenTutorial, markTutorialAsSeen, TUTORIAL_STEPS, THEMES, getCurrentTheme, setTheme, 
  getUnlockedThemes, canUsePowerUp, markPowerUpUsed, getStreakLevel, getComboLevel 
} from './features';
import { applyPowerUpEffect, ActivePowerUp } from './powerUpSystem';
import { getDailyRewards, getLoginStreak, claimDailyReward, loadQuestProgress, saveQuestProgress } from './gameSystems';

type Screen = 'menu' | 'game' | 'stats' | 'achievements' | 'tutorial' | 'daily' | 'powerups' | 'themes' | 'settings' | 'quests' | 'leaderboard' | 'minigames';
type DifficultyKey = keyof typeof DIFFICULTIES;
type GameModeKey = keyof typeof GAME_MODES;

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyKey>('medium');
  const [gameMode, setGameMode] = useState<GameModeKey>('classic');
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardAmount, setDailyRewardAmount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loginStreak = getLoginStreak();
    const rewards = getDailyRewards();
    const rewardIndex = loginStreak % 7;
    const reward = rewards[rewardIndex];
    const lastClaimed = localStorage.getItem('lastDailyReward');
    const today = new Date().toDateString();
    if (lastClaimed !== today && reward) {
      setDailyRewardAmount(reward.reward);
      setShowDailyReward(true);
    }
  }, []);

  const handleClaimDailyReward = () => {
    const result = claimDailyReward();
    if (result.success) {
      const stats = getStats();
      saveStats({ ...stats, totalXP: (stats.totalXP || 0) + result.reward });
      localStorage.setItem('lastDailyReward', new Date().toDateString());
    }
    setShowDailyReward(false);
  };

  if (screen === 'game') {
    return <Game url={url} name={name} difficulty={difficulty} gameMode={gameMode} onBack={() => setScreen('menu')} />;
  }

  if (screen === 'stats') return <StatsScreen onBack={() => setScreen('menu')} />;
  if (screen === 'achievements') return <AchievementsScreen onBack={() => setScreen('menu')} />;
  if (screen === 'tutorial') return <TutorialScreen onBack={() => setScreen('menu')} />;
  if (screen === 'daily') return <DailyChallengeScreen onBack={() => setScreen('menu')} onStart={(url, name, difficulty) => {
    setUrl(url);
    setName(name);
    setDifficulty(difficulty as DifficultyKey);
    setScreen('game');
  }} />;
  if (screen === 'powerups') return <PowerUpsScreen onBack={() => setScreen('menu')} />;
  if (screen === 'themes') return <ThemesScreen onBack={() => setScreen('menu')} />;
  if (screen === 'settings') return <SettingsScreen onBack={() => setScreen('menu')} />;
  if (screen === 'quests') return <QuestsScreen onBack={() => setScreen('menu')} />;
  if (screen === 'leaderboard') return <LeaderboardScreen onBack={() => setScreen('menu')} />;
  if (screen === 'minigames') return <MiniGamesScreen onBack={() => setScreen('menu')} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {showDailyReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl p-8 max-w-md w-full text-center border-2 border-yellow-400/50 shadow-2xl animate-bounce-in animate-glow">
            <div className="text-8xl mb-4 animate-float">🎁</div>
            <h2 className="text-3xl font-black text-white mb-2 animate-pop-in">پاداش روزانه!</h2>
            <p className="text-yellow-200 text-lg mb-6">روز {getLoginStreak() + 1} ورود متوالی</p>
            <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-yellow-400/30 animate-scale-in">
              <div className="text-5xl font-black text-yellow-300 mb-2 animate-pulse">+{dailyRewardAmount}</div>
              <div className="text-yellow-200">XP</div>
            </div>
            <button 
              onClick={handleClaimDailyReward} 
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg animate-glow"
            >
              🎉 دریافت پاداش
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="text-7xl mb-4 animate-float animate-glow">🧩</div>
        <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 mb-3 animate-pop-in">
          Puzzle Master
        </h1>
        <p className="text-xl text-purple-200 mb-2 animate-fade-in">پازل جیگساو حرفه‌ای</p>
        <p className="text-sm text-purple-300/60 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>لذت ببر • آرامش داشته باش • چالش کن</p>

        {/* Difficulty Selection */}
        <div className="mb-8">
          <h3 className="text-white font-bold mb-3 text-lg">سطح دشواری</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(DIFFICULTIES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setDifficulty(key as DifficultyKey)}
                className={`px-6 py-3 rounded-xl font-bold transition-all card-hover ${
                  difficulty === key
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="text-2xl mr-2">{val.emoji}</span>
                {val.label}
                <span className="block text-xs mt-1 opacity-70">{val.total} تکه</span>
              </button>
            ))}
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="mb-8">
          <h3 className="text-white font-bold mb-3 text-lg">حالت بازی</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(GAME_MODES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setGameMode(key as GameModeKey)}
                className={`px-6 py-3 rounded-xl font-bold transition-all card-hover ${
                  gameMode === key
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white scale-105 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="text-2xl mr-2">{val.emoji}</span>
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div onClick={() => fileRef.current?.click()} className="max-w-lg mx-auto cursor-pointer group mb-8">
          <div className="bg-white/5 border-2 border-dashed border-white/30 hover:border-yellow-400 rounded-3xl p-8 transition-all group-hover:bg-white/10 group-hover:scale-105">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📸</div>
            <h3 className="text-xl font-bold text-white mb-2">عکس خودت رو آپلود کن</h3>
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white font-bold">
              انتخاب فایل ↑
            </div>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) {
              const objectUrl = URL.createObjectURL(f);
              setUrl(objectUrl);
              setName(f.name);
              setScreen('game');
            }
          }}
        />

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-white/30"></div>
          <span className="text-white/60 text-sm">یا از پازل‌های آماده</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-white/30"></div>
        </div>

        {/* Puzzle Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {PUZZLES.map(p => {
            const rec = getRecord(p.name);
            return (
              <div
                key={p.id}
                onClick={() => {
                  setUrl(p.url);
                  setName(p.name);
                  setScreen('game');
                }}
                className="cursor-pointer group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 relative card-hover"
              >
                <div className="aspect-[4/3] relative">
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold text-white ${
                      p.diff === 'آسان' ? 'bg-green-500/80' : p.diff === 'متوسط' ? 'bg-yellow-500/80' : 'bg-red-500/80'
                    }`}>
                      {p.diff}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span>
                      <span className="text-white font-bold text-sm">{p.name}</span>
                    </div>
                    {rec && (
                      <div className="mt-1">
                        <span className="text-xs text-green-300 bg-green-500/20 px-1.5 py-0.5 rounded-full">
                          🏆 {formatTime(rec.time)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-4xl mx-auto">
          <button onClick={() => setScreen('daily')} className="card-hover px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-xl text-white font-bold shadow-lg">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm">چالش روزانه</div>
          </button>
          <button onClick={() => setScreen('quests')} className="card-hover px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 rounded-xl text-white font-bold shadow-lg">
            <div className="text-2xl mb-1">📜</div>
            <div className="text-sm">ماموریت‌ها</div>
          </button>
          <button onClick={() => setScreen('leaderboard')} className="card-hover px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl text-white font-bold shadow-lg">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-sm">جدول امتیازات</div>
          </button>
          <button onClick={() => setScreen('minigames')} className="card-hover px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-xl text-white font-bold shadow-lg">
            <div className="text-2xl mb-1">🎮</div>
            <div className="text-sm">بازی‌های کوچک</div>
          </button>
          <button onClick={() => setScreen('powerups')} className="card-hover px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 rounded-xl text-white font-bold shadow-lg">
            <div className="text-2xl mb-1">✨</div>
            <div className="text-sm">Power-ups</div>
          </button>
          <button onClick={() => setScreen('themes')} className="card-hover px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl text-white font-bold shadow-lg">
            <div className="text-2xl mb-1">🎨</div>
            <div className="text-sm">تم‌ها</div>
          </button>
          <button onClick={() => setScreen('stats')} className="card-hover px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm">آمار</div>
          </button>
          <button onClick={() => setScreen('achievements')} className="card-hover px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold">
            <div className="text-2xl mb-1">🏅</div>
            <div className="text-sm">Achievements</div>
          </button>
          <button onClick={() => setScreen('tutorial')} className="card-hover px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold">
            <div className="text-2xl mb-1">📖</div>
            <div className="text-sm">آموزش</div>
          </button>
          <button onClick={() => setScreen('settings')} className="card-hover px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold">
            <div className="text-2xl mb-1">⚙️</div>
            <div className="text-sm">تنظیمات</div>
          </button>
          <button onClick={() => {
            const stats = getStats();
            const text = generateShareResult('پازل', 0, 0, calculateLevel(stats.totalXP || 0), stats.totalXP || 0);
            if (copyToClipboard(text)) {
              alert('✅ اطلاعات کپی شد!');
            }
          }} className="card-hover px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-xl text-white font-bold shadow-lg">
            <div className="text-2xl mb-1">📤</div>
            <div className="text-sm">اشتراک‌گذاری</div>
          </button>
        </div>

        <div className="text-purple-400/60 text-sm">ساخته شده با ❤️ | Puzzle Master v{VERSION}</div>
      </div>
    </div>
  );
}

// ============= GAME COMPONENT =============
function Game({ url, name, difficulty, gameMode, onBack }: { url: string; name: string; difficulty: DifficultyKey; gameMode: GameModeKey; onBack: () => void }) {
  const config = DIFFICULTIES[difficulty];
  
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [edges, setEdges] = useState<Edges | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(gameMode === 'timeAttack' ? TIME_ATTACK_DURATION : 0);
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState(false);
  const [hint, setHint] = useState<number | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showThumb, setShowThumb] = useState(true);
  const [history, setHistory] = useState<Piece[][]>([]);
  const [redoStack, setRedoStack] = useState<Piece[][]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastPlacedId, setLastPlacedId] = useState<number | null>(null);
  const [dragPiece, setDragPiece] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverPiece, setHoverPiece] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [activePowerUps, setActivePowerUps] = useState<Array<{id: string, expiresAt: number}>>([]);
  const [showPowerUpMenu, setShowPowerUpMenu] = useState(false);
  const [purchasedPowerUps, setPurchasedPowerUps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('purchasedPowerUps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showComboEffect, setShowComboEffect] = useState(false);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const timerRef = useRef<any>(null);
  const [cw, setCw] = useState(800);
  const isDragging = useRef(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragPieceId = useRef<number | null>(null);

  // Load image
  useEffect(() => {
    setImageLoading(true);
    let cancelled = false;
    const i = new Image();
    
    if (url.startsWith('blob:')) {
      i.onload = () => { if (!cancelled) { setImg(i); setImageLoading(false); } };
      i.onerror = () => { if (!cancelled) setImageLoading(false); };
      i.src = url;
    } else {
      i.crossOrigin = 'anonymous';
      i.onload = () => { if (!cancelled) { setImg(i); setImageLoading(false); } };
      i.onerror = () => {
        if (cancelled) return;
        const i2 = new Image();
        i2.onload = () => { if (!cancelled) { setImg(i2); setImageLoading(false); } };
        i2.onerror = () => { if (!cancelled) setImageLoading(false); };
        i2.src = url;
      };
      i.src = url;
    }
    
    return () => { cancelled = true; };
  }, [url]);

  // Initialize puzzle
  useEffect(() => {
    if (img) {
      setEdges(genEdges(config.cols, config.rows));
      setPieces(createPieces(config.cols, config.rows));
      setTime(gameMode === 'timeAttack' ? TIME_ATTACK_DURATION : 0);
      setMoves(0);
      setSel(null);
      setDone(false);
      setHistory([]);
      setRedoStack([]);
      setStreak(0);
      setBestStreak(0);
      setCombo(0);
      setMaxCombo(0);
      setPaused(false);
      setConfetti(false);
      setToast(null);
      setHint(null);
      setDragPiece(null);
      setDragPos(null);
      setHoverPiece(null);
      setParticles([]);
      setLastPlacedId(null);
    }
  }, [img, config.cols, config.rows, gameMode]);

  // Resize
  useEffect(() => {
    let timeoutId: any;
    const resize = () => {
      if (containerRef.current) {
        setCw(Math.min(containerRef.current.clientWidth - 20, 850));
      }
    };
    
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(resize, 100);
    };
    
    resize();
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (!done && !paused && gameMode !== 'zen') {
      if (gameMode === 'timeAttack') {
        timerRef.current = setInterval(() => {
          setTime(t => {
            if (t <= 11 && t > 0 && soundOn) playTimeWarning();
            if (t <= 1) { 
              setDone(true); 
              return 0; 
            }
            return t - 1;
          });
        }, 1000);
      } else {
        timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [done, paused, gameMode, soundOn]);

  // Check completion
  useEffect(() => {
    if (pieces.length > 0 && isPuzzleComplete(pieces) && !done) {
      setDone(true);
      setConfetti(true);
      if (soundOn) playWin();

      const finalTime = gameMode === 'timeAttack' ? TIME_ATTACK_DURATION - time : time;
      const isNewRecord = saveRecord(name, finalTime, moves, bestStreak, maxCombo);

      const stats = getStats();
      const earnedXP = calculateXP(moves, finalTime, bestStreak, maxCombo);
      const streakBonus = calculateStreakBonus(bestStreak);
      const comboBonus = calculateComboBonus(maxCombo);
      const timeBonus = calculateTimeBonus(finalTime, pieces.length);
      const totalEarnedXP = earnedXP + streakBonus + comboBonus + timeBonus;
      const efficiency = calculateMoveEfficiency(moves, pieces.length);

      const oldLevel = calculateLevel(stats.totalXP || 0);
      const newTotalXP = (stats.totalXP || 0) + totalEarnedXP;
      const newLevel = calculateLevel(newTotalXP);

      saveStats({
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        totalMoves: stats.totalMoves + moves,
        bestStreak: Math.max(stats.bestStreak, bestStreak),
        maxCombo: Math.max(stats.maxCombo, maxCombo),
        totalCorrect: stats.totalCorrect + pieces.length,
        totalXP: newTotalXP,
        totalTime: (stats.totalTime || 0) + finalTime,
        bestEfficiency: Math.max(stats.bestEfficiency || 0, efficiency)
      });

      // Level up sound
      if (newLevel > oldLevel && soundOn) {
        playLevelUp();
        setToast(`🎉 سطح ${newLevel}!`);
        setTimeout(() => setToast(null), TOAST_DURATION);
      }

      const score = Math.round((10000 / Math.max(1, finalTime)) * (100 / Math.max(1, moves)));
      saveToLeaderboard({ name: 'Player', score, date: new Date().toISOString(), puzzle: name });
      clearAutoSave();

      const loginStreak = getLoginStreak();
      const result = checkAchievements(
        stats.gamesPlayed + 1, 
        finalTime, 
        moves, 
        bestStreak, 
        maxCombo, 
        String(gameMode), 
        String(difficulty),
        newTotalXP,
        loginStreak
      );
      
      if (result.newlyUnlocked.length > 0) {
        if (soundOn) playAchievement();
        const achievementNames = result.newlyUnlocked.map(id => {
          const ach = ACHIEVEMENTS.find(a => a.id === id);
          return ach ? `${ach.emoji} ${ach.title}` : id;
        }).join(', ');
        setToast(`🏆 ${result.newlyUnlocked.length} Achievement جدید: ${achievementNames}`);
        setTimeout(() => setToast(null), TOAST_DURATION * 2);
      }

      if (isNewRecord) {
        setToast('🎉 رکورد جدید!');
        setTimeout(() => setToast(null), TOAST_DURATION);
      }

      setTimeout(() => setConfetti(false), CONFETTI_DURATION);
    }
  }, [pieces, done, soundOn, time, moves, bestStreak, maxCombo, gameMode, difficulty, name]);

  // Particles
  useEffect(() => {
    if (particles.length === 0) return;
    
    let animationFrame: number;
    const animate = () => {
      setParticles(prev => 
        prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, life: p.life - 1 }))
          .filter(p => p.life > 0)
      );
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [particles.length]);

  // Auto-save
  useEffect(() => {
    if (pieces.length > 0 && !done && moves > 0) {
      const interval = setInterval(() => {
        saveGame({
          puzzleName: name,
          pieces: pieces.map(p => ({ ...p })),
          moves,
          time,
          date: new Date().toISOString()
        });
      }, AUTO_SAVE_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [pieces, moves, time, done, name]);

  // Dimensions
  const dims = useMemo(() => {
    if (!img) return null;
    const ia = img.width / img.height;
    const pw = cw / (config.cols + 0.5);
    const ph = pw / ia;
    const ext = pw * 0.22;
    return { pw, ph, ext, sw: config.cols * pw + ext * 2, sh: config.rows * ph + ext * 2 };
  }, [img, cw, config.cols, config.rows]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  const spawnParticles = useCallback((x: number, y: number, count = PARTICLE_COUNT, type: 'normal' | 'celebration' | 'streak' = 'normal') => {
    const np: Particle[] = [];
    
    const colors = {
      normal: ['#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#a78bfa'],
      celebration: ['#fbbf24', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'],
      streak: ['#ef4444', '#f97316', '#fbbf24', '#f59e0b']
    };
    
    const selectedColors = colors[type];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = type === 'celebration' ? 8 + Math.random() * 4 : 5 + Math.random() * 3;
      
      np.push({
        id: Date.now() + i + Math.random(),
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'celebration' ? 6 : 4),
        life: type === 'celebration' ? 60 + Math.random() * 30 : 40 + Math.random() * 20,
        color: selectedColors[Math.floor(Math.random() * selectedColors.length)],
        size: type === 'celebration' ? 3 + Math.random() * 6 : 2 + Math.random() * 5
      });
    }
    setParticles(prev => [...prev, ...np]);
  }, []);

  const handleSwap = useCallback((id1: number, id2: number) => {
    setHistory(prev => [...prev.slice(-MAX_HISTORY), pieces.map(x => ({ ...x }))]);
    setRedoStack([]);
    const newPieces = swapPieces(pieces, id1, id2);
    setPieces(newPieces);
    setMoves(m => m + 1);

    const p1 = newPieces.find(p => p.id === id1)!;
    const p2 = newPieces.find(p => p.id === id2)!;
    const p1ok = isPieceCorrect(p1);
    const p2ok = isPieceCorrect(p2);

    if (p1ok || p2ok) {
      // افزایش streak
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(b => Math.max(b, newStreak));
      
      // افزایش combo
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      
      // پخش صداها
      if (soundOn) {
        if (newStreak > 1) playStreakContinue();
        if (newCombo >= 3) playComboLevel(newCombo);
        if (combo < 3) playCorrect();
      }
      
      // نمایش پیام برای streak های بالا
      if (newStreak >= 3) {
        const streakInfo = getStreakLevel(newStreak);
        setToast(`${streakInfo.emoji} Streak ${newStreak}! ${streakInfo.level}`);
        setTimeout(() => setToast(null), TOAST_DURATION);
      }
      
      // نمایش پیام برای combo های بالا با افکت‌های ویژه
      if (newCombo >= 3) {
        const comboInfo = getComboLevel(newCombo);
        setToast(`${comboInfo.emoji} Combo x${newCombo}! ${comboInfo.level}`);
        setTimeout(() => setToast(null), TOAST_DURATION);
        
        // افکت‌های بصری ویژه برای combo های بالا
        if (newCombo >= 5) {
          // ایجاد ذرات بیشتر برای combo های بالا
          if (dims) {
            const centerX = (dims.sw / 2);
            const centerY = (dims.sh / 2);
            spawnParticles(centerX, centerY, 30 + (newCombo * 5), 'celebration');
          }
        }
      }
      
      // افکت‌های بصری
      if (p1ok && dims) {
        setLastPlacedId(p1.id);
        const particleCount = 25 + (newStreak * 2) + (newCombo * 3);
        spawnParticles(p1.c * dims.pw + dims.ext + dims.pw / 2, p1.r * dims.ph + dims.ext + dims.ph / 2, particleCount, 'celebration');
        if (soundOn) playPlacement();
      }
      if (p2ok && dims) {
        setLastPlacedId(p2.id);
        const particleCount = 25 + (newStreak * 2) + (newCombo * 3);
        spawnParticles(p2.c * dims.pw + dims.ext + dims.pw / 2, p2.r * dims.ph + dims.ext + dims.ph / 2, particleCount, 'celebration');
        if (soundOn) playPlacement();
      }
      setTimeout(() => setLastPlacedId(null), 800);
    } else {
      // قطع streak و combo
      if (streak > 0 && soundOn) playStreakBreak();
      if (streak >= 5) {
        setToast('💔 Streak قطع شد!');
        setTimeout(() => setToast(null), TOAST_DURATION);
      }
      setStreak(0);
      setCombo(0);
      if (soundOn) playSwap();
    }
  }, [pieces, soundOn, dims, spawnParticles, combo, streak]);

  const handlePieceClick = useCallback((pieceId: number) => {
    if (done || isDragging.current) return;
    if (sel === null) {
      setSel(pieceId);
      if (soundOn) playClick();
    } else if (sel === pieceId) {
      setSel(null);
    } else {
      handleSwap(sel, pieceId);
      setSel(null);
    }
  }, [sel, done, soundOn, handleSwap]);

  const handleDragStart = (e: React.PointerEvent, pieceId: number) => {
    if (done) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragPieceId.current = pieceId;
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (dragPieceId.current === null || !dragStartPos.current || !dims || !svgRef.current) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isDragging.current = true;
      setDragPiece(dragPieceId.current);
      if (soundOn) playSelect();
    }
    if (isDragging.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = dims.sw / rect.width;
      const scaleY = dims.sh / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setDragPos({ x, y });
      const { pw, ph, ext } = dims;
      let found: number | null = null;
      for (const p of pieces) {
        const px = p.c * pw + ext;
        const py = p.r * ph + ext;
        if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
          found = p.id;
          break;
        }
      }
      setHoverPiece(found);
    }
  };

  const handleDragEnd = () => {
    const pieceId = dragPieceId.current;
    if (isDragging.current && dragPiece !== null && hoverPiece !== null && hoverPiece !== dragPiece) {
      handleSwap(dragPiece, hoverPiece);
    } else if (!isDragging.current && pieceId !== null) {
      handlePieceClick(pieceId);
    }
    setDragPiece(null);
    setDragPos(null);
    setHoverPiece(null);
    isDragging.current = false;
    dragStartPos.current = null;
    dragPieceId.current = null;
  };

  const reset = () => {
    setEdges(genEdges(config.cols, config.rows));
    setPieces(createPieces(config.cols, config.rows));
    setTime(gameMode === 'timeAttack' ? TIME_ATTACK_DURATION : 0);
    setMoves(0);
    setSel(null);
    setDone(false);
    setConfetti(false);
    setHistory([]);
    setRedoStack([]);
    setStreak(0);
    setBestStreak(0);
    setCombo(0);
    setMaxCombo(0);
    setPaused(false);
    setToast(null);
    setHint(null);
    setDragPiece(null);
    setDragPos(null);
    setHoverPiece(null);
    setParticles([]);
    setLastPlacedId(null);
    setShowComboEffect(false);
  };

  // Combo Visual Effect
  useEffect(() => {
    if (combo >= 5) {
      setShowComboEffect(true);
      
      // Clear previous timer
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
      
      // Hide after 2 seconds
      comboTimerRef.current = setTimeout(() => {
        setShowComboEffect(false);
      }, 2000);
    } else {
      setShowComboEffect(false);
    }
    
    return () => {
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
    };
  }, [combo]);

  const doHint = () => {
    const w = pieces.filter(p => !isPieceCorrect(p));
    if (w.length) {
      const rp = w[Math.floor(Math.random() * w.length)];
      setHint(rp.id);
      setTimeout(() => setHint(null), HINT_DURATION);
      if (soundOn) playHint();
      showToast('💡 راهنما فعال شد!');
    } else {
      showToast('✅ همه تکه‌ها درست قرار گرفتند!');
    }
  };

  const undo = () => {
    if (history.length > 0) {
      setRedoStack(r => [...r, pieces]);
      setPieces(history[history.length - 1]);
      setHistory(h => h.slice(0, -1));
      setMoves(m => Math.max(0, m - 1));
      setStreak(0);
      setCombo(0);
      if (soundOn) playUndo();
      showToast('↩️ حرکت برگردانده شد');
    } else {
      showToast('❌ حرکتی برای برگشت وجود ندارد');
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      setHistory(h => [...h, pieces]);
      setPieces(redoStack[redoStack.length - 1]);
      setRedoStack(r => r.slice(0, -1));
      setMoves(m => m + 1);
      if (soundOn) beep(400, 0.1, 'sine', 0.05);
      showToast('↪️ حرکت دوباره انجام شد');
    } else {
      showToast('❌ حرکتی برای تکرار وجود ندارد');
    }
  };

  // Power-up usage
  const usePowerUp = (powerUpId: string) => {
    if (!purchasedPowerUps.includes(powerUpId)) {
      showToast('❌ این Power-up را ندارید!');
      return;
    }

    let success = false;

    switch (powerUpId) {
      case 'auto_place':
        const incorrectPieces = pieces.filter(p => !isPieceCorrect(p));
        if (incorrectPieces.length > 0) {
          const randomPiece = incorrectPieces[Math.floor(Math.random() * incorrectPieces.length)];
          const newPieces = pieces.map(p => {
            if (p.id === randomPiece.id) {
              return { ...p, r: p.cr, c: p.cc };
            }
            return p;
          });
          setPieces(newPieces);
          showToast('✨ یک تکه به صورت خودکار قرار گرفت!');
          if (soundOn) playPowerUp();
          success = true;
        } else {
          showToast('⚠️ همه تکه‌ها درست هستند!');
        }
        break;

      case 'auto_solve':
        const unsolvedPieces = pieces.filter(p => !isPieceCorrect(p));
        const toSolve = unsolvedPieces.slice(0, 5);
        if (toSolve.length > 0) {
          const newPieces = pieces.map(p => {
            if (toSolve.find(tp => tp.id === p.id)) {
              return { ...p, r: p.cr, c: p.cc };
            }
            return p;
          });
          setPieces(newPieces);
          showToast(`🤖 ${toSolve.length} تکه به صورت خودکار حل شد!`);
          if (soundOn) playPowerUp();
          success = true;
        } else {
          showToast('⚠️ همه تکه‌ها درست هستند!');
        }
        break;

      case 'time_bonus':
        if (gameMode === 'timeAttack') {
          setTime(time + 30);
          showToast('⏰ 30 ثانیه به زمان اضافه شد!');
          if (soundOn) playPowerUp();
          success = true;
        } else {
          showToast('⚠️ فقط در حالت حمله زمانی قابل استفاده است!');
        }
        break;

      case 'hint_master':
        doHint();
        showToast('🎓 راهنمای رایگان استفاده شد!');
        success = true;
        break;

      default:
        showToast('⚠️ این Power-up هنوز پیاده‌سازی نشده!');
    }

    if (success) {
      // Remove from purchased power-ups
      const newPurchased = purchasedPowerUps.filter(id => id !== powerUpId);
      setPurchasedPowerUps(newPurchased);
      
      // Save to localStorage
      try {
        localStorage.setItem('purchasedPowerUps', JSON.stringify(newPurchased));
      } catch {}
    }

    setShowPowerUpMenu(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (done) return;
      switch (e.key.toLowerCase()) {
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
        case 'h':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            doHint();
          }
          break;
        case 'p':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setPreview(prev => !prev);
          }
          break;
        case 'escape':
          if (preview) setPreview(false);
          else if (sel !== null) setSel(null);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, preview, sel]);

  const ok = getCorrectCount(pieces);
  const prog = calculateProgress(pieces);
  const record = getRecord(name);

  if (!img || !edges || !dims || imageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          {url && (
            <div className="mb-6 max-w-xs mx-auto">
              <img src={url} alt="Loading..." className="w-full h-auto rounded-xl shadow-2xl border-2 border-white/20 opacity-50" style={{ maxHeight: '200px', objectFit: 'contain' }} />
            </div>
          )}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-400/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg font-bold">در حال آماده‌سازی...</p>
          <p className="text-purple-300 text-sm mt-2">{config.total} تکه جیگساو 🧩</p>
        </div>
      </div>
    );
  }

  const { pw, ph, ext, sw, sh } = dims;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-2 md:p-4">
      {confetti && <Confetti />}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl toast-enter animate-glow">
          {toast}
        </div>
      )}

      {/* Combo Visual Effect */}
      {showComboEffect && combo >= 5 && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 animate-combo-effect">
            x{combo}
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {preview && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setPreview(false)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img 
              src={url} 
              alt="Preview" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl border-4 border-white/30" 
            />
            <div className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-full text-white font-bold">
              👁️ پیش‌نمایش تصویر اصلی
            </div>
            <button 
              onClick={() => setPreview(false)}
              className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full text-white text-2xl font-bold transition-all"
            >
              ×
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white text-sm">
              برای بستن کلیک کنید
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/10">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all">→ بازگشت</button>
            <h2 className="text-white font-bold truncate max-w-[120px] md:max-w-none text-sm md:text-base">{name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
              <span className="text-yellow-300 text-xs">⏱️</span>
              <span className="text-white font-mono text-xs">{formatTime(time)}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
              <span className="text-blue-300 text-xs">🔄</span>
              <span className="text-white font-mono text-xs">{moves}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
              <span className="text-green-300 text-xs">✅</span>
              <span className="text-white font-mono text-xs">{ok}/{config.total}</span>
            </div>
            {streak >= 2 && (() => {
              const streakInfo = getStreakLevel(streak);
              return (
                <div className={`flex items-center gap-1 bg-gradient-to-r ${streakInfo.color} rounded-lg px-3 py-1.5 border border-white/30 shadow-lg ${streak >= 10 ? 'animate-pulse' : ''}`}>
                  <span className="text-lg animate-float">{streakInfo.emoji}</span>
                  <span className="text-white font-mono text-sm font-bold">{streak}</span>
                  {streak >= 5 && <span className="text-white text-xs font-bold">{streakInfo.level}</span>}
                </div>
              );
            })()}
            {combo >= 3 && (() => {
              const comboInfo = getComboLevel(combo);
              return (
                <div className={`flex items-center gap-1 bg-gradient-to-r ${comboInfo.color} rounded-lg px-3 py-1.5 border border-white/30 shadow-lg ${combo >= 10 ? 'animate-pulse' : ''}`}>
                  <span className="text-lg animate-float">{comboInfo.emoji}</span>
                  <span className="text-white font-mono text-sm font-bold">x{combo}</span>
                  {combo >= 5 && <span className="text-white text-xs font-bold">{comboInfo.level}</span>}
                </div>
              );
            })()}
            <button 
              onClick={() => setPreview(true)}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs transition-all"
              title="پیش‌نمایش (P)"
            >
              👁️
            </button>
            <button 
              onClick={() => setShowThumb(!showThumb)} 
              className={`px-2 py-1 rounded-lg text-white text-xs transition-all ${showThumb ? 'bg-purple-500' : 'bg-white/10'}`}
              title={showThumb ? 'مخفی کردن thumbnail' : 'نمایش thumbnail'}
            >
              🖼️
            </button>
            <button 
              onClick={() => setShowGrid(!showGrid)} 
              className={`px-2 py-1 rounded-lg text-white text-xs transition-all ${showGrid ? 'bg-blue-500/80' : 'bg-white/10'}`}
              title={showGrid ? 'مخفی کردن grid' : 'نمایش grid'}
            >
              ⊞
            </button>
            <button 
              onClick={undo} 
              disabled={history.length === 0} 
              className={`px-2 py-1 rounded-lg text-white text-xs transition-all card-hover ${history.length > 0 ? 'bg-blue-500/80 hover:bg-blue-500' : 'bg-white/5 opacity-50 cursor-not-allowed'}`}
              title="برگشت (Ctrl+Z)"
            >
              ↩️
            </button>
            <button 
              onClick={redo} 
              disabled={redoStack.length === 0} 
              className={`px-2 py-1 rounded-lg text-white text-xs transition-all card-hover ${redoStack.length > 0 ? 'bg-purple-500/80 hover:bg-purple-500' : 'bg-white/5 opacity-50 cursor-not-allowed'}`}
              title="بازگشت (Ctrl+Y)"
            >
              ↪️
            </button>
            <button 
              onClick={doHint} 
              className="px-2 py-1 bg-amber-500/80 hover:bg-amber-500 rounded-lg text-white text-xs transition-all card-hover"
              title="راهنما (H)"
            >
              💡
            </button>
            {gameMode === 'timeAttack' && (
              <button 
                onClick={() => setPaused(!paused)} 
                className={`px-2 py-1 rounded-lg text-white text-xs transition-all ${paused ? 'bg-yellow-500/80 hover:bg-yellow-500' : 'bg-white/10 hover:bg-white/20'}`}
                title={paused ? 'ادامه' : 'توقف'}
              >
                {paused ? '▶️' : '⏸️'}
              </button>
            )}
            <button 
              onClick={() => setSoundOn(!soundOn)} 
              className={`px-2 py-1 rounded-lg text-white text-xs transition-all card-hover ${soundOn ? 'bg-green-500/80 hover:bg-green-500' : 'bg-white/10 hover:bg-white/20'}`}
              title={soundOn ? 'قطع صدا' : 'فعال کردن صدا'}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button 
              onClick={reset} 
              className="px-2 py-1 bg-red-500/80 hover:bg-red-500 rounded-lg text-white text-xs transition-all card-hover"
              title="شروع مجدد"
            >
              🔄
            </button>
            <button 
              onClick={() => setShowPowerUpMenu(true)} 
              className="px-2 py-1 bg-purple-500/80 hover:bg-purple-500 rounded-lg text-white text-xs transition-all card-hover relative"
              title="Power-ups"
            >
              ⚡
              {purchasedPowerUps.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {purchasedPowerUps.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Power-up Menu Modal */}
        {showPowerUpMenu && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowPowerUpMenu(false)}>
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 max-w-md w-full border-2 border-purple-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">⚡ Power-ups</h3>
                <button onClick={() => setShowPowerUpMenu(false)} className="text-white hover:text-red-400 text-2xl">×</button>
              </div>
              
              {purchasedPowerUps.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-purple-200">هیچ Power-upی ندارید!</p>
                  <p className="text-purple-300 text-sm mt-2">از فروشگاه Power-up خریداری کنید</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {purchasedPowerUps.map((powerUpId, index) => {
                    const powerUp = POWER_UPS.find(p => p.id === powerUpId);
                    if (!powerUp) return null;
                    
                    return (
                      <div key={index} className="bg-white/10 rounded-xl p-4 border border-white/20 hover:border-purple-400/50 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{powerUp.emoji}</div>
                            <div>
                              <div className="text-white font-bold">{powerUp.name}</div>
                              <div className="text-purple-200 text-sm">{powerUp.desc}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => usePowerUp(powerUpId)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-lg text-white text-sm font-bold transition-all"
                          >
                            استفاده
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-2 bg-black/30 rounded-full p-1 border border-white/10">
          <div className="flex items-center gap-3 px-3">
            <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full relative overflow-hidden progress-fill" 
                style={{ 
                  width: `${prog}%`, 
                  background: prog === 100 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b)' 
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <span className={`text-white font-bold text-sm min-w-[2.5rem] text-left ${prog === 100 ? 'animate-pop-in text-green-300' : ''}`}>
              {prog}%
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex justify-center">
        <div ref={containerRef} className="w-full relative" style={{ maxWidth: '900px' }}>
          {showThumb && (
            <div 
              className="absolute top-0 left-0 w-16 h-16 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl bg-black/70 backdrop-blur-md hover:scale-110 transition-transform cursor-pointer z-40 m-2"
              onClick={() => setPreview(true)}
              title="کلیک برای پیش‌نمایش کامل"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-1 right-1 bg-black/70 rounded-full p-1">
                <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          )}

          <div className="bg-black/40 rounded-xl border-2 border-white/20 overflow-hidden shadow-2xl p-2 mt-28 md:mt-32">
            <svg
              ref={svgRef}
              width="100%"
              viewBox={`0 0 ${sw} ${sh}`}
              style={{ aspectRatio: `${sw}/${sh}`, touchAction: 'none' }}
              className={dragPiece !== null ? 'cursor-grabbing' : 'cursor-grab'}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerLeave={handleDragEnd}
            >
              <defs>
                {pieces.map(p => {
                  const shape = getShape(p.cr, p.cc, edges, config.cols, config.rows);
                  return <clipPath key={`c-${p.id}`} id={`c-${p.id}`}><path d={generatePiecePath(pw, ph, shape)} /></clipPath>;
                })}
                <filter id="gy" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feFlood floodColor="#fbbf24" floodOpacity="0.8" result="c" />
                  <feComposite in="c" in2="b" operator="in" result="g" />
                  <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="gg" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.5" result="b" />
                  <feFlood floodColor="#34d399" floodOpacity="0.7" result="c" />
                  <feComposite in="c" in2="b" operator="in" result="g" />
                  <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.5" />
                </filter>
              </defs>

              <rect x={ext} y={ext} width={config.cols * pw} height={config.rows * ph} fill="rgba(0,0,0,0.3)" rx="2" />
              {showGrid && (
                <g opacity="0.08">
                  {Array.from({ length: config.cols + 1 }).map((_, i) => <line key={`v${i}`} x1={ext + i * pw} y1={ext} x2={ext + i * pw} y2={ext + config.rows * ph} stroke="white" strokeWidth="0.5" />)}
                  {Array.from({ length: config.rows + 1 }).map((_, i) => <line key={`h${i}`} x1={ext} y1={ext + i * ph} x2={ext + config.cols * pw} y2={ext + i * ph} stroke="white" strokeWidth="0.5" />)}
                </g>
              )}

              {pieces.map(p => {
                const shape = getShape(p.cr, p.cc, edges, config.cols, config.rows);
                const x = p.c * pw + ext;
                const y = p.r * ph + ext;
                const isSel = sel === p.id;
                const isHint = hint === p.id;
                const isOk = isPieceCorrect(p);
                const isDraggingThis = dragPiece === p.id;
                const isHover = hoverPiece === p.id && dragPiece !== null && dragPiece !== p.id;
                const isLastPlaced = lastPlacedId === p.id;

                if (isDraggingThis) return null;

                let sc = 'rgba(255,255,255,0.15)';
                let sw2 = 0.8;
                let f = '';
                if (isSel) { sc = '#fbbf24'; sw2 = 2.5; f = 'url(#gy)'; }
                else if (isHint) { sc = '#34d399'; sw2 = 2; f = 'url(#gg)'; }
                else if (isLastPlaced) { sc = '#34d399'; sw2 = 2; f = 'url(#gg)'; }
                else if (isOk && !done) { sc = 'rgba(52,211,153,0.35)'; sw2 = 1.2; }
                else if (isHover) { sc = 'rgba(251,191,36,0.5)'; sw2 = 1.8; }

                return (
                  <g 
                    key={p.id} 
                    transform={`translate(${x},${y})`} 
                    onPointerDown={e => handleDragStart(e, p.id)} 
                    style={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease'
                    }} 
                    filter={f} 
                    opacity={isHover ? 0.9 : 1}
                  >
                    <g clipPath={`url(#c-${p.id})`}>
                      <image href={url} x={-p.cc * pw} y={-p.cr * ph} width={config.cols * pw} height={config.rows * ph} preserveAspectRatio="none" />
                    </g>
                    <path 
                      d={generatePiecePath(pw, ph, shape)} 
                      fill="none" 
                      stroke={sc} 
                      strokeWidth={sw2} 
                      strokeLinejoin="round"
                      style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }}
                    />
                    {isOk && !done && (
                      <path 
                        d={generatePiecePath(pw, ph, shape)} 
                        fill="rgba(52,211,153,0.08)" 
                        stroke="none"
                        style={{ animation: 'pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                      />
                    )}
                  </g>
                );
              })}

              {dragPiece !== null && dragPos && (() => {
                const p = pieces.find(pc => pc.id === dragPiece);
                if (!p) return null;
                const shape = getShape(p.cr, p.cc, edges, config.cols, config.rows);
                return (
                  <g transform={`translate(${dragPos.x - pw / 2},${dragPos.y - ph / 2})`} filter="url(#ds)" opacity="0.9">
                    <g clipPath={`url(#c-${p.id})`}>
                      <image href={url} x={-p.cc * pw} y={-p.cr * ph} width={config.cols * pw} height={config.rows * ph} preserveAspectRatio="none" />
                    </g>
                    <path d={generatePiecePath(pw, ph, shape)} fill="none" stroke="#fbbf24" strokeWidth={2} strokeLinejoin="round" />
                  </g>
                );
              })()}

              {hint !== null && (() => {
                const hp = pieces.find(p => p.id === hint);
                if (!hp) return null;
                const shape = getShape(hp.cr, hp.cc, edges, config.cols, config.rows);
                return (
                  <g transform={`translate(${hp.cc * pw + ext},${hp.cr * ph + ext})`}>
                    <path d={generatePiecePath(pw, ph, shape)} fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth={1.5} strokeDasharray="6 3">
                      <animate attributeName="stroke-dashoffset" from="0" to="18" dur="1s" repeatCount="indefinite" />
                    </path>
                  </g>
                );
              })()}

              {particles.map(p => (
                <circle key={p.id} cx={p.x} cy={p.y} r={p.size * (p.life / 50)} fill={p.color} opacity={Math.min(1, p.life / 30)} />
              ))}
            </svg>
          </div>

          <div className="mt-2 text-center text-purple-400/40 text-[10px] hidden md:block">
            ⌨️ میانبرها: Ctrl+Z (برگشت) | Ctrl+Y (بازگشت) | H (راهنما) | P (پیش‌نمایش) | Esc (لغو انتخاب)
          </div>
        </div>
      </div>

      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-purple-800 via-indigo-800 to-pink-800 rounded-3xl p-6 md:p-8 max-w-md w-full text-center border border-white/20 shadow-2xl animate-bounce-in animate-glow">
            {gameMode === 'timeAttack' && time === 0 ? (
              <>
                <div className="text-7xl mb-4 animate-shake">⏰</div>
                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-2 animate-pop-in">وقت تمام شد!</h2>
                <p className="text-purple-200 text-lg mb-6 animate-fade-in">متأسفانه نتونستی پازل رو در زمان مشخص شده کامل کنی</p>
              </>
            ) : (
              <>
                <div className="text-7xl mb-4 animate-bounce-slow animate-glow">🏆</div>
                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200 mb-2 animate-pop-in">تبریک!</h2>
                <p className="text-purple-200 text-lg mb-6 animate-fade-in">پازل {config.total} تکه رو تکمیل کردی!</p>
              </>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 animate-scale-in card-hover" style={{ animationDelay: '0.1s' }}>
                <div className="text-yellow-300 text-2xl md:text-3xl font-black font-mono animate-pulse">{formatTime(gameMode === 'timeAttack' ? TIME_ATTACK_DURATION - time : time)}</div>
                <div className="text-purple-200 text-sm mt-1">⏱️ زمان</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 animate-scale-in card-hover" style={{ animationDelay: '0.2s' }}>
                <div className="text-blue-300 text-2xl md:text-3xl font-black font-mono animate-pulse">{moves}</div>
                <div className="text-purple-200 text-sm mt-1">🔄 حرکات</div>
              </div>
            </div>

            {bestStreak >= 3 && (() => {
              const streakInfo = getStreakLevel(bestStreak);
              const bonus = calculateStreakBonus(bestStreak);
              return (
                <div className={`bg-gradient-to-r ${streakInfo.color} rounded-xl p-4 mb-4 border-2 border-white/40 shadow-2xl animate-scale-in animate-glow`} style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl animate-float">{streakInfo.emoji}</span>
                        <div>
                          <div className="text-white text-lg font-bold">بهترین Streak: {bestStreak}</div>
                          <div className="text-white/90 text-sm font-semibold">{streakInfo.level}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-3xl font-black">+{bonus}</div>
                      <div className="text-white/80 text-xs">XP Bonus</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {maxCombo >= 3 && (() => {
              const comboInfo = getComboLevel(maxCombo);
              const bonus = calculateComboBonus(maxCombo);
              return (
                <div className={`bg-gradient-to-r ${comboInfo.color} rounded-xl p-4 mb-4 border-2 border-white/40 shadow-2xl animate-scale-in animate-glow`} style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl animate-float">{comboInfo.emoji}</span>
                        <div>
                          <div className="text-white text-lg font-bold">بیشترین Combo: x{maxCombo}</div>
                          <div className="text-white/90 text-sm font-semibold">{comboInfo.level}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-3xl font-black">+{bonus}</div>
                      <div className="text-white/80 text-xs">XP Bonus</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {record && (
              <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10 animate-scale-in" style={{ animationDelay: '0.5s' }}>
                <div className="text-purple-200 text-sm">🏆 رکورد قبلی: {formatTime(record.time)}</div>
                {(gameMode !== 'timeAttack' || time > 0) && (time < record.time || (time === record.time && moves < record.moves)) && (
                  <div className="text-green-300 text-sm font-bold mt-1 animate-pulse animate-glow">🎉 رکورد جدید!</div>
                )}
              </div>
            )}

            <div className="mb-6 animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <div className="text-3xl animate-float">{moves < 80 ? '⭐⭐⭐' : moves < 140 ? '⭐⭐' : '⭐'}</div>
              <p className="text-purple-300 text-sm mt-2 animate-fade-in">{moves < 80 ? 'فوق‌العاده! استاد پازل!' : moves < 140 ? 'عالی بود!' : 'آفرین!'}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={reset} 
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg animate-glow"
                style={{ animationDelay: '0.7s' }}
              >
                🔄 بازی مجدد
              </button>
              <button 
                onClick={onBack} 
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all border border-white/10 card-hover"
                style={{ animationDelay: '0.8s' }}
              >
                🏠 منوی اصلی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Confetti() {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0', '#10b981', '#fbbf24'];
  const pcs = Array.from({ length: 150 }, (_, i) => ({
    id: i, 
    x: Math.random() * 100, 
    c: colors[i % colors.length], 
    s: 5 + Math.random() * 12, 
    d: Math.random() * 2, 
    dur: 2.5 + Math.random() * 3.5, 
    rot: Math.random() * 360, 
    shape: Math.random() > 0.5 ? '50%' : '2px',
    delay: Math.random() * 0.5
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pcs.map(p => (
        <div 
          key={p.id} 
          className="absolute" 
          style={{ 
            left: `${p.x}%`, 
            top: '-5%', 
            width: `${p.s}px`, 
            height: `${p.s * 0.6}px`, 
            backgroundColor: p.c, 
            borderRadius: p.shape, 
            transform: `rotate(${p.rot}deg)`, 
            animation: `confetti ${p.dur}s ease-in ${p.d + p.delay}s forwards` 
          }} 
        />
      ))}
    </div>
  );
}

// ============= OTHER SCREENS =============
function StatsScreen({ onBack }: { onBack: () => void }) {
  const stats = getStats();
  const level = calculateLevel(stats.totalXP || 0);
  const progress = getProgressToNextLevel(stats.totalXP || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <h2 className="text-4xl font-black text-white mb-8 text-center">📊 آمار بازی</h2>

        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-3xl p-6 border border-yellow-400/30 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-5xl font-black text-yellow-300 mb-1">سطح {level}</div>
              <div className="text-yellow-200">{stats.totalXP || 0} XP</div>
            </div>
            <div className="text-7xl">🏆</div>
          </div>
          <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all relative overflow-hidden" style={{ width: `${progress}%` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <div className="text-yellow-200 text-sm mt-2 text-center">{progress}% تا سطح بعدی</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all card-hover">
            <div className="text-4xl mb-2 animate-float">🎮</div>
            <div className="text-3xl font-black text-white">{stats.gamesPlayed}</div>
            <div className="text-purple-200 text-sm">بازی‌ها</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all card-hover">
            <div className="text-4xl mb-2 animate-float" style={{ animationDelay: '0.1s' }}>🔄</div>
            <div className="text-3xl font-black text-white">{stats.totalMoves}</div>
            <div className="text-purple-200 text-sm">حرکات</div>
            <div className="text-purple-300/60 text-xs mt-1">
              {stats.gamesPlayed > 0 ? `میانگین: ${Math.round(stats.totalMoves / stats.gamesPlayed)}` : '-'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all card-hover">
            <div className="text-4xl mb-2 animate-float" style={{ animationDelay: '0.2s' }}>🔥</div>
            <div className="text-3xl font-black text-white">{stats.bestStreak}</div>
            <div className="text-purple-200 text-sm">Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all card-hover">
            <div className="text-4xl mb-2 animate-float" style={{ animationDelay: '0.3s' }}>💎</div>
            <div className="text-3xl font-black text-white">{stats.maxCombo}</div>
            <div className="text-purple-200 text-sm">Combo</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all card-hover">
            <div className="text-4xl mb-2 animate-float" style={{ animationDelay: '0.4s' }}>✅</div>
            <div className="text-3xl font-black text-white">{stats.totalCorrect}</div>
            <div className="text-purple-200 text-sm">تکه‌ها</div>
            <div className="text-purple-300/60 text-xs mt-1">
              {stats.bestEfficiency ? `کارایی: ${stats.bestEfficiency}%` : '-'}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">📈 آمار پیشرفته</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-black text-yellow-300">{stats.totalXP || 0}</div>
              <div className="text-purple-200 text-sm">کل XP</div>
            </div>
            <div>
              <div className="text-2xl font-black text-blue-300">
                {stats.totalTime ? formatTime(stats.totalTime) : '00:00'}
              </div>
              <div className="text-purple-200 text-sm">کل زمان</div>
            </div>
            <div>
              <div className="text-2xl font-black text-green-300">
                {stats.gamesPlayed > 0 && stats.totalTime ? formatTime(Math.round(stats.totalTime / stats.gamesPlayed)) : '00:00'}
              </div>
              <div className="text-purple-200 text-sm">میانگین زمان</div>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-300">{stats.achievements.length}</div>
              <div className="text-purple-200 text-sm">Achievements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <h2 className="text-4xl font-black text-white mb-8 text-center">🏆 Achievements</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACHIEVEMENTS.map((a, index) => {
            const unlocked = stats.achievements.includes(a.id);
            return (
              <div 
                key={a.id} 
                className={`rounded-2xl p-6 border transition-all card-hover ${unlocked ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30 animate-glow' : 'bg-white/5 border-white/10 opacity-60'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-5xl ${unlocked ? 'animate-float' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>{a.emoji}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{a.title}</h3>
                    <p className="text-purple-200 text-sm mb-3">{a.desc}</p>
                    {unlocked ? (
                      <div className="text-green-300 font-bold animate-pop-in">✓ باز شده!</div>
                    ) : (
                      <div className="text-purple-300 text-sm">🔒 هنوز باز نشده</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TutorialScreen({ onBack }: { onBack: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      markTutorialAsSeen();
      onBack();
    }
  };

  const handleSkip = () => {
    markTutorialAsSeen();
    onBack();
  };

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full animate-scale-in">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-8xl mb-4 animate-float">{step.emoji}</div>
            <h2 className="text-3xl font-black text-white mb-4 animate-pop-in">{step.title}</h2>
            <p className="text-purple-200 text-lg">{step.description}</p>
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {TUTORIAL_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i === currentStep 
                    ? 'bg-white scale-125 animate-glow' 
                    : i < currentStep 
                    ? 'bg-white/50' 
                    : 'bg-white/20'
                }`} 
              />
            ))}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleSkip} 
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all transform hover:scale-105"
            >
              رد شدن
            </button>
            <button 
              onClick={handleNext} 
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 animate-glow"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? '🚀 شروع بازی' : '➡️ بعدی'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyChallengeScreen({ onBack, onStart }: { onBack: () => void; onStart: (url: string, name: string, difficulty: string) => void }) {
  const challenge = getDailyChallenge();
  const completed = hasCompletedDailyChallenge();
  const puzzle = PUZZLES.find(p => p.id === challenge.puzzleId);

  if (!puzzle) return null;

  const handleStart = () => {
    onStart(puzzle.url, puzzle.name, challenge.difficulty);
    completeDailyChallenge();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>

        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🎯</div>
          <h2 className="text-4xl font-black text-white mb-2">چالش روزانه</h2>
          <p className="text-purple-200 text-lg">هر روز یک چالش جدید!</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2">
              <img src={puzzle.url} alt={puzzle.name} className="w-full h-auto rounded-2xl shadow-2xl" />
            </div>
            <div className="w-full md:w-1/2 text-center md:text-left">
              <div className="text-6xl mb-4">{puzzle.emoji}</div>
              <h3 className="text-3xl font-bold text-white mb-4">{puzzle.name}</h3>
              <div className="space-y-2 mb-6">
                <div className="text-purple-200">
                  <span className="font-bold">سطح دشواری:</span>{' '}
                  <span className={`px-3 py-1 rounded-full text-sm ${challenge.difficulty === 'easy' ? 'bg-green-500/80' : challenge.difficulty === 'medium' ? 'bg-yellow-500/80' : 'bg-red-500/80'} text-white`}>
                    {challenge.difficulty === 'easy' ? 'آسان' : challenge.difficulty === 'medium' ? 'متوسط' : 'سخت'}
                  </span>
                </div>
              </div>

              {completed ? (
                <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 mb-4">
                  <div className="text-green-300 font-bold text-lg">✓ چالش امروز را کامل کردید!</div>
                </div>
              ) : (
                <button onClick={handleStart} className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg">
                  🚀 شروع چالش
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PowerUpsScreen({ onBack }: { onBack: () => void }) {
  const stats = getStats();
  const level = calculateLevel(stats.totalXP || 0);
  const [purchasedItems, setPurchasedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('purchasedPowerUps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handlePurchase = (powerUpId: string, cost: number, name: string) => {
    const currentStats = getStats();
    if ((currentStats.totalXP || 0) >= cost) {
      // Deduct XP
      const newStats = { ...currentStats, totalXP: (currentStats.totalXP || 0) - cost };
      saveStats(newStats);
      
      // Add to purchased items
      const newPurchased = [...purchasedItems, powerUpId];
      setPurchasedItems(newPurchased);
      
      // Save to localStorage
      try {
        localStorage.setItem('purchasedPowerUps', JSON.stringify(newPurchased));
      } catch {}
      
      // Play sound
      playPowerUp();
      
      // Show success message
      alert(`✅ ${name} با موفقیت خریداری شد!\nدر بازی از دکمه ⚡ استفاده کنید.`);
    } else {
      playError();
      alert(`❌ XP کافی نیست!\nنیاز دارید: ${cost} XP\nXP شما: ${currentStats.totalXP || 0} XP`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-float">✨</div>
          <h2 className="text-4xl font-black text-white mb-2 animate-pop-in">Power-ups</h2>
          <p className="text-purple-200">قدرت‌های ویژه برای بهبود بازی شما</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-black text-yellow-300 animate-pulse">{stats.totalXP || 0} XP</div>
              <div className="text-purple-200 text-sm">سطح {level}</div>
            </div>
            <div className="text-6xl animate-float">💎</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POWER_UPS.map((powerUp, index) => {
            const canAfford = (stats.totalXP || 0) >= powerUp.cost;
            const isPurchased = purchasedItems.includes(powerUp.id);
            
            return (
              <div 
                key={powerUp.id} 
                className={`rounded-2xl p-6 border transition-all card-hover animate-scale-in ${
                  isPurchased 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30' 
                    : canAfford 
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30' 
                    : 'bg-white/5 border-white/10 opacity-50'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-5xl ${isPurchased ? 'animate-float' : ''}`}>{powerUp.emoji}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{powerUp.name}</h3>
                    <p className="text-purple-200 text-sm mb-3">{powerUp.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-300 font-bold">{powerUp.cost} XP</span>
                      {isPurchased ? (
                        <div className="px-4 py-2 bg-green-500/30 rounded-lg text-green-300 text-sm font-bold">
                          ✓ خریداری شد
                        </div>
                      ) : canAfford ? (
                        <button 
                          onClick={() => handlePurchase(powerUp.id, powerUp.cost, powerUp.name)}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white text-sm font-bold hover:scale-105 transition-transform animate-glow"
                        >
                          خرید
                        </button>
                      ) : (
                        <button
                          onClick={() => playError()}
                          className="px-4 py-2 bg-red-500/30 rounded-lg text-red-300 text-sm font-bold cursor-not-allowed"
                        >
                          XP کافی نیست
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ThemesScreen({ onBack }: { onBack: () => void }) {
  const stats = getStats();
  const level = calculateLevel(stats.totalXP || 0);
  const currentTheme = getCurrentTheme();
  const unlockedThemes = getUnlockedThemes(level);

  const handleSelectTheme = (themeId: string) => {
    setTheme(themeId);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-float">🎨</div>
          <h2 className="text-4xl font-black text-white mb-2 animate-pop-in">تم‌ها</h2>
          <p className="text-purple-300 text-sm mt-2">سطح شما: {level} | تم‌های باز: {unlockedThemes.length}/{THEMES.length}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {THEMES.map(theme => {
            const isUnlocked = theme.unlockLevel <= level;
            const isCurrent = theme.id === currentTheme.id;
            return (
              <div key={theme.id} onClick={() => isUnlocked && handleSelectTheme(theme.id)} className={`rounded-2xl p-6 border-2 transition-all ${isCurrent ? 'border-yellow-400 scale-105 shadow-2xl' : isUnlocked ? 'border-white/20 hover:border-white/40 hover:scale-105 cursor-pointer' : 'border-white/10 opacity-50 cursor-not-allowed'}`}>
                <div className={`bg-gradient-to-br ${theme.background} rounded-xl p-4 mb-3`}>
                  <div className="text-5xl text-center">{theme.emoji}</div>
                </div>
                <h3 className="text-white font-bold text-center mb-2">{theme.name}</h3>
                {isCurrent && <div className="text-center text-yellow-300 text-sm font-bold">✓ فعال</div>}
                {!isUnlocked && <div className="text-center text-purple-300 text-sm">🔒 سطح {theme.unlockLevel}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleExportData = () => {
    const data = exportSaveData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `puzzle-master-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-float">⚙️</div>
          <h2 className="text-4xl font-black text-white mb-2 animate-pop-in">تنظیمات</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">💾 مدیریت داده‌ها</h3>
            <button onClick={handleExportData} className="w-full px-6 py-3 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-white font-bold transition-all mb-3">📥 خروجی گرفتن از داده‌ها</button>
            <button onClick={() => setShowConfirmReset(true)} className="w-full px-6 py-3 bg-red-500/80 hover:bg-red-500 rounded-xl text-white font-bold transition-all">🗑️ حذف تمام داده‌ها</button>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">ℹ️ درباره بازی</h3>
            <div className="text-purple-200 space-y-2">
              <p>نسخه: {VERSION}</p>
              <p>توسعه‌دهنده: Puzzle Master Team</p>
              <p>ساخته شده با ❤️ و React</p>
            </div>
          </div>
        </div>

        {showConfirmReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-br from-red-800 to-pink-800 rounded-3xl p-8 max-w-md w-full text-center border border-white/20 shadow-2xl">
              <div className="text-6xl mb-4 animate-shake">⚠️</div>
              <h3 className="text-2xl font-bold text-white mb-4">آیا مطمئن هستید؟</h3>
              <p className="text-red-200 mb-6">تمام داده‌های شما حذف خواهد شد!</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmReset(false)} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all">انصراف</button>
                <button onClick={handleResetAll} className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-400 rounded-xl text-white font-bold transition-all">حذف کامل</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestsScreen({ onBack }: { onBack: () => void }) {
  const [quests, setQuests] = useState(loadQuestProgress());
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const dailyQuests = quests.filter(q => q.type === 'daily');

  const handleClaimReward = (questId: string, reward: number) => {
    const stats = getStats();
    saveStats({ ...stats, totalXP: (stats.totalXP || 0) + reward });
    const newClaimedRewards = [...claimedRewards, questId];
    setClaimedRewards(newClaimedRewards);
    const updatedQuests = quests.map(q => q.id === questId ? { ...q, progress: q.target } : q);
    setQuests(updatedQuests);
    saveQuestProgress(updatedQuests);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-float">📜</div>
          <h2 className="text-4xl font-black text-white mb-2 animate-pop-in">ماموریت‌ها</h2>
          <p className="text-purple-200 text-lg">ماموریت‌ها را کامل کن و XP دریافت کن!</p>
        </div>
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">🎯 ماموریت‌های روزانه</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailyQuests.map(quest => {
              const isCompleted = quest.progress >= quest.target;
              const isClaimed = claimedRewards.includes(quest.id);
              const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
              return (
                <div key={quest.id} className={`rounded-2xl p-6 border transition-all ${isCompleted && !isClaimed ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30' : 'bg-white/10 border-white/20'}`}>
                  <div className="text-5xl mb-3 animate-float">{quest.emoji}</div>
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

function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const leaderboard = getLeaderboard();
  const [filter, setFilter] = useState<'all' | string>('all');

  const filteredLeaderboard = filter === 'all' 
    ? leaderboard 
    : leaderboard.filter(e => e.puzzle === filter);

  const uniquePuzzles = Array.from(new Set(leaderboard.map(e => e.puzzle)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-float">🏆</div>
          <h2 className="text-4xl font-black text-white mb-2 animate-pop-in">جدول امتیازات</h2>
          <p className="text-purple-200 text-lg">بهترین رکوردها</p>
        </div>

        {/* Filter */}
        {uniquePuzzles.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              همه
            </button>
            {uniquePuzzles.map(puzzle => (
              <button
                key={puzzle}
                onClick={() => setFilter(puzzle)}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  filter === puzzle 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {puzzle}
              </button>
            ))}
          </div>
        )}

        {filteredLeaderboard.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center animate-scale-in">
            <div className="text-6xl mb-4 animate-float">🎮</div>
            <h3 className="text-2xl font-bold text-white mb-2">هنوز رکوردی ثبت نشده</h3>
            <p className="text-purple-200">اولین نفری باش که رکورد ثبت می‌کنه!</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-scale-in">
            <div className="space-y-3">
              {filteredLeaderboard.map((entry, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const medal = index < 3 ? medals[index] : `#${index + 1}`;
                const isFirst = index === 0;
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-4 rounded-xl transition-all card-hover animate-scale-in ${
                      isFirst 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 animate-glow' 
                        : index === 1 
                        ? 'bg-gradient-to-r from-gray-400/20 to-slate-500/20 border border-gray-400/30' 
                        : index === 2 
                        ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-500/30' 
                        : 'bg-white/5 border border-white/10'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl ${isFirst ? 'animate-float' : ''}`}>{medal}</div>
                      <div>
                        <div className="text-white font-bold text-lg">{entry.name}</div>
                        <div className="text-purple-200 text-sm">{entry.puzzle}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-2xl ${isFirst ? 'text-yellow-300 animate-pulse' : 'text-yellow-300'}`}>
                        {entry.score}
                      </div>
                      <div className="text-purple-200 text-xs">{new Date(entry.date).toLocaleDateString('fa-IR')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniGamesScreen({ onBack }: { onBack: () => void }) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [memoryCards, setMemoryCards] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const games = [
    { id: 'memory', name: 'بازی حافظه', emoji: '🧠', desc: 'کارت‌های مشابه را پیدا کن' },
    { id: 'quick_math', name: 'ریاضی سریع', emoji: '🔢', desc: 'محاسبات ریاضی سریع' },
    { id: 'color_match', name: 'تطبیق رنگ', emoji: '🎨', desc: 'رنگ‌های مشابه را پیدا کن' },
  ];

  const startMemoryGame = () => {
    const cards = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
    setMemoryCards(cards.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setSelectedGame('memory');
  };

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(index) || matchedCards.includes(index)) {
      return;
    }

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      
      if (memoryCards[first] === memoryCards[second]) {
        setTimeout(() => {
          setMatchedCards([...matchedCards, first, second]);
          setFlippedCards([]);
          
          if (matchedCards.length + 2 === memoryCards.length) {
            setTimeout(() => {
              alert(`🎉 تبریک! بازی را با ${moves + 1} حرکت کامل کردی!`);
              setSelectedGame(null);
            }, 500);
          }
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  if (selectedGame === 'memory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSelectedGame(null)} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
          
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-float">🧠</div>
            <h2 className="text-3xl font-black text-white mb-2">بازی حافظه</h2>
            <div className="flex justify-center gap-4 text-purple-200">
              <span>حرکات: {moves}</span>
              <span>جفت‌ها: {matchedCards.length / 2}/{memoryCards.length / 2}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            {memoryCards.map((card, index) => {
              const isFlipped = flippedCards.includes(index);
              const isMatched = matchedCards.includes(index);
              
              return (
                <div
                  key={index}
                  onClick={() => handleCardClick(index)}
                  className={`aspect-square rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                    isFlipped || isMatched
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-white/10 hover:bg-white/20'
                  } ${isMatched ? 'opacity-50' : ''}`}
                >
                  {(isFlipped || isMatched) && (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {card}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-float">🎮</div>
          <h2 className="text-4xl font-black text-white mb-2 animate-pop-in">بازی‌های کوچک</h2>
          <p className="text-purple-200 text-lg">بازی‌های سرگرم‌کننده برای تقویت مهارت‌ها</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {games.map((game, index) => (
            <div
              key={game.id}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 card-hover animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-5xl mb-4 animate-float">{game.emoji}</div>
              <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
              <p className="text-purple-200 text-sm mb-4">{game.desc}</p>
              <button
                onClick={() => game.id === 'memory' ? startMemoryGame() : alert('به زودی...')}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl text-white font-bold transition-all transform hover:scale-105"
              >
                شروع بازی
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
