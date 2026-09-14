import { Shape, Piece, Edges } from './types';

export function genEdges(cols: number, rows: number): Edges {
  const h: number[][] = [], v: number[][] = [];
  for (let r = 0; r < rows; r++) { h[r] = []; for (let c = 0; c < cols - 1; c++) h[r][c] = Math.random() > 0.5 ? 1 : -1; }
  for (let r = 0; r < rows - 1; r++) { v[r] = []; for (let c = 0; c < cols; c++) v[r][c] = Math.random() > 0.5 ? 1 : -1; }
  return { h, v };
}

export function getShape(r: number, c: number, e: Edges, cols: number, rows: number): Shape {
  return { top: r === 0 ? 0 : -e.v[r-1][c], right: c === cols-1 ? 0 : e.h[r][c], bottom: r === rows-1 ? 0 : e.v[r][c], left: c === 0 ? 0 : -e.h[r][c-1] };
}

export function generatePiecePath(pw: number, ph: number, s: Shape): string {
  const tw = pw * 0.2, th = ph * 0.2;
  let p = `M 0,0 `;
  
  if (s.top === 0) p += `L ${pw},0 `;
  else { 
    const m = pw/2, d = s.top; 
    p += `L ${m-tw*1.2},0 `; 
    p += `C ${m-tw*1.2},${-d*th*0.1} ${m-tw*0.8},${-d*th*0.3} ${m-tw*0.6},${-d*th*0.5} `; 
    p += `C ${m-tw*0.9},${-d*th*0.8} ${m-tw*0.5},${-d*th*1.1} ${m},${-d*th*1.1} `; 
    p += `C ${m+tw*0.5},${-d*th*1.1} ${m+tw*0.9},${-d*th*0.8} ${m+tw*0.6},${-d*th*0.5} `; 
    p += `C ${m+tw*0.8},${-d*th*0.3} ${m+tw*1.2},${-d*th*0.1} ${m+tw*1.2},0 `; 
    p += `L ${pw},0 `; 
  }
  
  if (s.right === 0) p += `L ${pw},${ph} `;
  else { 
    const m = ph/2, d = s.right; 
    p += `L ${pw},${m-th*1.2} `; 
    p += `C ${pw+d*tw*0.1},${m-th*1.2} ${pw+d*tw*0.3},${m-th*0.8} ${pw+d*tw*0.5},${m-th*0.6} `; 
    p += `C ${pw+d*tw*0.8},${m-th*0.9} ${pw+d*tw*1.1},${m-th*0.5} ${pw+d*tw*1.1},${m} `; 
    p += `C ${pw+d*tw*1.1},${m+th*0.5} ${pw+d*tw*0.8},${m+th*0.9} ${pw+d*tw*0.5},${m+th*0.6} `; 
    p += `C ${pw+d*tw*0.3},${m+th*0.8} ${pw+d*tw*0.1},${m+th*1.2} ${pw},${m+th*1.2} `; 
    p += `L ${pw},${ph} `; 
  }
  
  if (s.bottom === 0) p += `L 0,${ph} `;
  else { 
    const m = pw/2, d = s.bottom; 
    p += `L ${m+tw*1.2},${ph} `; 
    p += `C ${m+tw*1.2},${ph+d*th*0.1} ${m+tw*0.8},${ph+d*th*0.3} ${m+tw*0.6},${ph+d*th*0.5} `; 
    p += `C ${m+tw*0.9},${ph+d*th*0.8} ${m+tw*0.5},${ph+d*th*1.1} ${m},${ph+d*th*1.1} `; 
    p += `C ${m-tw*0.5},${ph+d*th*1.1} ${m-tw*0.9},${ph+d*th*0.8} ${m-tw*0.6},${ph+d*th*0.5} `; 
    p += `C ${m-tw*0.8},${ph+d*th*0.3} ${m-tw*1.2},${ph+d*th*0.1} ${m-tw*1.2},${ph} `; 
    p += `L 0,${ph} `; 
  }
  
  if (s.left === 0) p += `L 0,0 `;
  else { 
    const m = ph/2, d = s.left; 
    p += `L 0,${m+th*1.2} `; 
    p += `C ${-d*tw*0.1},${m+th*1.2} ${-d*tw*0.3},${m+th*0.8} ${-d*tw*0.5},${m+th*0.6} `; 
    p += `C ${-d*tw*0.8},${m+th*0.9} ${-d*tw*1.1},${m+th*0.5} ${-d*tw*1.1},${m} `; 
    p += `C ${-d*tw*1.1},${m-th*0.5} ${-d*tw*0.8},${m-th*0.9} ${-d*tw*0.5},${m-th*0.6} `; 
    p += `C ${-d*tw*0.3},${m-th*0.8} ${-d*tw*0.1},${m-th*1.2} 0,${m-th*1.2} `; 
    p += `L 0,0 `; 
  }
  
  return p + 'Z';
}

export function shuffle<T>(a: T[]): T[] { 
  const b = [...a]; 
  for (let i = b.length-1; i > 0; i--) { 
    const j = Math.floor(Math.random()*(i+1)); 
    [b[i],b[j]] = [b[j],b[i]]; 
  } 
  return b; 
}

export function createPieces(cols: number, rows: number): Piece[] {
  const total = cols * rows;
  const pos = shuffle(Array.from({length: total}, (_, i) => ({r: Math.floor(i/cols), c: i%cols})));
  return Array.from({length: total}, (_, i) => ({id: i, cr: Math.floor(i/cols), cc: i%cols, r: pos[i].r, c: pos[i].c}));
}

export function swapPieces(pieces: Piece[], id1: number, id2: number): Piece[] {
  const newPieces = pieces.map(p => ({...p}));
  const p1 = newPieces.find(p => p.id === id1)!;
  const p2 = newPieces.find(p => p.id === id2)!;
  [p1.r, p2.r] = [p2.r, p1.r];
  [p1.c, p2.c] = [p2.c, p1.c];
  return newPieces;
}

export function isPieceCorrect(piece: Piece): boolean { 
  return piece.r === piece.cr && piece.c === piece.cc; 
}

export function isPuzzleComplete(pieces: Piece[]): boolean { 
  return pieces.every(p => isPieceCorrect(p)); 
}

export function getCorrectCount(pieces: Piece[]): number { 
  return pieces.filter(p => isPieceCorrect(p)).length; 
}

export function formatTime(seconds: number): string { 
  const mins = Math.floor(seconds/60); 
  const secs = seconds%60; 
  return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`; 
}

export function calculateProgress(pieces: Piece[]): number { 
  return Math.round((getCorrectCount(pieces)/pieces.length)*100); 
}
