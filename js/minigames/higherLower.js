import { MinigameBase } from './base.js';

export class HigherLowerGame extends MinigameBase {
  static id = 'higher-lower';
  static name = 'Mayor o Menor';
  static description = 'Adivina si el siguiente número será mayor o menor';
  static rules = 'Se muestra un número. Adivina si el siguiente será mayor o menor. ¡No fallas o estás fuera!';
  static types = ['ffa', '1v1'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 10;

  async play() {
    const participants = [...this.getParticipants()];
    const alive = new Set(participants);
    let currentNumber = Math.floor(Math.random() * 100) + 1;

    return new Promise(resolve => {
      let turnIdx = 0;

      const nextTurn = () => {
        if (alive.size <= 1) return finish();
        const aliveArr = [...alive];
        const current = aliveArr[turnIdx % aliveArr.length];

        const nextNumber = Math.floor(Math.random() * 100) + 1;

        this.container.innerHTML = `
          <div class="hl-game">
            <h2>🔢 Mayor o Menor</h2>
            <div class="hl-alive">Quedan: ${aliveArr.map(i =>
              `<span class="qm-score" style="--pc:${this.players[i].color}">${this.players[i].emoji}</span>`
            ).join('')}</div>
            <div class="hl-current-number">${currentNumber}</div>
            <div class="hl-turn">${this.players[current].emoji} ${this.escapeHtml(this.players[current].name)}, ¿el siguiente número será...</div>
            <div class="hl-choices">
              <button class="hl-btn hl-higher" data-choice="higher">⬆️ Mayor</button>
              <button class="hl-btn hl-lower" data-choice="lower">⬇️ Menor</button>
            </div>
          </div>`;

        this.container.querySelectorAll('.hl-btn').forEach(btn => {
          btn.onclick = () => {
            const choice = btn.dataset.choice;
            const correct = (choice === 'higher' && nextNumber >= currentNumber) ||
                          (choice === 'lower' && nextNumber <= currentNumber);

            this.container.querySelector('.hl-current-number').textContent = `${currentNumber} → ${nextNumber}`;

            if (!correct) {
              alive.delete(current);
              this.container.querySelector('.hl-turn').textContent =
                `${this.players[current].emoji} ¡Eliminado! Era ${nextNumber}`;
            } else {
              this.container.querySelector('.hl-turn').textContent =
                `${this.players[current].emoji} ¡Correcto! Era ${nextNumber}`;
            }

            currentNumber = nextNumber;
            turnIdx++;
            setTimeout(nextTurn, 1500);
          };
        });
      };

      const finish = () => {
        const winners = [...alive];
        const losers = participants.filter(i => !alive.has(i));
        if (winners.length === 0) {
          // Everyone eliminated — last eliminated wins
          resolve({ winners: [participants[participants.length - 1]], losers: participants.slice(0, -1), reward: HigherLowerGame.coinReward, gameName: HigherLowerGame.name });
        } else {
          resolve({ winners, losers, reward: HigherLowerGame.coinReward, gameName: HigherLowerGame.name });
        }
      };

      nextTurn();
    });
  }
}
