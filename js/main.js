import { GameState } from './gameState.js';
import { Engine } from './engine.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { ALL_BOARDS } from './boards.js';
import { CHARACTERS } from './characters.js';
import { MinigameRegistry } from './minigames/registry.js';
import { CONFIG } from './config.js';
import { shuffle, sleep } from './utils.js';

class App {
  constructor() {
    this.state = new GameState();
    this.renderer = new Renderer(this.state);
    this.ui = new UI(this.state);
    this.engine = new Engine(this.state, this.renderer, this.ui);
    this.registry = new MinigameRegistry();
    this.selectedBoard = null;
    this.setupPlayers = [];
    this.takenCharacters = new Set();
  }

  init() {
    this.renderer.init('board-area');
    this.bindEvents();
    this.ui.showScreen('screen-title');
  }

  bindEvents() {
    // Title
    document.getElementById('btn-start').onclick = () => this.showSetup();

    // Setup - board
    document.getElementById('board-options').onclick = (e) => {
      const card = e.target.closest('.board-card');
      if (!card) return;
      document.querySelectorAll('.board-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      this.selectedBoard = ALL_BOARDS.find(b => b.id === card.dataset.boardId);
      this.checkStartReady();
    };

    // Setup - add player
    document.getElementById('btn-add-player').onclick = () => this.addPlayerSlot();
    document.getElementById('btn-start-game').onclick = () => this.startGame();

    // Board - dice
    document.getElementById('btn-roll-dice').onclick = () => this.onRollDice();

    // Board - end turn skip (continue)
    document.getElementById('btn-continue-turn').onclick = () => this.onContinueTurn();
  }

  // ─── Setup Screen ───────────────────────────────────────
  showSetup() {
    this.ui.showScreen('screen-setup');
    this.renderBoardOptions();
    this.setupPlayers = [];
    this.takenCharacters.clear();
    this.addPlayerSlot();
    this.addPlayerSlot();
    this.checkStartReady();
  }

  renderBoardOptions() {
    const container = document.getElementById('board-options');
    container.innerHTML = ALL_BOARDS.map(b => `
      <div class="board-card" data-board-id="${b.id}" style="--board-bg:${b.bg}">
        <div class="board-card-name">${b.name}</div>
        <div class="board-card-desc">${b.desc}</div>
        <div class="board-card-preview" style="background:${b.bg}">
          ${b.nodes.slice(0, 8).map(n => `<span class="preview-dot" style="left:${n.x}%;top:${n.y}%;background:${b.tileColors[n.type]}"></span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  addPlayerSlot() {
    if (this.setupPlayers.length >= 8) return;
    const idx = this.setupPlayers.length;
    this.setupPlayers.push({ name: '', character: null });
    this.renderPlayerSlots();
  }

  renderPlayerSlots() {
    const container = document.getElementById('player-slots');
    container.innerHTML = this.setupPlayers.map((p, i) => `
      <div class="player-slot" data-index="${i}">
        <div class="slot-header">
          <span class="slot-number">Jugador ${i + 1}</span>
          ${this.setupPlayers.length > 2 ? `<button class="slot-remove" data-remove="${i}">✕</button>` : ''}
        </div>
        <input class="slot-name" type="text" placeholder="Nombre del jugador" value="${this.escapeAttr(p.name)}" data-index="${i}" maxlength="20">
        <div class="slot-characters">
          ${CHARACTERS.map(c => {
            const taken = this.takenCharacters.has(c.id) && p.character !== c.id;
            return `<button class="char-btn ${p.character === c.id ? 'char-selected' : ''} ${taken ? 'char-taken' : ''}"
              data-player="${i}" data-char="${c.id}" ${taken ? 'disabled' : ''}
              style="--cc:${c.color}" title="${c.name}: ${c.desc}">
              <span class="char-emoji">${c.emoji}</span>
              <span class="char-name">${c.name}</span>
            </button>`;
          }).join('')}
        </div>
      </div>
    `).join('');

    // Bind events
    container.querySelectorAll('.slot-name').forEach(input => {
      input.oninput = () => {
        const idx = parseInt(input.dataset.index);
        this.setupPlayers[idx].name = input.value;
        this.checkStartReady();
      };
    });

    container.querySelectorAll('.char-btn:not([disabled])').forEach(btn => {
      btn.onclick = () => {
        const pi = parseInt(btn.dataset.player);
        const charId = btn.dataset.char;
        // Deselect previous
        if (this.setupPlayers[pi].character) {
          this.takenCharacters.delete(this.setupPlayers[pi].character);
        }
        this.setupPlayers[pi].character = charId;
        this.takenCharacters.add(charId);
        this.renderPlayerSlots();
        this.checkStartReady();
      };
    });

    container.querySelectorAll('.slot-remove').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.remove);
        if (this.setupPlayers[idx].character) {
          this.takenCharacters.delete(this.setupPlayers[idx].character);
        }
        this.setupPlayers.splice(idx, 1);
        this.renderPlayerSlots();
        this.checkStartReady();
      };
    });

    // Update add button visibility
    const addBtn = document.getElementById('btn-add-player');
    addBtn.style.display = this.setupPlayers.length >= 8 ? 'none' : 'flex';
  }

  checkStartReady() {
    const ready = this.selectedBoard &&
      this.setupPlayers.length >= 2 &&
      this.setupPlayers.every(p => p.name.trim() && p.character);
    document.getElementById('btn-start-game').disabled = !ready;
  }

  // ─── Game Start ─────────────────────────────────────────
  startGame() {
    const players = this.setupPlayers.map(p => {
      const char = CHARACTERS.find(c => c.id === p.character);
      return { name: p.name.trim(), characterId: char.id, emoji: char.emoji, color: char.color };
    });

    this.state.initGame(this.selectedBoard, players);
    this.ui.showScreen('screen-board');
    this.renderer.renderBoard();
    this.ui.updateHUD();
    this.ui.updateRoundInfo();
    this.updateStarsRemaining();
    this.startTurn();
  }

  // ─── Turn Flow ──────────────────────────────────────────
  startTurn() {
    const p = this.state.currentPlayer;
    this.ui.updateHUD();
    this.ui.updateTurnInfo(`Turno de ${p.name}`);
    this.renderer.highlightCurrentTile(p.position);
    this.ui.showDiceButton(true);
    document.getElementById('btn-continue-turn').style.display = 'none';
    this.ui.hideDice();
  }

  async onRollDice() {
    this.ui.showDiceButton(false);
    const value = this.engine.rollDice();
    await this.engine.animateDiceRoll(value);

    const pi = this.state.currentTurnPlayerIndex;
    const result = await this.engine.movePlayerSteps(pi, value);

    if (result === 'gameOver') {
      this.ui.hideDice();
      return this.showAwards();
    }

    this.renderer.renderPlayerTokens();
    this.ui.updateHUD();

    // Handle tile effect
    const tileResult = await this.engine.handleTileEffect(pi);
    this.ui.updateHUD();

    // Check star
    const starResult = await this.engine.checkStarPurchase(pi);
    if (starResult === 'gameOver') {
      return this.showAwards();
    }
    this.ui.updateHUD();
    this.renderer.renderBoard();
    this.updateStarsRemaining();

    // Show continue button
    this.ui.hideDice();
    document.getElementById('btn-continue-turn').style.display = 'flex';
  }

  async onContinueTurn() {
    document.getElementById('btn-continue-turn').style.display = 'none';
    const result = this.state.nextTurn();

    if (result === 'roundEnd') {
      // Minigame time!
      await this.playMinigame();
      this.ui.showScreen('screen-board');
      this.renderer.renderBoard();
      this.ui.updateHUD();
      this.ui.updateRoundInfo();
    }

    this.startTurn();
  }

  // ─── Minigame Flow ──────────────────────────────────────
  async playMinigame() {
    const matchType = this.engine.selectMinigameType();
    const matchInfo = this.engine.assignMinigamePlayers(matchType);
    const GameClass = this.registry.selectGame(matchType, this.state.players.length);

    if (!GameClass) {
      await this.ui.showNotification('No hay minijuegos disponibles para este modo', 2000);
      return;
    }

    this.ui.showScreen('screen-minigame');

    // Show intro
    const introContainer = document.getElementById('minigame-intro');
    const gameContainer = document.getElementById('minigame-container');
    const resultContainer = document.getElementById('minigame-result');

    introContainer.style.display = 'flex';
    gameContainer.style.display = 'none';
    resultContainer.style.display = 'none';

    introContainer.innerHTML = `
      <div class="mg-intro">
        <div class="mg-intro-type">${this.getMatchTypeLabel(matchInfo.type)}</div>
        <h2>${GameClass.icon || '🎮'} ${GameClass.name}</h2>
        <p class="mg-intro-desc">${GameClass.description}</p>
        <div class="mg-intro-rules">${GameClass.rules}</div>
        <div class="mg-intro-players">
          ${this.renderMatchPlayers(matchInfo)}
        </div>
        <div class="mg-intro-reward">🏆 Premio: ${GameClass.coinReward} monedas</div>
        <button class="mg-start-btn" id="btn-mg-start">¡Comenzar!</button>
      </div>`;

    await new Promise(resolve => {
      document.getElementById('btn-mg-start').onclick = resolve;
    });

    // Play game
    introContainer.style.display = 'none';
    gameContainer.style.display = 'flex';

    const game = new GameClass(this.state.players, matchInfo, gameContainer, this.state);
    const results = await game.play();
    game.destroy();

    // Show results
    gameContainer.style.display = 'none';
    resultContainer.style.display = 'flex';
    this.engine.distributeMinigameRewards(results);

    resultContainer.innerHTML = `
      <div class="mg-results">
        <h2>🏆 Resultados</h2>
        <div class="mg-result-game">${results.gameName || GameClass.name}</div>
        <div class="mg-winners">
          <h3>🥇 Ganadores (+${results.reward || CONFIG.MINIGAME_REWARD} 💰)</h3>
          ${results.winners.map(i => `<span class="mg-winner">${this.state.players[i].emoji} ${this.state.players[i].name}</span>`).join('')}
        </div>
        ${results.losers.length ? `<div class="mg-losers">
          <h3>😅 (-${CONFIG.MINIGAME_PENALTY} 💰)</h3>
          ${results.losers.map(i => `<span class="mg-loser">${this.state.players[i].emoji} ${this.state.players[i].name}</span>`).join('')}
        </div>` : ''}
        <button class="mg-continue-btn" id="btn-mg-continue">Volver al tablero</button>
      </div>`;

    this.ui.updateHUD();

    await new Promise(resolve => {
      document.getElementById('btn-mg-continue').onclick = resolve;
    });
  }

  getMatchTypeLabel(type) {
    const labels = { '1v1': '⚔️ 1 vs 1', 'ffa': '🎯 Todos contra Todos', 'teams': '👥 Equipos', '1vAll': '😈 1 vs Todos' };
    return labels[type] || type;
  }

  renderMatchPlayers(matchInfo) {
    if (matchInfo.type === 'teams') {
      return matchInfo.teams.map((team, ti) =>
        `<div class="mg-team-preview">
          <div class="mg-team-name">Equipo ${ti + 1}</div>
          ${team.map(i => `<span class="mg-player-chip" style="--pc:${this.state.players[i].color}">${this.state.players[i].emoji} ${this.state.players[i].name}</span>`).join('')}
        </div>`
      ).join('<span class="mg-vs">VS</span>');
    }
    if (matchInfo.type === '1v1') {
      return `<span class="mg-player-chip" style="--pc:${this.state.players[matchInfo.teams[0][0]].color}">${this.state.players[matchInfo.teams[0][0]].emoji} ${this.state.players[matchInfo.teams[0][0]].name}</span>
        <span class="mg-vs">VS</span>
        <span class="mg-player-chip" style="--pc:${this.state.players[matchInfo.teams[1][0]].color}">${this.state.players[matchInfo.teams[1][0]].emoji} ${this.state.players[matchInfo.teams[1][0]].name}</span>`;
    }
    if (matchInfo.type === '1vAll') {
      return `<span class="mg-player-chip" style="--pc:${this.state.players[matchInfo.teams[0][0]].color}">${this.state.players[matchInfo.teams[0][0]].emoji} ${this.state.players[matchInfo.teams[0][0]].name}</span>
        <span class="mg-vs">VS</span>
        <span>${matchInfo.teams[1].map(i => `<span class="mg-player-chip" style="--pc:${this.state.players[i].color}">${this.state.players[i].emoji}</span>`).join('')}</span>`;
    }
    return matchInfo.teams.flat().map(i =>
      `<span class="mg-player-chip" style="--pc:${this.state.players[i].color}">${this.state.players[i].emoji} ${this.state.players[i].name}</span>`
    ).join(' ');
  }

  // ─── Awards & Results ───────────────────────────────────
  async showAwards() {
    this.ui.showScreen('screen-awards');
    const awards = this.state.calculateAwards();

    // Apply award bonuses
    for (const award of awards) {
      for (const pi of award.players) {
        if (award.coins) this.state.addCoins(pi, award.coins);
        if (award.star) this.state.players[pi].stars++;
      }
    }

    const awardsContainer = document.getElementById('awards-list');
    awardsContainer.innerHTML = '';

    for (const award of awards) {
      const div = document.createElement('div');
      div.className = 'award-card';
      div.innerHTML = `
        <div class="award-emoji">${award.emoji}</div>
        <div class="award-name">${award.name}</div>
        <div class="award-desc">${award.desc}</div>
        <div class="award-winners">${award.players.map(i =>
          `${this.state.players[i].emoji} ${this.state.players[i].name}`
        ).join(', ')}</div>
        <div class="award-bonus">${award.coins ? `+${award.coins} 💰` : ''}${award.star ? ' +1 ⭐' : ''}</div>`;
      awardsContainer.appendChild(div);
      await sleep(1200);
    }

    document.getElementById('btn-show-results').style.display = 'flex';
    document.getElementById('btn-show-results').onclick = () => this.showFinalResults();
  }

  showFinalResults() {
    this.ui.showScreen('screen-results');
    const rankings = this.state.getFinalRankings();
    const podiumEmojis = ['🥇', '🥈', '🥉'];

    document.getElementById('results-list').innerHTML = rankings.map((p, i) => `
      <div class="result-row ${i === 0 ? 'result-winner' : ''}">
        <span class="result-position">${podiumEmojis[i] || `#${i + 1}`}</span>
        <span class="result-emoji">${p.emoji}</span>
        <span class="result-name">${this.escapeHtml(p.name)}</span>
        <span class="result-stars">${'⭐'.repeat(p.stars)}</span>
        <span class="result-coins">💰${p.coins}</span>
      </div>
    `).join('');

    document.getElementById('btn-play-again').onclick = () => {
      this.state.reset();
      this.showSetup();
    };
  }

  updateStarsRemaining() {
    const el = document.getElementById('stars-remaining');
    if (el) el.textContent = CONFIG.TOTAL_STARS - this.state.starsBought;
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
