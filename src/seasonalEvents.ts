import { Quest } from './types';

// ============= SEASONAL EVENTS =============
export type SeasonType = 'spring' | 'summer' | 'fall' | 'winter' | 'holiday';

export interface SeasonalEvent {
  id: string;
  name: string;
  emoji: string;
  type: SeasonType;
  startDate: string;
  endDate: string;
  active: boolean;
  specialQuests: Quest[];
  bonusMultiplier: number;
  exclusiveRewards: string[];
}

export function getCurrentSeason(): SeasonalEvent {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();
  
  // Holiday season (December)
  if (month === 11 || (month === 0 && day <= 15)) {
    return {
      id: 'winter_holiday_2025',
      name: 'جشنواره زمستانی',
      emoji: '🎄',
      type: 'holiday',
      startDate: '2024-12-01',
      endDate: '2025-01-15',
      active: true,
      specialQuests: getHolidayQuests(),
      bonusMultiplier: 2.0,
      exclusiveRewards: ['winter_theme', 'holiday_achievement']
    };
  }
  
  // Winter (Jan-Mar)
  if (month >= 0 && month <= 2) {
    return {
      id: 'winter_2025',
      name: 'فصل زمستان',
      emoji: '❄️',
      type: 'winter',
      startDate: '2025-01-01',
      endDate: '2025-03-31',
      active: true,
      specialQuests: getWinterQuests(),
      bonusMultiplier: 1.2,
      exclusiveRewards: ['ice_theme']
    };
  }
  
  // Spring (Apr-Jun)
  if (month >= 3 && month <= 5) {
    return {
      id: 'spring_2025',
      name: 'فصل بهار',
      emoji: '🌸',
      type: 'spring',
      startDate: '2025-04-01',
      endDate: '2025-06-30',
      active: true,
      specialQuests: getSpringQuests(),
      bonusMultiplier: 1.3,
      exclusiveRewards: ['forest_theme', 'cherry_blossom_puzzle']
    };
  }
  
  // Summer (Jul-Sep)
  if (month >= 6 && month <= 8) {
    return {
      id: 'summer_2025',
      name: 'فصل تابستان',
      emoji: '☀️',
      type: 'summer',
      startDate: '2025-07-01',
      endDate: '2025-09-30',
      active: true,
      specialQuests: getSummerQuests(),
      bonusMultiplier: 1.25,
      exclusiveRewards: ['ocean_theme', 'beach_puzzle']
    };
  }
  
  // Fall (Oct-Nov)
  return {
    id: 'fall_2025',
    name: 'فصل پاییز',
    emoji: '🍂',
    type: 'fall',
    startDate: '2025-10-01',
    endDate: '2025-11-30',
    active: true,
    specialQuests: getFallQuests(),
    bonusMultiplier: 1.3,
    exclusiveRewards: ['autumn_theme', 'pumpkin_puzzle']
  };
}

function getHolidayQuests(): Quest[] {
  return [
    { id: 'holiday_complete_5', title: '۵ پازل تعطیلات', description: '۵ پازل در جشنواره زمستانی کامل کن', emoji: '🎄', target: 5, reward: 500, type: 'daily', progress: 0 },
    { id: 'holiday_streak_10', title: 'Streak تعطیلات', description: 'به Streak 10 در فصل تعطیلات برس', emoji: '⭐', target: 10, reward: 300, type: 'daily', progress: 0 },
    { id: 'holiday_xp_1000', title: 'XP جادویی', description: '1000 XP در جشنواره کسب کن', emoji: '✨', target: 1000, reward: 400, type: 'daily', progress: 0 }
  ];
}

function getWinterQuests(): Quest[] {
  return [
    { id: 'winter_complete_3', title: '۳ پازل زمستانی', description: '۳ پازل در زمستان کامل کن', emoji: '❄️', target: 3, reward: 300, type: 'daily', progress: 0 },
    { id: 'winter_speed', title: 'سرعت یخی', description: 'پازل را زیر 2 دقیقه حل کن', emoji: '🧊', target: 1, reward: 200, type: 'daily', progress: 0 }
  ];
}

function getSpringQuests(): Quest[] {
  return [
    { id: 'spring_bloom', title: 'شکوفه بهاری', description: '۴ پازل کامل کن', emoji: '🌸', target: 4, reward: 350, type: 'daily', progress: 0 },
    { id: 'spring_combo', title: 'Combo بهاری', description: 'به Combo 7 برس', emoji: '🦋', target: 7, reward: 250, type: 'daily', progress: 0 }
  ];
}

function getSummerQuests(): Quest[] {
  return [
    { id: 'summer_heat', title: 'داغ تابستان', description: '۵ پازل کامل کن', emoji: '☀️', target: 5, reward: 400, type: 'daily', progress: 0 },
    { id: 'summer_beach', title: 'ساحل آفتابی', description: 'در حالت ذن بازی کن', emoji: '🏖️', target: 3, reward: 300, type: 'daily', progress: 0 }
  ];
}

function getFallQuests(): Quest[] {
  return [
    { id: 'fall_harvest', title: 'برداشت پاییزی', description: '۶ پازل کامل کن', emoji: '🍂', target: 6, reward: 400, type: 'daily', progress: 0 },
    { id: 'fall_pumpkin', title: 'کدو تنبل', description: 'پازل سخت کامل کن', emoji: '🎃', target: 1, reward: 350, type: 'daily', progress: 0 }
  ];
}

export function isSeasonActive(seasonId: string): boolean {
  const season = getCurrentSeason();
  return season.id === seasonId && season.active;
}

export function getSeasonBonus(seasonId: string): number {
  const season = getCurrentSeason();
  return season.id === seasonId ? season.bonusMultiplier : 1.0;
}

export function hasClaimedSeasonReward(rewardId: string): boolean {
  try {
    const claimed = localStorage.getItem('seasonalRewards');
    if (!claimed) return false;
    const rewards: string[] = JSON.parse(claimed);
    return rewards.includes(rewardId);
  } catch {
    return false;
  }
}

export function claimSeasonReward(rewardId: string): boolean {
  try {
    const claimed = localStorage.getItem('seasonalRewards');
    let rewards: string[] = claimed ? JSON.parse(claimed) : [];
    
    if (rewards.includes(rewardId)) return false;
    
    rewards.push(rewardId);
    localStorage.setItem('seasonalRewards', JSON.stringify(rewards));
    return true;
  } catch {
    return false;
  }
}

export function getUnclaimedSeasonRewards(): string[] {
  const season = getCurrentSeason();
  const claimed = localStorage.getItem('seasonalRewards');
  const rewards: string[] = claimed ? JSON.parse(claimed) : [];
  
  return season.exclusiveRewards.filter(r => !rewards.includes(r));
}

// ============= SPECIAL ACHIEVEMENTS =============
export interface SpecialAchievement {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  requirement: () => boolean;
  unlocked: boolean;
}

export const SPECIAL_ACHIEVEMENTS: SpecialAchievement[] = [
  {
    id: 'midnight_player',
    title: 'بازیکن نیمه‌شب',
    desc: 'بین ساعت 12 شب تا 6 صبح بازی کن',
    emoji: '🌙',
    requirement: () => {
      const hour = new Date().getHours();
      return hour >= 0 && hour < 6;
    },
    unlocked: false
  },
  {
    id: 'marathon_session',
    title: 'جلسه ماراتن',
    desc: '10 پازل در یک جلسه بازی کن',
    emoji: '🏃‍♂️',
    requirement: () => false, // Checked in game session
    unlocked: false
  },
  {
    id: 'perfect_week',
    title: 'هفته کامل',
    desc: '7 روز متوالی وارد بازی شو',
    emoji: '📅',
    requirement: () => false, // Checked by login streak
    unlocked: false
  },
  {
    id: 'speed_demon_extreme',
    title: 'شیطان سرعت افراطی',
    desc: 'پازل را زیر 30 ثانیه حل کن',
    emoji: '⚡',
    requirement: () => false, // Checked on puzzle completion
    unlocked: false
  },
  {
    id: 'zen_master_supreme',
    title: 'استاد ذن برتر',
    desc: '10 بازی در حالت ذن کامل کن',
    emoji: '🧘‍♂️',
    requirement: () => false, // Checked on zen mode completion
    unlocked: false
  },
  {
    id: 'collector_supreme',
    title: 'جمع‌آورنده برتر',
    desc: '100 پازل کامل کن',
    emoji: '📦',
    requirement: () => false, // Checked on puzzle count
    unlocked: false
  },
  {
    id: 'social_butterfly',
    title: 'پروانه اجتماعی',
    desc: 'نتیجه بازی را به اشتراک بگذار',
    emoji: '🦋',
    requirement: () => false, // Checked on share action
    unlocked: false
  },
  {
    id: 'power_user',
    title: 'کاربر حرفه‌ای',
    desc: 'از همه Power-ups استفاده کن',
    emoji: '⚡',
    requirement: () => false, // Checked on power-up usage
    unlocked: false
  },
  {
    id: 'theme_collector',
    title: 'کلکسیونر تم',
    desc: 'همه تم‌ها را باز کن',
    emoji: '🎨',
    requirement: () => false, // Checked on theme unlock count
    unlocked: false
  },
  {
    id: 'first_upload',
    title: 'اولین آپلود',
    desc: 'عکس خودت را آپلود کن',
    emoji: '📸',
    requirement: () => false, // Checked on image upload
    unlocked: false
  }
];

export function checkSpecialAchievements(stats: any): SpecialAchievement[] {
  const unlocked: SpecialAchievement[] = [];
  
  SPECIAL_ACHIEVEMENTS.forEach(ach => {
    // Check if already unlocked
    const isUnlocked = localStorage.getItem(`special_ach_${ach.id}`) === 'true';
    
    if (!isUnlocked && ach.requirement()) {
      localStorage.setItem(`special_ach_${ach.id}`, 'true');
      unlocked.push({ ...ach, unlocked: true });
    } else if (isUnlocked) {
      unlocked.push({ ...ach, unlocked: true });
    }
  });
  
  return unlocked;
}

export function unlockSpecialAchievement(id: string): boolean {
  try {
    localStorage.setItem(`special_ach_${id}`, 'true');
    return true;
  } catch {
    return false;
  }
}

export function getSpecialAchievementProgress(id: string): number {
  // This would need to be implemented based on each achievement's requirements
  return 0;
}
