import { CONFIG } from './config.js';
import { randomInt, pick, sleep } from './utils.js';

export class Engine {
  constructor(state, renderer, ui) {
    this.state = state;
    this.renderer = renderer;
    this.ui = ui;
    this._animating = false;
  }

  rollDice() {
    return randomInt(CONFIG.DICE_MIN, CONFIG.DICE_MAX);
  }

  async animateDiceRoll(targetValue) {
    return this.ui.animateDice(targetValue);
  }

  async movePlayerSteps(playerIdx, steps) {
    this._animating = true;
    let currentNode = this.state.getNode(this.state.players[playerIdx].position);
    for (let i = 0; i < steps; i++) {
      const nextNodes = currentNode.next.map(id => this.state.getNode(id)).filter(Boolean);
      if (nextNodes.length === 0) break;
      let nextNode;
      if (nextNodes.length > 1) {
        nextNode = await this.ui.showForkChoice(playerIdx, nextNodes);
      } else {
        nextNode = nextNodes[0];
      }
      this.state.movePlayer(playerIdx, nextNode.id);
      await this.renderer.animatePlayerMove(playerIdx, currentNode, nextNode);
      currentNode = nextNode;

      // If passing over star node mid-movement (not final landing)
      if (i < steps - 1 && currentNode.id === this.state.starNodeId) {
        if (this.state.players[playerIdx].coins >= CONFIG.STAR_COST) {
          const buy = await this.ui.offerStarPurchase(playerIdx);
          if (buy) {
            this.state.addStar(playerIdx);
            this.renderer.renderBoard();
            if (this.state.phase === 'awards') return 'gameOver';
          }
        }
      }
    }
    this._animating = false;
    return currentNode;
  }

  async handleTileEffect(playerIdx) {
    const player = this.state.players[playerIdx];
    const node = this.state.getNode(player.position);
    if (!node) return null;

    const coinDelta = CONFIG.TILE_COINS[node.type];
    if (coinDelta !== undefined) {
      this.state.addCoins(playerIdx, coinDelta);
      await this.ui.showCoinEffect(playerIdx, coinDelta);
    }

    if (node.type === 'event') {
      player.eventsTriggered++;
      // 30% chance of board modification event
      const boardEvents = this.state.boardData.dynamicEvents;
      if (boardEvents && boardEvents.length > 0 && Math.random() < 0.3) {
        const evt = pick(boardEvents);
        this.state.applyBoardEvent(evt);
        await this.ui.showBoardEvent(evt);
        this.renderer.renderBoard();
      }
      return 'event';
    }
    return node.type;
  }

  async checkStarPurchase(playerIdx) {
    const player = this.state.players[playerIdx];
    if (player.position === this.state.starNodeId && player.coins >= CONFIG.STAR_COST) {
      const buy = await this.ui.offerStarPurchase(playerIdx);
      if (buy) {
        this.state.addStar(playerIdx);
        this.renderer.renderBoard();
        if (this.state.phase === 'awards') return 'gameOver';
      }
    }
    return null;
  }

  selectMinigameType() {
    const count = this.state.players.length;
    const types = ['ffa'];
    if (count >= 2) types.push('1v1');
    if (count >= 3) types.push('1vAll');
    if (count >= 4) types.push('teams');
    return pick(types);
  }

  assignMinigamePlayers(matchType) {
    const players = [...Array(this.state.players.length).keys()];
    const shuffled = players.sort(() => Math.random() - 0.5);
    switch (matchType) {
      case '1v1': return { type: '1v1', teams: [[shuffled[0]], [shuffled[1]]], spectators: shuffled.slice(2) };
      case 'ffa': return { type: 'ffa', teams: shuffled.map(p => [p]), spectators: [] };
      case '1vAll': return { type: '1vAll', teams: [[shuffled[0]], shuffled.slice(1)], spectators: [] };
      case 'teams': {
        const mid = Math.ceil(shuffled.length / 2);
        return { type: 'teams', teams: [shuffled.slice(0, mid), shuffled.slice(mid)], spectators: [] };
      }
      default: return { type: 'ffa', teams: shuffled.map(p => [p]), spectators: [] };
    }
  }

  distributeMinigameRewards(results) {
    const { winners, losers, reward } = results;
    const coinReward = reward || CONFIG.MINIGAME_REWARD;
    const coinPenalty = CONFIG.MINIGAME_PENALTY;
    for (const idx of winners) {
      this.state.addCoins(idx, coinReward);
      this.state.players[idx].gamesWon++;
    }
    for (const idx of losers) {
      this.state.addCoins(idx, -coinPenalty);
    }
    this.state.minigameHistory.push(results);
  }
}
