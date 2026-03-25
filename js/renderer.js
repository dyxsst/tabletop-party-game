import { CONFIG } from './config.js';
import { sleep } from './utils.js';

export class Renderer {
  constructor(state) {
    this.state = state;
    this.boardEl = null;
    this.svgEl = null;
    this.tileEls = {};
    this.playerTokens = {};
    this.starEl = null;
    this.tileSize = 36;
  }

  init(boardContainerId) {
    this.boardEl = document.getElementById(boardContainerId);
  }

  renderBoard() {
    if (!this.boardEl || !this.state.boardData) return;
    this.boardEl.innerHTML = '';
    const bd = this.state.boardData;
    this.boardEl.style.background = bd.bg || '#0f0f23';

    // SVG for paths
    this.svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgEl.classList.add('board-svg');
    this.svgEl.setAttribute('viewBox', '0 0 100 100');
    this.svgEl.setAttribute('preserveAspectRatio', 'none');
    this.boardEl.appendChild(this.svgEl);

    // Draw paths
    for (const node of bd.nodes) {
      for (const nxtId of node.next) {
        const nxt = bd.nodes.find(n => n.id === nxtId);
        if (!nxt) continue;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', node.x);
        line.setAttribute('y1', node.y);
        line.setAttribute('x2', nxt.x);
        line.setAttribute('y2', nxt.y);
        line.setAttribute('stroke', bd.pathColor);
        line.setAttribute('stroke-width', '1.2');
        line.setAttribute('stroke-opacity', '0.6');
        line.setAttribute('stroke-linecap', 'round');
        this.svgEl.appendChild(line);

        // Arrow indicator
        const mx = (node.x + nxt.x) / 2;
        const my = (node.y + nxt.y) / 2;
        const angle = Math.atan2(nxt.y - node.y, nxt.x - node.x) * 180 / Math.PI;
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', '-0.8,-0.5 0.8,0 -0.8,0.5');
        arrow.setAttribute('fill', bd.pathColor);
        arrow.setAttribute('fill-opacity', '0.4');
        arrow.setAttribute('transform', `translate(${mx},${my}) rotate(${angle})`);
        this.svgEl.appendChild(arrow);
      }
    }

    // Draw tiles
    this.tileEls = {};
    for (const node of bd.nodes) {
      const el = document.createElement('div');
      el.className = `tile tile-${node.type}`;
      el.style.left = `${node.x}%`;
      el.style.top = `${node.y}%`;
      el.dataset.nodeId = node.id;

      const colors = bd.tileColors || {};
      el.style.setProperty('--tile-color', colors[node.type] || '#888');

      if (node.type === 'start') {
        el.innerHTML = '<span class="tile-label">🏁</span>';
      } else if (node.type === 'event') {
        el.innerHTML = '<span class="tile-label">❗</span>';
      } else if (node.type === 'green') {
        el.innerHTML = `<span class="tile-label">+${CONFIG.TILE_COINS.green}</span>`;
      } else if (node.type === 'red') {
        el.innerHTML = `<span class="tile-label">${CONFIG.TILE_COINS.red}</span>`;
      } else {
        el.innerHTML = `<span class="tile-label">+${CONFIG.TILE_COINS.blue}</span>`;
      }

      this.boardEl.appendChild(el);
      this.tileEls[node.id] = el;
    }

    // Star
    this.renderStar();

    // Player tokens
    this.renderPlayerTokens();
  }

  renderStar() {
    if (this.starEl) this.starEl.remove();
    if (this.state.starNodeId == null) return;
    const node = this.state.getNode(this.state.starNodeId);
    if (!node) return;
    this.starEl = document.createElement('div');
    this.starEl.className = 'star-marker';
    this.starEl.innerHTML = '⭐';
    this.starEl.style.left = `${node.x}%`;
    this.starEl.style.top = `${node.y}%`;
    this.boardEl.appendChild(this.starEl);
  }

  renderPlayerTokens() {
    // Remove old tokens
    Object.values(this.playerTokens).forEach(el => el.remove());
    this.playerTokens = {};

    const positions = {};
    this.state.players.forEach((p, i) => {
      if (!positions[p.position]) positions[p.position] = [];
      positions[p.position].push(i);
    });

    this.state.players.forEach((p, i) => {
      const node = this.state.getNode(p.position);
      if (!node) return;
      const el = document.createElement('div');
      el.className = 'player-token';
      el.style.setProperty('--player-color', p.color);
      el.innerHTML = p.emoji;

      const samePos = positions[p.position];
      const offsetIdx = samePos.indexOf(i);
      const offsets = this.getTokenOffsets(samePos.length);
      const ox = offsets[offsetIdx]?.x || 0;
      const oy = offsets[offsetIdx]?.y || 0;

      el.style.left = `calc(${node.x}% + ${ox}px)`;
      el.style.top = `calc(${node.y}% + ${oy}px)`;
      el.dataset.playerIndex = i;
      this.boardEl.appendChild(el);
      this.playerTokens[i] = el;
    });
  }

  getTokenOffsets(count) {
    if (count === 1) return [{ x: 0, y: -20 }];
    const offsets = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      offsets.push({ x: Math.cos(angle) * 14, y: -20 + Math.sin(angle) * 10 });
    }
    return offsets;
  }

  async animatePlayerMove(playerIdx, fromNode, toNode) {
    const token = this.playerTokens[playerIdx];
    if (!token) return;
    token.style.transition = `left ${CONFIG.ANIMATION_SPEED}ms ease, top ${CONFIG.ANIMATION_SPEED}ms ease`;
    token.style.left = `${toNode.x}%`;
    token.style.top = `calc(${toNode.y}% - 20px)`;
    await sleep(CONFIG.ANIMATION_SPEED + 50);
  }

  highlightTile(nodeId, active = true) {
    const el = this.tileEls[nodeId];
    if (el) el.classList.toggle('tile-highlight', active);
  }

  highlightForkOptions(nodeIds) {
    nodeIds.forEach(id => this.highlightTile(id, true));
  }

  clearHighlights() {
    Object.values(this.tileEls).forEach(el => el.classList.remove('tile-highlight', 'tile-current'));
  }

  highlightCurrentTile(nodeId) {
    this.clearHighlights();
    const el = this.tileEls[nodeId];
    if (el) el.classList.add('tile-current');
  }
}
