import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Piece, Edges, Particle } from './types';
import { genEdges, getShape, generatePiecePath, createPieces, swapPieces, isPieceCorrect, isPuzzleComplete, getCorrectCount, formatTime, calculateProgress } from './utils';
import { playClick, playSelect, playSwap, playCorrect, playCombo, playUndo, playHint, playAutoSolve, playWin, playTimeWarning, playAchievement, beep, setMasterVolume, getMasterVolume, playComboLevel, playStreakBreak, playStreakContinue, playLevelUp, playPowerUp, playError } from './audio';
import { getStats, saveStats, getRecord, saveRecord, getLeaderboard, saveToLeaderboard, saveGame, clearAutoSave, exportSaveData, importSaveData } from './storage';
import { checkAchievements, getAchievementById, ACHIEVEMENTS } from './achievements';
import { DIFFICULTIES, GAME_MODES, PUZZLES, VERSION, MAX_HISTORY, TIME_ATTACK_DURATION, AUTO_SOLVE_INTERVAL, PARTICLE_COUNT, TOAST_DURATION, HINT_DURATION, CONFETTI_DURATION, AUTO_SAVE_INTERVAL } from './config';
import { calculateXP, calculateLevel, getProgressToNextLevel, POWER_UPS, getDailyChallenge, hasCompletedDailyChallenge, completeDailyChallenge, calculateStreakBonus, calculateMoveEfficiency, calculateTimeBonus, generateShareResult, copyToClipboard, hasSeenTutorial, markTutorialAsSeen, TUTORIAL_STEPS, THEMES, getCurrentTheme, setTheme, getUnlockedThemes } from './features';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl p-8 max-w-md w-full text-center border-2 border-yellow-400/50 shadow-2xl animate-bounce-in">
            <div className="text-8xl mb-4 animate-float">🎁</div>
            <h2 className="text-3xl font-black text-white mb-2">پاداش روزانه!</h2>
            <p className="text-yellow-200 text-lg mb-6">روز {getLoginStreak() + 1} ورود متوالی</p>
            <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-yellow-400/30">
              <div className="text-5xl font-black text-yellow-300 mb-2">+{dailyRewardAmount}</div>
              <div className="text-yellow-200">XP</div>
            </div>
            <button onClick={handleClaimDailyReward} className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg">
              دریافت پاداش
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="text-7xl mb-4 animate-float">🧩</div>
        <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 mb-3">
          Puzzle Master
        </h1>
        <p className="text-xl text-purple-200 mb-2">پازل جیگساو حرفه‌ای</p>
        <p className="text-sm text-purple-300/60 mb-8">لذت ببر • آرامش داشته باش • چالش کن</p>

        {/* Difficulty */}
        <div className="mb-8">
          <h3 className="text-white font-bold mb-3 text-lg">سطح دشواری</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(DIFFICULTIES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setDifficulty(key as DifficultyKey)}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
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

        {/* Game Mode */}
        <div className="mb-8">
          <h3 className="text-white font-bold mb-3 text-lg">حالت بازی</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(GAME_MODES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setGameMode(key as GameModeKey)}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
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
                className="cursor-pointer group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 relative"
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
          <button onClick={() => setScreen('daily')} className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm">چالش روزانه</div>
          </button>
          <button onClick={() => setScreen('quests')} className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg">
            <div className="text-2xl mb-1">📜</div>
            <div className="text-sm">ماموریت‌ها</div>
          </button>
          <button onClick={() => setScreen('leaderboard')} className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-sm">جدول امتیازات</div>
          </button>
          <button onClick={() => setScreen('minigames')} className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg">
            <div className="text-2xl mb-1">🎮</div>
            <div className="text-sm">بازی‌های کوچک</div>
          </button>
          <button onClick={() => setScreen('powerups')} className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg">
            <div className="text-2xl mb-1">✨</div>
            <div className="text-sm">Power-ups</div>
          </button>
          <button onClick={() => setScreen('themes')} className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg">
            <div className="text-2xl mb-1">🎨</div>
            <div className="text-sm">تم‌ها</div>
          </button>
          <button onClick={() => setScreen('stats')} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm">آمار</div>
          </button>
          <button onClick={() => setScreen('achievements')} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all">
            <div className="text-2xl mb-1">🏅</div>
            <div className="text-sm">Achievements</div>
          </button>
          <button onClick={() => setScreen('tutorial')} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all">
            <div className="text-2xl mb-1">📖</div>
            <div className="text-sm">آموزش</div>
          </button>
          <button onClick={() => setScreen('settings')} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all">
            <div className="text-2xl mb-1">⚙️</div>
            <div className="text-sm">تنظیمات</div>
          </button>
          <button onClick={() => {
            const stats = getStats();
            const text = generateShareResult('پازل', 0, 0, calculateLevel(stats.totalXP || 0), stats.totalXP || 0);
            if (copyToClipboard(text)) {
              alert('✅ اطلاعات کپی شد!');
            }
          }} className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg">
            <div className="text-2xl mb-1">📤</div>
            <div className="text-sm">اشتراک‌گذاری</div>
          </button>
        </div>

        <div className="text-purple-400/60 text-sm">ساخته شده با ❤️ | Puzzle Master v{VERSION}</div>
      </div>
    </div>
  );
}

// ============= TUTORIAL SCREEN =============
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
      <div className="max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-8xl mb-4">{step.emoji}</div>
            <h2 className="text-3xl font-black text-white mb-4">{step.title}</h2>
            <p className="text-purple-200 text-lg">{step.description}</p>
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {TUTORIAL_STEPS.map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all ${i === currentStep ? 'bg-white scale-125' : i < currentStep ? 'bg-white/50' : 'bg-white/20'}`} />
            ))}
          </div>

          <div className="flex gap-4">
            <button onClick={handleSkip} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all">
              رد شدن
            </button>
            <button onClick={handleNext} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl text-white font-bold transition-all transform hover:scale-105">
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'شروع بازی' : 'بعدی'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= STATS SCREEN =============
function StatsScreen({ onBack }: { onBack: () => void }) {
  const stats = getStats();
  const level = calculateLevel(stats.totalXP || 0);
  const progress = getProgressToNextLevel(stats.totalXP || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
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
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
            <div className="text-4xl mb-2">🎮</div>
            <div className="text-3xl font-black text-white">{stats.gamesPlayed}</div>
            <div className="text-purple-200 text-sm">بازی‌ها</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
            <div className="text-4xl mb-2">🔄</div>
            <div className="text-3xl font-black text-white">{stats.totalMoves}</div>
            <div className="text-purple-200 text-sm">حرکات</div>
            <div className="text-purple-300/60 text-xs mt-1">
              {stats.gamesPlayed > 0 ? `میانگین: ${Math.round(stats.totalMoves / stats.gamesPlayed)}` : '-'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-black text-white">{stats.bestStreak}</div>
            <div className="text-purple-200 text-sm">Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
            <div className="text-4xl mb-2">💎</div>
            <div className="text-3xl font-black text-white">{stats.maxCombo}</div>
            <div className="text-purple-200 text-sm">Combo</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-black text-white">{stats.totalCorrect}</div>
            <div className="text-purple-200 text-sm">تکه‌ها</div>
            <div className="text-purple-300/60 text-xs mt-1">
              {stats.bestEfficiency ? `کارایی: ${stats.bestEfficiency}%` : '-'}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
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

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <h3 className="text-2xl font-bold text-white mb-4">🏆 Achievements</h3>
          <div className="text-3xl font-black text-yellow-300 mb-4">{stats.achievements.length} / {ACHIEVEMENTS.length}</div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all" style={{ width: `${(stats.achievements.length / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= ACHIEVEMENTS SCREEN =============
function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <h2 className="text-4xl font-black text-white mb-8 text-center">🏆 Achievements</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACHIEVEMENTS.map(a => {
            const unlocked = stats.achievements.includes(a.id);
            return (
              <div key={a.id} className={`rounded-2xl p-6 border transition-all ${unlocked ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30' : 'bg-white/5 border-white/10 opacity-60'}`}>
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{a.emoji}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{a.title}</h3>
                    <p className="text-purple-200 text-sm mb-3">{a.desc}</p>
                    {unlocked ? <div className="text-green-300 font-bold">✓ باز شده!</div> : <div className="text-purple-300 text-sm">هنوز باز نشده</div>}
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

// ============= DAILY CHALLENGE SCREEN =============
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
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>

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

// ============= POWER-UPS SCREEN =============
function PowerUpsScreen({ onBack }: { onBack: () => void }) {
  const stats = getStats();
  const level = calculateLevel(stats.totalXP || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">✨</div>
          <h2 className="text-4xl font-black text-white mb-2">Power-ups</h2>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-black text-yellow-300">{stats.totalXP || 0} XP</div>
              <div className="text-purple-200 text-sm">سطح {level}</div>
            </div>
            <div className="text-6xl">💎</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POWER_UPS.map(powerUp => {
            const canAfford = (stats.totalXP || 0) >= powerUp.cost;
            return (
              <div key={powerUp.id} className={`rounded-2xl p-6 border transition-all ${canAfford ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{powerUp.emoji}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{powerUp.name}</h3>
                    <p className="text-purple-200 text-sm mb-3">{powerUp.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-300 font-bold">{powerUp.cost} XP</span>
                      {canAfford ? <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white text-sm font-bold">خرید</button> : <span className="text-red-300 text-sm">XP کافی نیست</span>}
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

// ============= THEMES SCREEN =============
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
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🎨</div>
          <h2 className="text-4xl font-black text-white mb-2">تم‌ها</h2>
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

// ============= SETTINGS SCREEN =============
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
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">⚙️</div>
          <h2 className="text-4xl font-black text-white mb-2">تنظیمات</h2>
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
              <div className="text-6xl mb-4">⚠️</div>
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

// ============= QUESTS SCREEN =============
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
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">📜</div>
          <h2 className="text-4xl font-black text-white mb-2">ماموریت‌ها</h2>
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
                    <button onClick={() => handleClaimReward(quest.id, quest.reward)} className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white font-bold">دریافت پاداش</button>
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

// ============= LEADERBOARD SCREEN =============
function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const leaderboard = getLeaderboard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🏆</div>
          <h2 className="text-4xl font-black text-white mb-2">جدول امتیازات</h2>
          <p className="text-purple-200 text-lg">بهترین رکوردها</p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold text-white mb-2">هنوز رکوردی ثبت نشده</h3>
            <p className="text-purple-200">اولین نفری باش که رکورد ثبت می‌کنه!</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="space-y-3">
              {leaderboard.map((entry, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const medal = index < 3 ? medals[index] : `#${index + 1}`;
                return (
                  <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30' : index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-slate-500/20 border border-gray-400/30' : index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-500/30' : 'bg-white/5 border border-white/10'}`}>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{medal}</div>
                      <div>
                        <div className="text-white font-bold text-lg">{entry.name}</div>
                        <div className="text-purple-200 text-sm">{entry.puzzle}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-300 font-black text-2xl">{entry.score}</div>
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

// ============= MINI-GAMES SCREEN =============
function MiniGamesScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">→ بازگشت</button>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🎮</div>
          <h2 className="text-4xl font-black text-white mb-2">بازی‌های کوچک</h2>
          <p className="text-purple-200 text-lg">به زودی...</p>
        </div>
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
    const i = new Image();
    
    if (url.startsWith('blob:')) {
      i.onload = () => { setImg(i); setImageLoading(false); };
      i.onerror = () => setImageLoading(false);
      i.src = url;
    } else {
      i.crossOrigin = 'anonymous';
      i.onload = () => { setImg(i); setImageLoading(false); };
      i.onerror = () => {
        const i2 = new Image();
        i2.onload = () => { setImg(i2); setImageLoading(false); };
        i2.onerror = () => setImageLoading(false);
        i2.src = url;
      };
      i.src = url;
    }
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
    }
  }, [img, config.cols, config.rows, gameMode]);

  // Resize
  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        setCw(Math.min(containerRef.current.clientWidth - 20, 850));
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Timer
  useEffect(() => {
    if (!done && !paused && gameMode !== 'zen') {
      if (gameMode === 'timeAttack') {
        timerRef.current = setInterval(() => {
          setTime(t => {
            if (t <= 11 && t > 0 && soundOn) playTimeWarning();
            if (t <= 1) { setDone(true); return 0; }
            return t - 1;
          });
        }, 1000);
      } else {
        timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
      }
    }
    return () => clearInterval(timerRef.current);
  }, [done, paused, gameMode, soundOn]);

  // Check completion
  useEffect(() => {
    if (pieces.length > 0 && isPuzzleComplete(pieces)) {
      setDone(true);
      setConfetti(true);
      if (soundOn) playWin();

      const finalTime = gameMode === 'timeAttack' ? TIME_ATTACK_DURATION - time : time;
      const isNewRecord = saveRecord(name, finalTime, moves, bestStreak, maxCombo);

      const stats = getStats();
      const earnedXP = calculateXP(moves, finalTime, bestStreak, maxCombo);
      const streakBonus = calculateStreakBonus(bestStreak);
      const timeBonus = calculateTimeBonus(finalTime, pieces.length);
      const totalEarnedXP = earnedXP + streakBonus + timeBonus;
      const efficiency = calculateMoveEfficiency(moves, pieces.length);

      saveStats({
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        totalMoves: stats.totalMoves + moves,
        bestStreak: Math.max(stats.bestStreak, bestStreak),
        maxCombo: Math.max(stats.maxCombo, maxCombo),
        totalCorrect: stats.totalCorrect + pieces.length,
        totalXP: (stats.totalXP || 0) + totalEarnedXP,
        totalTime: (stats.totalTime || 0) + finalTime,
        bestEfficiency: Math.max(stats.bestEfficiency || 0, efficiency)
      });

      const score = Math.round((10000 / Math.max(1, finalTime)) * (100 / Math.max(1, moves)));
      saveToLeaderboard({ name: 'Player', score, date: new Date().toISOString(), puzzle: name });
      clearAutoSave();

      const result = checkAchievements(stats.gamesPlayed + 1, finalTime, moves, bestStreak, maxCombo, String(gameMode), String(difficulty));
      if (result.newlyUnlocked.length > 0) {
        if (soundOn) playAchievement();
        setToast(`🏆 ${result.newlyUnlocked.length} Achievement جدید!`);
        setTimeout(() => setToast(null), TOAST_DURATION);
      }

      if (isNewRecord) {
        setToast('🎉 رکورد جدید!');
        setTimeout(() => setToast(null), TOAST_DURATION);
      }

      setTimeout(() => setConfetti(false), CONFETTI_DURATION);
    }
  }, [pieces, soundOn, name, time, moves, bestStreak, maxCombo, gameMode, difficulty]);

  // Particles
  useEffect(() => {
    if (particles.length === 0) return;
    const id = setInterval(() => {
      setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, life: p.life - 1 })).filter(p => p.life > 0));
    }, 16);
    return () => clearInterval(id);
  }, [particles.length]);

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
      setStreak(s => {
        const ns = s + 1;
        setBestStreak(b => Math.max(b, ns));
        if (soundOn && ns > 1) playStreakContinue();
        return ns;
      });
      setCombo(c => {
        const nc = c + 1;
        setMaxCombo(m => Math.max(m, nc));
        if (nc >= 3 && soundOn) playComboLevel(nc);
        return nc;
      });
      if (soundOn && combo < 3) playCorrect();
      if (p1ok && dims) {
        setLastPlacedId(p1.id);
        spawnParticles(p1.c * dims.pw + dims.ext + dims.pw / 2, p1.r * dims.ph + dims.ext + dims.ph / 2, 25, 'celebration');
      }
      if (p2ok && dims) {
        setLastPlacedId(p2.id);
        spawnParticles(p2.c * dims.pw + dims.ext + dims.pw / 2, p2.r * dims.ph + dims.ext + dims.ph / 2, 25, 'celebration');
      }
      setTimeout(() => setLastPlacedId(null), 800);
    } else {
      if (streak > 0 && soundOn) playStreakBreak();
      setStreak(0);
      setCombo(0);
      if (soundOn) playSwap();
    }
  }, [pieces, soundOn, dims, spawnParticles, combo]);

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
  };

  const doHint = () => {
    const w = pieces.filter(p => !isPieceCorrect(p));
    if (w.length) {
      const rp = w[Math.floor(Math.random() * w.length)];
      setHint(rp.id);
      setTimeout(() => setHint(null), HINT_DURATION);
      if (soundOn) playHint();
    }
  };

  const undo = () => {
    if (history.length > 0) {
      setRedoStack(r => [...r, pieces]);
      setPieces(history[history.length - 1]);
      setHistory(h => h.slice(0, -1));
      setMoves(m => Math.max(0, m - 1));
      setStreak(0);
      if (soundOn) playUndo();
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      setHistory(h => [...h, pieces]);
      setPieces(redoStack[redoStack.length - 1]);
      setRedoStack(r => r.slice(0, -1));
      setMoves(m => m + 1);
      if (soundOn) beep(400, 0.1, 'sine', 0.05);
    }
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
  }, [done, undo, redo, doHint, preview, sel]);

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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-bounce-in">
          {toast}
        </div>
      )}

      {/* PREVIEW MODAL - FIXED */}
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
            <button onClick={onBack} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm">→ بازگشت</button>
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
            {streak >= 2 && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-lg px-2 py-1 border border-orange-400/30">
                <span className="text-orange-300 text-xs">🔥</span>
                <span className="text-white font-mono text-xs font-bold">{streak}</span>
              </div>
            )}
            <button 
              onClick={() => setPreview(true)}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs tooltip"
              data-tooltip="پیش‌نمایش (P)"
            >
              👁️
            </button>
            <button 
              onClick={() => setShowThumb(!showThumb)} 
              className={`px-2 py-1 rounded-lg text-white text-xs tooltip ${showThumb ? 'bg-purple-500' : 'bg-white/10'}`}
              data-tooltip={showThumb ? 'مخفی کردن thumbnail' : 'نمایش thumbnail'}
            >
              🖼️
            </button>
            <button 
              onClick={() => setShowGrid(!showGrid)} 
              className={`px-2 py-1 rounded-lg text-white text-xs tooltip ${showGrid ? 'bg-blue-500/80' : 'bg-white/10'}`}
              data-tooltip={showGrid ? 'مخفی کردن grid' : 'نمایش grid'}
            >
              ⊞
            </button>
            <button 
              onClick={undo} 
              disabled={history.length === 0} 
              className={`px-2 py-1 rounded-lg text-white text-xs tooltip ${history.length > 0 ? 'bg-blue-500/80 hover:bg-blue-500' : 'bg-white/5 opacity-50'}`}
              data-tooltip="برگشت (Ctrl+Z)"
            >
              ↩️
            </button>
            <button 
              onClick={redo} 
              disabled={redoStack.length === 0} 
              className={`px-2 py-1 rounded-lg text-white text-xs tooltip ${redoStack.length > 0 ? 'bg-purple-500/80 hover:bg-purple-500' : 'bg-white/5 opacity-50'}`}
              data-tooltip="بازگشت (Ctrl+Y)"
            >
              ↪️
            </button>
            <button 
              onClick={doHint} 
              className="px-2 py-1 bg-amber-500/80 hover:bg-amber-500 rounded-lg text-white text-xs tooltip"
              data-tooltip="راهنما (H)"
            >
              💡
            </button>
            <button 
              onClick={() => setSoundOn(!soundOn)} 
              className={`px-2 py-1 rounded-lg text-white text-xs tooltip ${soundOn ? 'bg-green-500/80' : 'bg-white/10'}`}
              data-tooltip={soundOn ? 'قطع صدا' : 'فعال کردن صدا'}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button 
              onClick={reset} 
              className="px-2 py-1 bg-red-500/80 hover:bg-red-500 rounded-lg text-white text-xs tooltip"
              data-tooltip="شروع مجدد"
            >
              🔄
            </button>
          </div>
        </div>
        <div className="mt-2 bg-black/30 rounded-full p-1 border border-white/10">
          <div className="flex items-center gap-3 px-3">
            <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500 relative overflow-hidden" style={{ width: `${prog}%`, background: prog === 100 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b)' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <span className="text-white font-bold text-sm min-w-[2.5rem] text-left">{prog}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex justify-center">
        <div ref={containerRef} className="w-full relative" style={{ maxWidth: '900px' }}>
          {showThumb && (
            <div 
              className="fixed bottom-4 right-4 w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl bg-black/70 backdrop-blur-md hover:scale-110 transition-transform cursor-pointer z-30"
              onClick={() => setPreview(true)}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
          )}

          <div className="bg-black/40 rounded-xl border-2 border-white/20 overflow-hidden shadow-2xl p-2">
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
                  <g key={p.id} transform={`translate(${x},${y})`} onPointerDown={e => handleDragStart(e, p.id)} style={{ cursor: 'pointer' }} filter={f} opacity={isHover ? 0.85 : 1}>
                    <g clipPath={`url(#c-${p.id})`}>
                      <image href={url} x={-p.cc * pw} y={-p.cr * ph} width={config.cols * pw} height={config.rows * ph} preserveAspectRatio="none" />
                    </g>
                    <path d={generatePiecePath(pw, ph, shape)} fill="none" stroke={sc} strokeWidth={sw2} strokeLinejoin="round" />
                    {isOk && !done && <path d={generatePiecePath(pw, ph, shape)} fill="rgba(52,211,153,0.04)" stroke="none" />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-purple-800 via-indigo-800 to-pink-800 rounded-3xl p-6 md:p-8 max-w-md w-full text-center border border-white/20 shadow-2xl animate-bounce-in">
            {gameMode === 'timeAttack' && time === 0 ? (
              <>
                <div className="text-7xl mb-4">⏰</div>
                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-2">وقت تمام شد!</h2>
                <p className="text-purple-200 text-lg mb-6">متأسفانه نتونستی پازل رو در زمان مشخص شده کامل کنی</p>
              </>
            ) : (
              <>
                <div className="text-7xl mb-4 animate-bounce-slow">🏆</div>
                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200 mb-2">تبریک!</h2>
                <p className="text-purple-200 text-lg mb-6">پازل {config.total} تکه رو تکمیل کردی!</p>
              </>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <div className="text-yellow-300 text-2xl md:text-3xl font-black font-mono">{formatTime(gameMode === 'timeAttack' ? TIME_ATTACK_DURATION - time : time)}</div>
                <div className="text-purple-200 text-sm mt-1">⏱️ زمان</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <div className="text-blue-300 text-2xl md:text-3xl font-black font-mono">{moves}</div>
                <div className="text-purple-200 text-sm mt-1">🔄 حرکات</div>
              </div>
            </div>

            {bestStreak >= 3 && (
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-3 mb-4 border border-orange-400/30">
                <div className="text-orange-300 text-lg font-bold">🔥 بهترین Streak: {bestStreak}</div>
              </div>
            )}

            {maxCombo >= 3 && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 mb-4 border border-purple-400/30">
                <div className="text-purple-300 text-lg font-bold">💎 بیشترین Combo: x{maxCombo}</div>
              </div>
            )}

            {record && (
              <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
                <div className="text-purple-200 text-sm">🏆 رکورد قبلی: {formatTime(record.time)}</div>
                {(gameMode !== 'timeAttack' || time > 0) && (time < record.time || (time === record.time && moves < record.moves)) && (
                  <div className="text-green-300 text-sm font-bold mt-1 animate-pulse">🎉 رکورد جدید!</div>
                )}
              </div>
            )}

            <div className="mb-6">
              <div className="text-3xl">{moves < 80 ? '⭐⭐⭐' : moves < 140 ? '⭐⭐' : '⭐'}</div>
              <p className="text-purple-300 text-sm mt-2">{moves < 80 ? 'فوق‌العاده! استاد پازل!' : moves < 140 ? 'عالی بود!' : 'آفرین!'}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={reset} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg">🔄 بازی مجدد</button>
              <button onClick={onBack} className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all border border-white/10">🏠 منوی اصلی</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Confetti() {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0', '#10b981', '#fbbf24'];
  const pcs = Array.from({ length: 120 }, (_, i) => ({
    id: i, x: Math.random() * 100, c: colors[i % colors.length], s: 5 + Math.random() * 10, d: Math.random() * 3, dur: 2 + Math.random() * 4, rot: Math.random() * 360, shape: Math.random() > 0.5 ? '50%' : '2px'
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pcs.map(p => (
        <div key={p.id} className="absolute" style={{ left: `${p.x}%`, top: '-5%', width: `${p.s}px`, height: `${p.s * 0.6}px`, backgroundColor: p.c, borderRadius: p.shape, transform: `rotate(${p.rot}deg)`, animation: `confetti ${p.dur}s ease-in ${p.d}s forwards` }} />
      ))}
    </div>
  );
}

