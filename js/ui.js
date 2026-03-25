import { CONFIG } from './config.js';
import { sleep, randomInt } from './utils.js';

export class UI {
  constructor(state) {
    this.state = state;
  }

  // ─── HUD ─────────────────────────────────────────────────
  updateHUD() {
    const hud = document.getElementById('hud-players');
    if (!hud) return;
    hud.innerHTML = this.state.players.map((p, i) => {
      const isCurrent = this.state.phase === 'playing' && i === this.state.currentTurnPlayerIndex;
      return `<div class="hud-player ${isCurrent ? 'hud-current' : ''}" style="--pc:${p.color}">
        <span class="hud-emoji">${p.emoji}</span>
        <span class="hud-name">${this.escapeHtml(p.name)}</span>
        <span class="hud-coins">💰${p.coins}</span>
        <span class="hud-stars">${'⭐'.repeat(p.stars)}${'☆'.repeat(Math.max(0, CONFIG.TOTAL_STARS - p.stars - (CONFIG.TOTAL_STARS - this.state.starsBought)))}</span>
      </div>`;
    }).join('');
  }

  updateTurnInfo(text) {
    const el = document.getElementById('turn-info');
    if (el) el.textContent = text;
  }

  updateRoundInfo() {
    const el = document.getElementById('round-info');
    if (el) el.textContent = `Ronda ${this.state.round}`;
  }

  // ─── Dice ────────────────────────────────────────────────
  showDiceButton(visible = true) {
    const btn = document.getElementById('btn-roll-dice');
    if (btn) btn.style.display = visible ? 'flex' : 'none';
  }

  async animateDice(value) {
    const el = document.getElementById('dice-display');
    if (!el) return value;
    el.style.display = 'flex';
    el.classList.add('dice-rolling');
    const interval = setInterval(() => {
      el.textContent = randomInt(1, 10);
    }, 80);
    await sleep(CONFIG.DICE_ANIMATION_MS);
    clearInterval(interval);
    el.textContent = value;
    el.classList.remove('dice-rolling');
    el.classList.add('dice-result');
    await sleep(600);
    el.classList.remove('dice-result');
    return value;
  }

  hideDice() {
    const el = document.getElementById('dice-display');
    if (el) el.style.display = 'none';
  }

  // ─── Fork Choice ─────────────────────────────────────────
  showForkChoice(playerIdx, options) {
    return new Promise(resolve => {
      const overlay = document.getElementById('fork-overlay');
      overlay.innerHTML = `<div class="fork-dialog">
        <h3>¡Bifurcación! ${this.state.players[playerIdx].emoji} elige dirección</h3>
        <div class="fork-options">${options.map(n => `
          <button class="fork-btn" data-node="${n.id}">
            <span class="fork-tile tile-${n.type}" style="--tile-color:${this.state.boardData.tileColors[n.type]}"></span>
            <span>${n.type === 'green' ? '+' + CONFIG.TILE_COINS.green : n.type === 'red' ? CONFIG.TILE_COINS.red : n.type === 'event' ? '❗' : '+' + CONFIG.TILE_COINS.blue} →</span>
          </button>`).join('')}
        </div></div>`;
      overlay.style.display = 'flex';
      overlay.querySelectorAll('.fork-btn').forEach(btn => {
        btn.onclick = () => {
          const nodeId = parseInt(btn.dataset.node);
          overlay.style.display = 'none';
          resolve(options.find(n => n.id === nodeId));
        };
      });
    });
  }

  // ─── Star Purchase ───────────────────────────────────────
  offerStarPurchase(playerIdx) {
    return new Promise(resolve => {
      const p = this.state.players[playerIdx];
      const overlay = document.getElementById('star-overlay');
      overlay.innerHTML = `<div class="star-dialog">
        <div class="star-big">⭐</div>
        <h2>¡Estrella disponible!</h2>
        <p>${this.escapeHtml(p.name)}, ¿deseas comprar una estrella por ${CONFIG.STAR_COST} monedas?</p>
        <p>Tienes 💰${p.coins} monedas</p>
        <div class="star-buttons">
          <button class="btn-buy" id="btn-buy-star">¡Sí, comprar! ⭐</button>
          <button class="btn-skip" id="btn-skip-star">No, gracias</button>
        </div>
      </div>`;
      overlay.style.display = 'flex';
      document.getElementById('btn-buy-star').onclick = () => { overlay.style.display = 'none'; resolve(true); };
      document.getElementById('btn-skip-star').onclick = () => { overlay.style.display = 'none'; resolve(false); };
    });
  }

  // ─── Coin Effect ─────────────────────────────────────────
  async showCoinEffect(playerIdx, amount) {
    const el = document.getElementById('coin-effect');
    const p = this.state.players[playerIdx];
    el.innerHTML = `<div class="coin-popup ${amount >= 0 ? 'coin-gain' : 'coin-loss'}">
      <span class="coin-emoji">${p.emoji}</span>
      <span class="coin-amount">${amount >= 0 ? '+' : ''}${amount} 💰</span>
    </div>`;
    el.style.display = 'flex';
    await sleep(1200);
    el.style.display = 'none';
  }

  // ─── Board Event ─────────────────────────────────────────
  async showBoardEvent(event) {
    const el = document.getElementById('event-overlay');
    el.innerHTML = `<div class="event-dialog">
      <div class="event-icon">🌊</div>
      <h3>¡Evento del tablero!</h3>
      <p>${this.escapeHtml(event.name)}</p>
      <p class="event-desc">${event.addNext ? 'Se abre un nuevo camino' : 'Un camino se cierra'}</p>
      <button class="btn-continue" id="btn-event-ok">Continuar</button>
    </div>`;
    el.style.display = 'flex';
    return new Promise(resolve => {
      document.getElementById('btn-event-ok').onclick = () => {
        el.style.display = 'none';
        resolve();
      };
    });
  }

  // ─── Notifications ───────────────────────────────────────
  async showNotification(text, duration = 2000) {
    const el = document.getElementById('notification');
    el.textContent = text;
    el.classList.add('show');
    await sleep(duration);
    el.classList.remove('show');
  }

  // ─── Screen Management ──────────────────────────────────
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(screenId);
    if (el) el.classList.add('active');
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
