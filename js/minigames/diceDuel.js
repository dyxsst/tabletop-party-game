import { MinigameBase } from './base.js';

export class DiceDuelGame extends MinigameBase {
  static id = 'dice-duel';
  static name = 'Duelo de Dados';
  static description = 'Lanza los dados y compite por el número más alto';
  static rules = 'Cada jugador lanza 2 dados. ¡La suma más alta gana!';
  static types = ['1v1', 'ffa'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 6;

  async play() {
    const participants = this.getParticipants();

    return new Promise(resolve => {
      const rolls = {};
      let current = 0;

      const nextPlayer = () => {
        if (current >= participants.length) return finish();
        const pi = participants[current];

        this.container.innerHTML = `
          <div class="dice-game">
            <h2>🎲 Duelo de Dados</h2>
            <div class="dice-results">${Object.entries(rolls).map(([idx, r]) =>
              `<div class="dice-result-row">
                ${this.players[idx].emoji} ${this.escapeHtml(this.players[idx].name)}: 🎲${r.d1} + 🎲${r.d2} = <strong>${r.total}</strong>
              </div>`).join('')}
            </div>
            <div class="dice-current">
              <div class="dice-current-player">${this.players[pi].emoji} ${this.escapeHtml(this.players[pi].name)}</div>
              <button class="dice-roll-btn" id="btn-dice-roll">🎲 Lanzar Dados</button>
            </div>
          </div>`;

        document.getElementById('btn-dice-roll').onclick = () => {
          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          rolls[pi] = { d1, d2, total: d1 + d2 };
          const btn = document.getElementById('btn-dice-roll');
          btn.textContent = `🎲${d1} + 🎲${d2} = ${d1 + d2}`;
          btn.disabled = true;
          current++;
          setTimeout(nextPlayer, 1200);
        };
      };

      const finish = () => {
        const maxTotal = Math.max(...Object.values(rolls).map(r => r.total));
        const winners = participants.filter(i => rolls[i]?.total === maxTotal);
        const losers = participants.filter(i => !winners.includes(i));
        resolve({ winners, losers, reward: DiceDuelGame.coinReward, gameName: DiceDuelGame.name });
      };

      nextPlayer();
    });
  }
}
