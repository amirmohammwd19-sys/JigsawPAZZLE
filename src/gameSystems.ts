import { Quest } from './types';

// ============= DAILY LOGIN REWARDS =============
export interface DailyReward { day: number; reward: number; emoji: string; claimed: boolean }

export function getDailyRewards(): DailyReward[] {
  return [
    { day: 1, reward: 50, emoji: '🎁', claimed: false },
    { day: 2, reward: 75, emoji: '🎁', claimed: false },
    { day: 3, reward: 100, emoji: '🎁', claimed: false },
    { day: 4, reward: 150, emoji: '🎁', claimed: false },
    { day: 5, reward: 200, emoji: '🎁', claimed: false },
    { day: 6, reward: 250, emoji: '🎁', claimed: false },
    { day: 7, reward: 500, emoji: '🎁', claimed: false },
  ];
}

export function getLoginStreak(): number {
  try {
    const data = localStorage.getItem('loginStreak');
    if (!data) return 0;
    const { lastLogin, streak } = JSON.parse(data);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastLogin === today) return streak;
    if (lastLogin === yesterday) return streak;
    return 0;
  } catch { return 0; }
}

export function claimDailyReward(): { success: boolean; reward: number } {
  try {
    const today = new Date().toDateString();
    const data = localStorage.getItem('loginStreak');
    let streak = 0, lastClaimed = '';
    if (data) {
      const parsed = JSON.parse(data);
      streak = parsed.streak || 0;
      lastClaimed = parsed.lastLogin || '';
    }
    if (lastClaimed === today) return { success: false, reward: 0 };
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastClaimed === yesterday) streak += 1;
    else streak = 1;
    const rewards = getDailyRewards();
    const rewardIndex = (streak - 1) % 7;
    const reward = rewards[rewardIndex].reward;
    localStorage.setItem('loginStreak', JSON.stringify({ streak, lastLogin: today }));
    return { success: true, reward };
  } catch { return { success: false, reward: 0 }; }
}

// ============= QUEST SYSTEM =============
export function getDailyQuests(): Quest[] {
  return [
    { id: 'complete_3_puzzles', title: 'سه پازل کامل کن', description: '3 پازل را در امروز کامل کن', emoji: '🎯', target: 3, reward: 200, type: 'daily', progress: 0 },
    { id: 'earn_500_xp', title: '500 XP کسب کن', description: '500 XP در امروز جمع کن', emoji: '💎', target: 500, reward: 150, type: 'daily', progress: 0 },
    { id: 'streak_5', title: 'Streak 5', description: 'به Streak 5 برس', emoji: '🔥', target: 5, reward: 100, type: 'daily', progress: 0 },
    { id: 'combo_7', title: 'Combo 7', description: 'به Combo 7 برس', emoji: '⚡', target: 7, reward: 150, type: 'daily', progress: 0 }
  ];
}

export function getWeeklyQuests(): Quest[] {
  return [
    { id: 'complete_10_puzzles', title: '10 پازل کامل کن', description: '10 پازل را در این هفته کامل کن', emoji: '🏆', target: 10, reward: 500, type: 'weekly', progress: 0 },
    { id: 'earn_2000_xp', title: '2000 XP کسب کن', description: '2000 XP در این هفته جمع کن', emoji: '💎', target: 2000, reward: 400, type: 'weekly', progress: 0 },
    { id: 'streak_10', title: 'Streak 10', description: 'به Streak 10 برس', emoji: '🔥', target: 10, reward: 300, type: 'weekly', progress: 0 },
    { id: 'perfect_game', title: 'بازی کامل', description: 'یک پازل با 100% کارایی', emoji: '💯', target: 1, reward: 600, type: 'weekly', progress: 0 }
  ];
}

export function saveQuestProgress(quests: Quest[]): void {
  try { localStorage.setItem('questProgress', JSON.stringify(quests)); } catch {}
}

export function loadQuestProgress(): Quest[] {
  try {
    const data = localStorage.getItem('questProgress');
    if (data) return JSON.parse(data);
  } catch {}
  return [...getDailyQuests(), ...getWeeklyQuests()];
}

// Reset daily quests at midnight
export function resetDailyQuestsIfNeeded(): void {
  try {
    const lastReset = localStorage.getItem('dailyQuestsReset');
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
      const weeklyQuests = loadQuestProgress().filter(q => q.type === 'weekly');
      const newQuests = [...getDailyQuests(), ...weeklyQuests];
      saveQuestProgress(newQuests);
      localStorage.setItem('dailyQuestsReset', today);
    }
  } catch {}
}

// Reset weekly quests on Monday
export function resetWeeklyQuestsIfNeeded(): void {
  try {
    const lastReset = localStorage.getItem('weeklyQuestsReset');
    const monday = new Date();
    monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
    const mondayStr = monday.toDateString();
    
    if (lastReset !== mondayStr) {
      const dailyQuests = loadQuestProgress().filter(q => q.type === 'daily');
      const newQuests = [...dailyQuests, ...getWeeklyQuests()];
      saveQuestProgress(newQuests);
      localStorage.setItem('weeklyQuestsReset', mondayStr);
    }
  } catch {}
}

// Update quest progress
export function updateQuestProgress(questId: string, amount: number = 1): void {
  try {
    const quests = loadQuestProgress();
    const updated = quests.map(q => {
      if (q.id === questId && q.progress < q.target) {
        return { ...q, progress: Math.min(q.target, q.progress + amount) };
      }
      return q;
    });
    saveQuestProgress(updated);
  } catch {}
}

// Track puzzle completion for quests
export function trackPuzzleCompletion(difficulty: string, time: number, moves: number, efficiency: number): void {
  updateQuestProgress('complete_3_puzzles');
  updateQuestProgress('complete_10_puzzles');
  
  // Track XP quest
  const xpEarned = Math.floor(100 + (difficulty === 'hard' ? 50 : difficulty === 'medium' ? 25 : 0));
  updateQuestProgress('earn_500_xp', xpEarned);
  updateQuestProgress('earn_2000_xp', xpEarned);
  
  // Track perfect game
  if (efficiency >= 100) {
    updateQuestProgress('perfect_game');
  }
}
