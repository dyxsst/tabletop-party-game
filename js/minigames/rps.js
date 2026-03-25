import { MinigameBase } from './base.js';

export class RPSGame extends MinigameBase {
  static id = 'rps';
  static name = 'Piedra, Papel o Tijera';
  static description = 'El clásico juego de manos';
  static rules = 'Ambos jugadores eligen su jugada. ¡Al mejor de 3!';
  static types = ['1v1'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 8;

  async play() {
    const [p1] = this.matchInfo.teams[0];
    const [p2] = this.matchInfo.teams[1];
    const scores = { [p1]: 0, [p2]: 0 };
    const choices = ['🪨 Piedra', '📄 Papel', '✂️ Tijera'];
    const bestOf = 3;

    return new Promise(resolve => {
      let round = 0;

      const nextRound = () => {
        round++;
        if (scores[p1] >= 2 || scores[p2] >= 2) return finish();

        this.container.innerHTML = `
          <div class="rps-game">
            <h2>✊ Piedra, Papel o Tijera — Ronda ${round}</h2>
            <div class="rps-scores">
              <span style="--pc:${this.players[p1].color}">${this.players[p1].emoji} ${scores[p1]}</span>
              <span>vs</span>
              <span style="--pc:${this.players[p2].color}">${this.players[p2].emoji} ${scores[p2]}</span>
            </div>
            <p>Ambos jugadores: digan su elección en 3... 2... 1...</p>
            <p>¿Quién ganó esta ronda?</p>
            <div class="rps-buttons">
              <button class="rps-btn" data-winner="${p1}">${this.players[p1].emoji} ${this.escapeHtml(this.players[p1].name)}</button>
              <button class="rps-btn rps-draw" data-winner="-1">🤝 Empate</button>
              <button class="rps-btn" data-winner="${p2}">${this.players[p2].emoji} ${this.escapeHtml(this.players[p2].name)}</button>
            </div>
          </div>`;

        this.container.querySelectorAll('.rps-btn').forEach(btn => {
          btn.onclick = () => {
            const winner = parseInt(btn.dataset.winner);
            if (winner >= 0) scores[winner]++;
            nextRound();
          };
        });
      };

      const finish = () => {
        const winner = scores[p1] >= 2 ? p1 : p2;
        const loser = winner === p1 ? p2 : p1;
        resolve({ winners: [winner], losers: [loser], reward: RPSGame.coinReward, gameName: RPSGame.name });
      };

      nextRound();
    });
  }
}
