// ============= MINI GAMES SYSTEM =============

export interface MiniGame {
  id: string;
  name: string;
  emoji: string;
  description: string;
  difficulty: 'آسان' | 'متوسط' | 'سخت';
  bestScore: number;
  unlocked: boolean;
  unlockRequirement?: string;
}

export const MINI_GAMES: MiniGame[] = [
  {
    id: 'memory',
    name: 'بازی حافظه',
    emoji: '🧠',
    description: 'تصاویر را به خاطر بسپار و جفت‌ها را پیدا کن',
    difficulty: 'آسان',
    bestScore: 0,
    unlocked: true
  },
  {
    id: 'speed_match',
    name: 'تطبیق سریع',
    emoji: '⚡',
    description: 'اشکال مشابه را سریع پیدا کن',
    difficulty: 'متوسط',
    bestScore: 0,
    unlocked: true,
    unlockRequirement: 'رسیدن به سطح 5'
  },
  {
    id: 'color_sort',
    name: 'مرتب‌سازی رنگ',
    emoji: '🎨',
    description: 'رنگ‌ها را به ترتیب مرتب کن',
    difficulty: 'متوسط',
    bestScore: 0,
    unlocked: false,
    unlockRequirement: 'رسیدن به سطح 10'
  },
  {
    id: 'pattern_master',
    name: 'استاد الگو',
    emoji: '🔷',
    description: 'الگو را تکرار کن',
    difficulty: 'سخت',
    bestScore: 0,
    unlocked: false,
    unlockRequirement: 'رسیدن به سطح 15'
  },
  {
    id: 'number_puzzle',
    name: 'پازل اعداد',
    emoji: '🔢',
    description: 'اعداد را به ترتیب بچین',
    difficulty: 'سخت',
    bestScore: 0,
    unlocked: false,
    unlockRequirement: 'رسیدن به سطح 20'
  }
];

// Memory Game State
export interface MemoryCard {
  id: number;
  imageId: number;
  flipped: boolean;
  matched: boolean;
}

export interface MemoryGameState {
  cards: MemoryCard[];
  flips: number;
  matches: number;
  timer: number;
  isLocked: boolean;
  gameComplete: boolean;
}

export function createMemoryGame(pairs: number = 6): MemoryGameState {
  const images = Array.from({ length: pairs }, (_, i) => i);
  const deck = [...images, ...images]
    .sort(() => Math.random() - 0.5)
    .map((imageId, index) => ({
      id: index,
      imageId,
      flipped: false,
      matched: false
    }));
  
  return {
    cards: deck,
    flips: 0,
    matches: 0,
    timer: 0,
    isLocked: false,
    gameComplete: false
  };
}

export function flipCard(state: MemoryGameState, cardId: number): MemoryGameState {
  if (state.isLocked) return state;
  
  const card = state.cards.find(c => c.id === cardId);
  if (!card || card.flipped || card.matched) return state;
  
  const newCards = state.cards.map(c => 
    c.id === cardId ? { ...c, flipped: true } : c
  );
  
  const flippedCards = newCards.filter(c => c.flipped && !c.matched);
  
  if (flippedCards.length === 2) {
    const [first, second] = flippedCards;
    
    if (first.imageId === second.imageId) {
      // Match found
      setTimeout(() => {
        const matchedCards = newCards.map(c => 
          c.id === first.id || c.id === second.id 
            ? { ...c, matched: true } 
            : c
        );
      }, 500);
      
      return {
        ...state,
        cards: newCards,
        flips: state.flips + 1,
        matches: state.matches + 1,
        gameComplete: state.matches + 1 >= state.cards.length / 2
      };
    } else {
      // No match
      setTimeout(() => {
        const unflippedCards = newCards.map(c => 
          c.id === first.id || c.id === second.id 
            ? { ...c, flipped: false } 
            : c
        );
      }, 1000);
      
      return {
        ...state,
        cards: newCards,
        flips: state.flips + 1,
        isLocked: true
      };
    }
  }
  
  return {
    ...state,
    cards: newCards,
    flips: state.flips + 1
  };
}

export function resetMemoryLock(state: MemoryGameState): MemoryGameState {
  const newCards = state.cards.map(c => ({ ...c, flipped: false }));
  return {
    ...state,
    cards: newCards,
    isLocked: false
  };
}

// Speed Match Game
export interface SpeedMatchState {
  shapes: string[];
  targetShape: string;
  score: number;
  timeLeft: number;
  gameOver: boolean;
}

const SHAPES = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐', '💎', '❤️', '🍀'];

export function createSpeedMatchGame(): SpeedMatchState {
  const shapes = Array.from({ length: 9 }, () => 
    SHAPES[Math.floor(Math.random() * SHAPES.length)]
  );
  const targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  
  return {
    shapes,
    targetShape,
    score: 0,
    timeLeft: 30,
    gameOver: false
  };
}

export function checkSpeedMatch(state: SpeedMatchState, index: number): SpeedMatchState {
  if (state.gameOver) return state;
  
  const shape = state.shapes[index];
  
  if (shape === state.targetShape) {
    // Correct match
    const newShapes = state.shapes.map((s, i) => 
      i === index ? SHAPES[Math.floor(Math.random() * SHAPES.length)] : s
    );
    
    return {
      ...state,
      shapes: newShapes,
      targetShape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      score: state.score + 10
    };
  } else {
    // Wrong match - penalty
    return {
      ...state,
      score: Math.max(0, state.score - 5),
      timeLeft: Math.max(0, state.timeLeft - 2)
    };
  }
}

// Color Sort Game
export interface ColorSortState {
  tubes: string[][];
  moves: number;
  completed: boolean;
  selectedTube: number | null;
}

const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

export function createColorSortGame(tubes: number = 4, colorsPerTube: number = 2): ColorSortState {
  const colorList: string[] = [];
  for (let i = 0; i < tubes - 1; i++) {
    for (let j = 0; j < colorsPerTube; j++) {
      colorList.push(COLORS[i % COLORS.length]);
    }
  }
  
  // Shuffle colors
  colorList.sort(() => Math.random() - 0.5);
  
  // Distribute to tubes
  const initialTubes: string[][] = [];
  for (let i = 0; i < tubes; i++) {
    if (i < tubes - 1) {
      initialTubes.push(colorList.slice(i * colorsPerTube, (i + 1) * colorsPerTube));
    } else {
      initialTubes.push([]); // Empty tube for sorting
    }
  }
  
  return {
    tubes: initialTubes,
    moves: 0,
    completed: false,
    selectedTube: null
  };
}

export function selectTube(state: ColorSortState, tubeIndex: number): ColorSortState {
  if (state.completed) return state;
  
  if (state.selectedTube === null) {
    // Select first tube
    if (state.tubes[tubeIndex].length === 0) return state;
    return { ...state, selectedTube: tubeIndex };
  } else if (state.selectedTube === tubeIndex) {
    // Deselect
    return { ...state, selectedTube: null };
  } else {
    // Try to move color
    const fromTube = state.tubes[state.selectedTube];
    const toTube = state.tubes[tubeIndex];
    
    if (fromTube.length === 0) {
      return { ...state, selectedTube: null };
    }
    
    const colorToMove = fromTube[fromTube.length - 1];
    
    // Check if move is valid
    if (toTube.length === 0 || toTube[toTube.length - 1] === colorToMove) {
      const newTubes = state.tubes.map((tube, i) => {
        if (i === state.selectedTube) {
          return tube.slice(0, -1);
        } else if (i === tubeIndex) {
          return [...tube, colorToMove];
        }
        return tube;
      });
      
      // Check if completed
      const completed = newTubes.every(tube => 
        tube.length === 0 || (tube.length > 0 && tube.every(c => c === tube[0]))
      );
      
      return {
        ...state,
        tubes: newTubes,
        moves: state.moves + 1,
        completed,
        selectedTube: null
      };
    } else {
      // Invalid move
      return { ...state, selectedTube: tubeIndex };
    }
  }
}

// Pattern Master Game
export interface PatternState {
  pattern: string[];
  playerSequence: string[];
  level: number;
  score: number;
  showingPattern: boolean;
  gameOver: boolean;
}

const PATTERN_COLORS = ['red', 'blue', 'green', 'yellow'];

export function createPatternGame(): PatternState {
  return {
    pattern: [],
    playerSequence: [],
    level: 1,
    score: 0,
    showingPattern: false,
    gameOver: false
  };
}

export function addToPattern(state: PatternState): PatternState {
  const newColor = PATTERN_COLORS[Math.floor(Math.random() * PATTERN_COLORS.length)];
  return {
    ...state,
    pattern: [...state.pattern, newColor],
    playerSequence: [],
    showingPattern: true
  };
}

export function addPlayerInput(state: PatternState, color: string): PatternState {
  const newSequence = [...state.playerSequence, color];
  
  // Check if correct so far
  const isCorrect = newSequence.every((c, i) => c === state.pattern[i]);
  
  if (!isCorrect) {
    return {
      ...state,
      playerSequence: newSequence,
      gameOver: true
    };
  }
  
  // Check if sequence complete
  if (newSequence.length === state.pattern.length) {
    return {
      ...state,
      playerSequence: newSequence,
      score: state.score + (state.level * 10),
      level: state.level + 1,
      showingPattern: false
    };
  }
  
  return {
    ...state,
    playerSequence: newSequence
  };
}

// Number Puzzle (Sliding Tile)
export interface NumberPuzzleState {
  tiles: number[];
  moves: number;
  solved: boolean;
}

export function createNumberPuzzle(size: number = 3): NumberPuzzleState {
  const total = size * size;
  const tiles = Array.from({ length: total }, (_, i) => (i + 1) % total);
  
  // Shuffle (ensure solvable)
  let inversions = 0;
  do {
    tiles.sort(() => Math.random() - 0.5);
    inversions = 0;
    for (let i = 0; i < total - 1; i++) {
      for (let j = i + 1; j < total; j++) {
        if (tiles[i] !== 0 && tiles[j] !== 0 && tiles[i] > tiles[j]) {
          inversions++;
        }
      }
    }
  } while (inversions % 2 !== 0);
  
  return {
    tiles,
    moves: 0,
    solved: false
  };
}

export function moveTile(state: NumberPuzzleState, index: number): NumberPuzzleState {
  const emptyIndex = state.tiles.indexOf(0);
  const size = Math.sqrt(state.tiles.length);
  
  const row = Math.floor(index / size);
  const col = index % size;
  const emptyRow = Math.floor(emptyIndex / size);
  const emptyCol = emptyIndex % size;
  
  // Check if adjacent
  const isAdjacent = 
    (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
    (Math.abs(col - emptyCol) === 1 && row === emptyRow);
  
  if (!isAdjacent) return state;
  
  const newTiles = [...state.tiles];
  [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
  
  // Check if solved
  const solved = newTiles.every((tile, i) => {
    if (i === newTiles.length - 1) return tile === 0;
    return tile === i + 1;
  });
  
  return {
    tiles: newTiles,
    moves: state.moves + 1,
    solved
  };
}

// Save/Load mini game scores
export function saveMiniGameScore(gameId: string, score: number): void {
  try {
    const key = `minigame_${gameId}_best`;
    const currentBest = localStorage.getItem(key);
    if (!currentBest || score > parseInt(currentBest)) {
      localStorage.setItem(key, score.toString());
    }
  } catch {}
}

export function getMiniGameBestScore(gameId: string): number {
  try {
    const key = `minigame_${gameId}_best`;
    const score = localStorage.getItem(key);
    return score ? parseInt(score) : 0;
  } catch {
    return 0;
  }
}

export function isMiniGameUnlocked(gameId: string, playerLevel: number): boolean {
  const game = MINI_GAMES.find(g => g.id === gameId);
  if (!game) return false;
  if (game.unlocked && !game.unlockRequirement) return true;
  
  // Parse unlock requirement
  if (game.unlockRequirement?.includes('سطح')) {
    const requiredLevel = parseInt(game.unlockRequirement.match(/\d+/)?.[0] || '0');
    return playerLevel >= requiredLevel;
  }
  
  return game.unlocked;
}
