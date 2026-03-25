export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function graphDistance(board, fromId, toId) {
  const visited = new Set();
  const queue = [{ id: fromId, dist: 0 }];
  visited.add(fromId);
  while (queue.length) {
    const { id, dist } = queue.shift();
    if (id === toId) return dist;
    const node = board.nodes.find(n => n.id === id);
    if (!node) continue;
    for (const nxt of node.next) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        queue.push({ id: nxt, dist: dist + 1 });
      }
    }
  }
  return Infinity;
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export class EventEmitter {
  constructor() { this._handlers = {}; }
  on(evt, fn) {
    (this._handlers[evt] = this._handlers[evt] || []).push(fn);
    return () => this.off(evt, fn);
  }
  off(evt, fn) {
    if (this._handlers[evt]) this._handlers[evt] = this._handlers[evt].filter(f => f !== fn);
  }
  emit(evt, ...args) {
    (this._handlers[evt] || []).forEach(fn => fn(...args));
  }
}
