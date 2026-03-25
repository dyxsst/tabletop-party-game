function oval(cx, cy, rx, ry, count, startAngle = Math.PI) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = startAngle - (i / count) * 2 * Math.PI;
    pts.push({ x: Math.round(cx + rx * Math.cos(a)), y: Math.round(cy + ry * Math.sin(a)) });
  }
  return pts;
}

const TYPES = ['green', 'red', 'blue', 'event'];
function tileType(i, pattern) {
  if (i === 0) return 'start';
  return pattern[i % pattern.length];
}

// ── Board 1: Canal de Panamá ────────────────────────────────
const canalPattern = ['green', 'blue', 'green', 'event', 'green', 'red', 'blue', 'green', 'green', 'event', 'red', 'green'];
const canalMain = oval(50, 50, 38, 30, 24);
const canalNodes = canalMain.map((p, i) => ({
  id: i, x: p.x, y: p.y, type: tileType(i, canalPattern), next: [i === 23 ? 0 : i + 1],
}));
// Fork A at node 5 → shortcut to node 11
canalNodes.push({ id: 24, x: 34, y: 62, type: 'red', next: [25] });
canalNodes.push({ id: 25, x: 45, y: 55, type: 'red', next: [26] });
canalNodes.push({ id: 26, x: 56, y: 48, type: 'event', next: [11] });
canalNodes[5].next.push(24);
// Fork B at node 14 → shortcut to node 19
canalNodes.push({ id: 27, x: 56, y: 30, type: 'red', next: [28] });
canalNodes.push({ id: 28, x: 42, y: 35, type: 'green', next: [19] });
canalNodes[14].next.push(27);

export const BOARD_CANAL = {
  id: 'canal',
  name: 'Canal de Panamá',
  desc: 'Navega por las esclusas del Canal',
  bg: '#0C2D48',
  pathColor: '#5DADE2',
  tileColors: { green: '#27AE60', red: '#E74C3C', blue: '#3498DB', event: '#F39C12', start: '#ECF0F1' },
  nodes: canalNodes,
  dynamicEvents: [
    { name: 'Abren la esclusa', from: 8, addNext: 24 },
    { name: 'Cierre de mantenimiento', from: 5, removeNext: 24 },
  ],
};

// ── Board 2: Casco Viejo ─────────────────────────────────────
const cascoPattern = ['green', 'event', 'blue', 'green', 'red', 'green', 'blue', 'event', 'green', 'red', 'green', 'green'];
const cascoNodes = [
  { id: 0, x: 8, y: 85, type: 'start' },
  { id: 1, x: 15, y: 85, type: 'green' },
  { id: 2, x: 22, y: 85, type: 'blue' },
  { id: 3, x: 29, y: 85, type: 'event' },
  { id: 4, x: 29, y: 75, type: 'green' },
  { id: 5, x: 29, y: 65, type: 'red' },
  // Fork A
  { id: 6, x: 29, y: 55, type: 'green' },
  // Main right
  { id: 7, x: 38, y: 55, type: 'blue' },
  { id: 8, x: 47, y: 55, type: 'green' },
  { id: 9, x: 56, y: 55, type: 'event' },
  { id: 10, x: 65, y: 55, type: 'green' },
  { id: 11, x: 65, y: 45, type: 'red' },
  { id: 12, x: 65, y: 35, type: 'green' },
  // Fork B
  { id: 13, x: 65, y: 25, type: 'event' },
  { id: 14, x: 56, y: 25, type: 'green' },
  { id: 15, x: 47, y: 25, type: 'blue' },
  { id: 16, x: 38, y: 25, type: 'green' },
  { id: 17, x: 29, y: 25, type: 'red' },
  { id: 18, x: 20, y: 25, type: 'green' },
  { id: 19, x: 12, y: 25, type: 'event' },
  { id: 20, x: 12, y: 35, type: 'green' },
  { id: 21, x: 12, y: 45, type: 'blue' },
  { id: 22, x: 12, y: 55, type: 'green' },
  { id: 23, x: 12, y: 65, type: 'red' },
  { id: 24, x: 12, y: 75, type: 'green' },
  // Alt path from fork A → up-left
  { id: 25, x: 20, y: 48, type: 'red' },
  { id: 26, x: 20, y: 38, type: 'event' },
  // Alt path from fork B → right
  { id: 27, x: 75, y: 25, type: 'green' },
  { id: 28, x: 82, y: 35, type: 'red' },
  { id: 29, x: 82, y: 45, type: 'green' },
  { id: 30, x: 75, y: 55, type: 'blue' },
  // Inner alley
  { id: 31, x: 47, y: 40, type: 'green' },
  { id: 32, x: 47, y: 70, type: 'event' },
  { id: 33, x: 38, y: 70, type: 'red' },
];
// Wire up connections
const cascoNext = {
  0:[1],1:[2],2:[3],3:[4],4:[5],5:[6],6:[7,25],7:[8],8:[9,31],9:[10],10:[11],11:[12],12:[13],
  13:[14,27],14:[15],15:[16],16:[17],17:[18],18:[19],19:[20],20:[21],21:[22],22:[23],23:[24],24:[0],
  25:[26],26:[18],
  27:[28],28:[29],29:[30],30:[10],
  31:[15],
  32:[33],33:[5],
};
cascoNodes.forEach(n => n.next = cascoNext[n.id] || []);
// Extra fork: node 8 can go to 32
cascoNodes[8].next.push(32);

export const BOARD_CASCO = {
  id: 'casco',
  name: 'Casco Viejo',
  desc: 'Recorre las calles coloniales del casco antiguo',
  bg: '#2C1810',
  pathColor: '#D4A574',
  tileColors: { green: '#27AE60', red: '#C0392B', blue: '#2980B9', event: '#E67E22', start: '#BDC3C7' },
  nodes: cascoNodes,
  dynamicEvents: [
    { name: 'Calle cerrada por fiesta', from: 8, removeNext: 31 },
    { name: 'Nuevo callejón abierto', from: 8, addNext: 31 },
    { name: 'Puente cortado', from: 13, removeNext: 27 },
  ],
};

// ── Board 3: Selva del Darién ───────────────────────────────
const darienNodes = [
  { id: 0,  x: 8,  y: 50, type: 'start' },
  { id: 1,  x: 14, y: 42, type: 'green' },
  { id: 2,  x: 20, y: 35, type: 'blue' },
  { id: 3,  x: 27, y: 30, type: 'event' },
  // Fork 1
  { id: 4,  x: 34, y: 25, type: 'green' },
  // Upper branch
  { id: 5,  x: 41, y: 18, type: 'green' },
  { id: 6,  x: 48, y: 14, type: 'red' },
  { id: 7,  x: 55, y: 18, type: 'event' },
  // Lower branch from fork 1
  { id: 8,  x: 41, y: 35, type: 'red' },
  { id: 9,  x: 48, y: 38, type: 'green' },
  { id: 10, x: 55, y: 35, type: 'blue' },
  // Merge
  { id: 11, x: 60, y: 28, type: 'green' },
  { id: 12, x: 66, y: 22, type: 'event' },
  // Fork 2
  { id: 13, x: 72, y: 25, type: 'green' },
  // Top path
  { id: 14, x: 78, y: 18, type: 'red' },
  { id: 15, x: 85, y: 22, type: 'green' },
  { id: 16, x: 90, y: 30, type: 'blue' },
  // Bottom path from fork 2
  { id: 17, x: 78, y: 32, type: 'green' },
  { id: 18, x: 85, y: 38, type: 'event' },
  { id: 19, x: 90, y: 45, type: 'green' },
  // Merge and loop back
  { id: 20, x: 88, y: 55, type: 'red' },
  { id: 21, x: 82, y: 62, type: 'green' },
  { id: 22, x: 75, y: 68, type: 'event' },
  // Fork 3
  { id: 23, x: 68, y: 72, type: 'green' },
  { id: 24, x: 60, y: 75, type: 'blue' },
  { id: 25, x: 52, y: 78, type: 'green' },
  { id: 26, x: 44, y: 80, type: 'red' },
  { id: 27, x: 36, y: 78, type: 'event' },
  { id: 28, x: 28, y: 74, type: 'green' },
  { id: 29, x: 20, y: 68, type: 'green' },
  { id: 30, x: 14, y: 60, type: 'blue' },
  // Alt from fork 3 (shortcut through jungle)
  { id: 31, x: 60, y: 65, type: 'red' },
  { id: 32, x: 50, y: 60, type: 'red' },
  { id: 33, x: 38, y: 62, type: 'event' },
];
const darienNext = {
  0:[1],1:[2],2:[3],3:[4],4:[5,8],5:[6],6:[7],7:[11],8:[9],9:[10],10:[11],
  11:[12],12:[13],13:[14,17],14:[15],15:[16],16:[20],17:[18],18:[19],19:[20],
  20:[21],21:[22],22:[23],23:[24,31],24:[25],25:[26],26:[27],27:[28],28:[29],29:[30],30:[0],
  31:[32],32:[33],33:[28],
};
darienNodes.forEach(n => n.next = darienNext[n.id] || []);

export const BOARD_DARIEN = {
  id: 'darien',
  name: 'Selva del Darién',
  desc: 'Aventúrate en la densa selva tropical',
  bg: '#1B3A1B',
  pathColor: '#6B8E23',
  tileColors: { green: '#2ECC71', red: '#E74C3C', blue: '#1ABC9C', event: '#F1C40F', start: '#ECF0F1' },
  nodes: darienNodes,
  dynamicEvents: [
    { name: 'Derrumbe en la selva', from: 4, removeNext: 8 },
    { name: 'Nuevo sendero descubierto', from: 23, addNext: 31 },
    { name: 'Puente de lianas caído', from: 23, removeNext: 31 },
  ],
};

// ── Board 4: Archipiélago de San Blas ───────────────────────
const sanBlasNodes = [
  // Island 1 (bottom-left)
  { id: 0,  x: 10, y: 70, type: 'start' },
  { id: 1,  x: 16, y: 78, type: 'green' },
  { id: 2,  x: 24, y: 82, type: 'blue' },
  { id: 3,  x: 32, y: 78, type: 'event' },
  { id: 4,  x: 32, y: 68, type: 'green' },
  // Bridge to Island 2
  { id: 5,  x: 38, y: 60, type: 'red' },
  // Island 2 (center)
  { id: 6,  x: 42, y: 52, type: 'green' },
  { id: 7,  x: 50, y: 48, type: 'event' },
  // Fork
  { id: 8,  x: 58, y: 52, type: 'green' },
  // Path to Island 3 (top-right)
  { id: 9,  x: 62, y: 42, type: 'blue' },
  { id: 10, x: 68, y: 34, type: 'green' },
  { id: 11, x: 75, y: 28, type: 'red' },
  { id: 12, x: 82, y: 24, type: 'event' },
  { id: 13, x: 88, y: 30, type: 'green' },
  { id: 14, x: 88, y: 40, type: 'green' },
  { id: 15, x: 82, y: 45, type: 'blue' },
  // Path to island 4 (bottom-right)
  { id: 16, x: 65, y: 58, type: 'green' },
  { id: 17, x: 72, y: 65, type: 'event' },
  { id: 18, x: 80, y: 68, type: 'red' },
  { id: 19, x: 85, y: 75, type: 'green' },
  { id: 20, x: 80, y: 82, type: 'blue' },
  { id: 21, x: 72, y: 80, type: 'green' },
  // Return bridge
  { id: 22, x: 65, y: 75, type: 'event' },
  { id: 23, x: 55, y: 72, type: 'green' },
  { id: 24, x: 45, y: 70, type: 'red' },
  // Island 5 (top-left)
  { id: 25, x: 42, y: 38, type: 'green' },
  { id: 26, x: 35, y: 30, type: 'event' },
  { id: 27, x: 28, y: 24, type: 'green' },
  { id: 28, x: 20, y: 20, type: 'red' },
  { id: 29, x: 12, y: 26, type: 'blue' },
  { id: 30, x: 10, y: 36, type: 'green' },
  { id: 31, x: 10, y: 48, type: 'event' },
  { id: 32, x: 10, y: 58, type: 'green' },
  // Extra bridge from island 3 to 5
  { id: 33, x: 55, y: 30, type: 'green' },
  { id: 34, x: 48, y: 25, type: 'red' },
];
const sanBlasNext = {
  0:[1],1:[2],2:[3],3:[4],4:[5],5:[6],6:[7],7:[8],8:[9,16],
  9:[10],10:[11,33],11:[12],12:[13],13:[14],14:[15],15:[8],
  16:[17],17:[18],18:[19],19:[20],20:[21],21:[22],22:[23],23:[24],24:[4],
  25:[26],26:[27],27:[28],28:[29],29:[30],30:[31],31:[32],32:[0],
  33:[34],34:[26],
};
sanBlasNodes.forEach(n => n.next = sanBlasNext[n.id] || []);
// Extra fork: from node 7 can go to island 5
sanBlasNodes[7].next.push(25);

export const BOARD_SANBLAS = {
  id: 'sanblas',
  name: 'Archipiélago de San Blas',
  desc: 'Navega entre las islas paradisíacas de los Guna Yala',
  bg: '#004D6B',
  pathColor: '#00BCD4',
  tileColors: { green: '#4CAF50', red: '#F44336', blue: '#03A9F4', event: '#FF9800', start: '#E0E0E0' },
  nodes: sanBlasNodes,
  dynamicEvents: [
    { name: 'Tormenta destruye puente', from: 8, removeNext: 16 },
    { name: 'Nuevo puente construido', from: 10, addNext: 33 },
    { name: 'Marea baja abre camino', from: 7, addNext: 25 },
  ],
};

export const ALL_BOARDS = [BOARD_CANAL, BOARD_CASCO, BOARD_DARIEN, BOARD_SANBLAS];
