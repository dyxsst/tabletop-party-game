import { CONFIG } from './config.js';
import { EventEmitter, shuffle, deepClone, graphDistance } from './utils.js';

export class GameState extends EventEmitter {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.phase = 'title'; // title|setup|playing|minigame|awards|results
    this.board = null;
    this.boardData = null; // deep clone of board for dynamic mods
    this.players = [];
    this.turnOrder = [];
    this.currentPlayerIndex = 0;
    this.round = 1;
    this.starNodeId = null;
    this.starsBought = 0;
    this.usedTriviaQuestions = new Set();
    this.usedSongs = new Set();
    this.usedMinigames = [];
    this.minigameHistory = [];
    this.stats = {};
    this.pendingFork = null;
    this.pendingStarOffer = false;
    this.movesRemaining = 0;
    this.gameLog = [];
  }

  initGame(boardDef, players) {
    this.boardData = deepClone(boardDef);
    this.board = boardDef;
    this.players = players.map((p, i) => ({
      ...p,
      coins: CONFIG.STARTING_COINS,
      stars: 0,
      position: 0, // start node
      gamesWon: 0,
      spacesMoved: 0,
      coinsEarned: 0,
      eventsTriggered: 0,
    }));
    this.turnOrder = shuffle([...Array(players.length).keys()]);
    this.currentPlayerIndex = 0;
    this.round = 1;
    this.starsBought = 0;
    this.placeStarFarFromPlayers();
    this.phase = 'playing';
    this.emit('gameStarted');
  }

  get currentPlayer() {
    return this.players[this.turnOrder[this.currentPlayerIndex]];
  }

  get currentTurnPlayerIndex() {
    return this.turnOrder[this.currentPlayerIndex];
  }

  addCoins(playerIdx, amount) {
    const p = this.players[playerIdx];
    p.coins = Math.max(0, p.coins + amount);
    if (amount > 0) p.coinsEarned += amount;
    this.emit('coinsChanged', playerIdx, p.coins, amount);
  }

  addStar(playerIdx) {
    this.players[playerIdx].stars++;
    this.starsBought++;
    this.addCoins(playerIdx, -CONFIG.STAR_COST);
    this.emit('starBought', playerIdx, this.starsBought);
    if (this.starsBought >= CONFIG.TOTAL_STARS) {
      this.phase = 'awards';
      this.emit('gameOver');
    } else {
      this.placeStarFarFromPlayers();
    }
  }

  placeStarFarFromPlayers() {
    const nodes = this.boardData.nodes;
    const playerPositions = this.players.map(p => p.position);
    let bestNode = null;
    let bestMinDist = -1;
    for (const node of nodes) {
      if (node.type === 'start') continue;
      const minDist = Math.min(...playerPositions.map(pos =>
        graphDistance(this.boardData, pos, node.id)
      ));
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestNode = node.id;
      }
    }
    this.starNodeId = bestNode ?? nodes[Math.floor(nodes.length / 2)].id;
    this.emit('starPlaced', this.starNodeId);
  }

  nextTurn() {
    this.currentPlayerIndex++;
    if (this.currentPlayerIndex >= this.turnOrder.length) {
      this.currentPlayerIndex = 0;
      this.round++;
      this.emit('roundEnd', this.round - 1);
      return 'roundEnd';
    }
    this.emit('turnStart', this.currentTurnPlayerIndex);
    return 'nextPlayer';
  }

  movePlayer(playerIdx, nodeId) {
    this.players[playerIdx].position = nodeId;
    this.players[playerIdx].spacesMoved++;
    this.emit('playerMoved', playerIdx, nodeId);
  }

  getNode(nodeId) {
    return this.boardData.nodes.find(n => n.id === nodeId);
  }

  getNextNodes(nodeId) {
    const node = this.getNode(nodeId);
    return node ? node.next.map(id => this.getNode(id)) : [];
  }

  applyBoardEvent(event) {
    const node = this.boardData.nodes.find(n => n.id === event.from);
    if (!node) return;
    if (event.addNext && !node.next.includes(event.addNext)) {
      node.next.push(event.addNext);
    }
    if (event.removeNext && node.next.length > 1) {
      node.next = node.next.filter(n => n !== event.removeNext);
    }
    this.emit('boardChanged', event);
  }

  calculateAwards() {
    const awards = [];
    const ps = this.players;
    // Most games won
    const maxWins = Math.max(...ps.map(p => p.gamesWon));
    if (maxWins > 0) {
      const winners = ps.filter(p => p.gamesWon === maxWins);
      awards.push({ name: 'Campeonísimo', desc: 'Ganó más minijuegos', emoji: '🏆', coins: 10, players: winners.map(w => ps.indexOf(w)) });
    }
    // Most spaces moved
    const maxMoves = Math.max(...ps.map(p => p.spacesMoved));
    if (maxMoves > 0) {
      const w = ps.filter(p => p.spacesMoved === maxMoves);
      awards.push({ name: 'Trotamundos', desc: 'Se movió más espacios', emoji: '🏃', coins: 5, players: w.map(x => ps.indexOf(x)) });
    }
    // Most coins earned
    const maxEarned = Math.max(...ps.map(p => p.coinsEarned));
    if (maxEarned > 0) {
      const w = ps.filter(p => p.coinsEarned === maxEarned);
      awards.push({ name: 'Ricachón', desc: 'Ganó más monedas en total', emoji: '💰', coins: 5, players: w.map(x => ps.indexOf(x)) });
    }
    // Most events triggered
    const maxEvts = Math.max(...ps.map(p => p.eventsTriggered));
    if (maxEvts > 0) {
      const w = ps.filter(p => p.eventsTriggered === maxEvts);
      awards.push({ name: 'Aventurero', desc: 'Participó en más eventos', emoji: '🎲', coins: 5, players: w.map(x => ps.indexOf(x)) });
    }
    // Comeback star: player with fewest stars gets a bonus star if behind by 2+
    const minStars = Math.min(...ps.map(p => p.stars));
    const maxStars = Math.max(...ps.map(p => p.stars));
    if (maxStars - minStars >= 2) {
      const w = ps.filter(p => p.stars === minStars);
      awards.push({ name: 'Remontada', desc: '¡Estrella de consolación!', emoji: '⭐', star: true, players: w.map(x => ps.indexOf(x)) });
    }
    // Unlucky: landed on most red tiles (track via negative coin events)
    // Event master: triggered most board events
    return awards;
  }

  getFinalRankings() {
    return [...this.players]
      .map((p, i) => ({ ...p, index: i }))
      .sort((a, b) => b.stars - a.stars || b.coins - a.coins);
  }
}
