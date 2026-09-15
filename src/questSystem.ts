import { Quest, GameStats } from './types';

// Update quest progress based on game stats
export function updateQuestProgress(quests: Quest[], stats: GameStats): Quest[] {
  return quests.map(quest => {
    let progress = quest.progress;

    switch (quest.id) {
      case 'complete_3_puzzles':
      case 'complete_10_puzzles':
        progress = stats.gamesPlayed;
        break;
      case 'earn_500_xp':
      case 'earn_2000_xp':
        progress = stats.totalXP || 0;
        break;
      case 'streak_5':
      case 'streak_10':
        progress = stats.bestStreak;
        break;
      default:
        break;
    }

    return { ...quest, progress };
  });
}

// Check if quest is completed
export function isQuestCompleted(quest: Quest): boolean {
  return quest.progress >= quest.target;
}

// Get claimable quests
export function getClaimableQuests(quests: Quest[], claimedRewards: string[]): Quest[] {
  return quests.filter(q => isQuestCompleted(q) && !claimedRewards.includes(q.id));
}

// Calculate total reward from completed quests
export function calculateTotalReward(quests: Quest[], claimedRewards: string[]): number {
  return quests
    .filter(q => isQuestCompleted(q) && !claimedRewards.includes(q.id))
    .reduce((sum, q) => sum + q.reward, 0);
}

// Reset daily quests
export function resetDailyQuests(quests: Quest[]): Quest[] {
  return quests.map(q => ({ ...q, progress: 0 }));
}

// Check if quests need to be reset (new day)
export function shouldResetQuests(): boolean {
  try {
    const lastReset = localStorage.getItem('lastQuestReset');
    if (!lastReset) return true;
    
    const today = new Date().toDateString();
    return lastReset !== today;
  } catch {
    return true;
  }
}

// Mark quests as reset today
export function markQuestsReset(): void {
  try {
    localStorage.setItem('lastQuestReset', new Date().toDateString());
  } catch {}
}
