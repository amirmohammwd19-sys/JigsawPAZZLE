export const VERSION = '16.0 Ultimate';
export const MAX_HISTORY = 15;
export const TIME_ATTACK_DURATION = 60;
export const AUTO_SOLVE_INTERVAL = 500;
export const PARTICLE_COUNT = 20;
export const TOAST_DURATION = 2500;
export const HINT_DURATION = 3000;
export const CONFETTI_DURATION = 8000;
export const AUTO_SAVE_INTERVAL = 30000;
export const MAX_LEADERBOARD_ENTRIES = 10;

export const DIFFICULTIES: { [key: string]: { cols: number; rows: number; total: number; label: string; emoji: string } } = {
  easy: { cols: 6, rows: 5, total: 30, label: 'آسان', emoji: '🌱' },
  medium: { cols: 10, rows: 7, total: 70, label: 'متوسط', emoji: '🌟' },
  hard: { cols: 12, rows: 10, total: 120, label: 'سخت', emoji: '🔥' }
};

export const GAME_MODES: { [key: string]: { label: string; emoji: string; desc: string } } = {
  classic: { label: 'کلاسیک', emoji: '🎮', desc: 'بازی معمولی' },
  timeAttack: { label: 'حمله زمانی', emoji: '⚡', desc: '60 ثانیه' },
  zen: { label: 'ذن', emoji: '🧘', desc: 'بدون فشار' }
};

export const PUZZLES = [
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
