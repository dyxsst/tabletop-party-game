import { MinigameBase } from './base.js';

export class MemoryMatchGame extends MinigameBase {
  static id = 'memory-match';
  static name = 'Memoria';
  static description = 'Encuentra los pares de cartas iguales';
  static rules = 'Se muestran cartas boca abajo. Los jugadores se turnan volteando 2 cartas. Si son iguales, ganan un punto.';
  static types = ['1v1', 'ffa'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 10;

  async play() {
    const participants = this.getParticipants();
    const scores = {};
    participants.forEach(i => scores[i] = 0);

    const emojis = ['🌮', '🎸', '🌺', '🦜', '🌴', '🎭', '🐠', '🌊'];
    const pairCount = Math.min(8, 4 + participants.length);
    const selected = emojis.slice(0, pairCount);
    const cards = [...selected, ...selected].sort(() => Math.random() - 0.5);
    const revealed = new Array(cards.length).fill(false);
    const matched = new Array(cards.length).fill(false);

    return new Promise(resolve => {
      let currentTurn = 0;
      let firstPick = null;
      let locked = false;
      let pairsFound = 0;

      const render = () => {
        const cp = participants[currentTurn % participants.length];
        this.container.innerHTML = `
          <div class="memory-game">
            <h2>🧠 Memoria</h2>
            <div class="memory-turn">Turno: ${this.players[cp].emoji} ${this.escapeHtml(this.players[cp].name)}</div>
            <div class="memory-scores">${participants.map(i =>
              `<span class="qm-score" style="--pc:${this.players[i].color}">${this.players[i].emoji} ${scores[i]}</span>`
            ).join('')}</div>
            <div class="memory-grid" style="--cols:${Math.ceil(Math.sqrt(cards.length))}">
              ${cards.map((emoji, idx) => `
                <button class="memory-card ${matched[idx] ? 'memory-matched' : ''} ${revealed[idx] ? 'memory-revealed' : ''}"
                  data-idx="${idx}" ${matched[idx] || revealed[idx] ? 'disabled' : ''}>
                  ${revealed[idx] || matched[idx] ? emoji : '❓'}
                </button>`).join('')}
            </div>
          </div>`;

        if (!locked) {
          this.container.querySelectorAll('.memory-card:not([disabled])').forEach(btn => {
            btn.onclick = () => {
              const idx = parseInt(btn.dataset.idx);
              if (revealed[idx] || matched[idx] || locked) return;
              revealed[idx] = true;

              if (firstPick === null) {
                firstPick = idx;
                render();
              } else {
                locked = true;
                render();
                const cp = participants[currentTurn % participants.length];
                setTimeout(() => {
                  if (cards[firstPick] === cards[idx]) {
                    matched[firstPick] = true;
                    matched[idx] = true;
                    scores[cp]++;
                    pairsFound++;
                  } else {
                    currentTurn++;
                  }
                  revealed[firstPick] = false;
                  revealed[idx] = false;
                  firstPick = null;
                  locked = false;

                  if (pairsFound >= pairCount) {
                    finish();
                  } else {
                    render();
                  }
                }, 1000);
              }
            };
          });
        }
      };

      const finish = () => {
        const maxScore = Math.max(...Object.values(scores));
        const winners = participants.filter(i => scores[i] === maxScore);
        const losers = participants.filter(i => !winners.includes(i));
        resolve({ winners, losers, reward: MemoryMatchGame.coinReward, gameName: MemoryMatchGame.name });
      };

      render();
    });
  }
}
