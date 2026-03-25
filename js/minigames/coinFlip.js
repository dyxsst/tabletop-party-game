import { MinigameBase } from './base.js';

export class CoinFlipGame extends MinigameBase {
  static id = 'coin-flip';
  static name = 'Cara o Sello';
  static description = 'Predice el resultado del lanzamiento de moneda';
  static rules = '3 rondas. Cada jugador elige cara o sello. ¡Acierta para ganar puntos!';
  static types = ['ffa', '1v1'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 6;

  async play() {
    const participants = this.getParticipants();
    const scores = {};
    participants.forEach(i => scores[i] = 0);
    const totalRounds = 3;

    return new Promise(resolve => {
      let round = 0;

      const nextRound = () => {
        round++;
        if (round > totalRounds) return finish();

        const choices = {};

        this.container.innerHTML = `
          <div class="coinflip-game">
            <h2>🪙 Cara o Sello — Ronda ${round}/${totalRounds}</h2>
            <div class="cf-scores">${participants.map(i =>
              `<span class="qm-score" style="--pc:${this.players[i].color}">${this.players[i].emoji} ${scores[i]}</span>`
            ).join('')}</div>
            <p>Cada jugador dice "cara" o "sello" en voz alta. Marquen sus elecciones:</p>
            <div class="cf-players">${participants.map(i => `
              <div class="cf-player">
                <span>${this.players[i].emoji} ${this.escapeHtml(this.players[i].name)}</span>
                <div class="cf-choice-btns">
                  <button class="cf-btn ${choices[i] === 'cara' ? 'cf-selected' : ''}" data-idx="${i}" data-choice="cara">😊 Cara</button>
                  <button class="cf-btn ${choices[i] === 'sello' ? 'cf-selected' : ''}" data-idx="${i}" data-choice="sello">🦅 Sello</button>
                </div>
              </div>`).join('')}
            </div>
            <button class="btn-flip" id="btn-flip" ${Object.keys(choices).length < participants.length ? 'disabled' : ''}>🪙 ¡Lanzar!</button>
          </div>`;

        this.container.querySelectorAll('.cf-btn').forEach(btn => {
          btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            choices[idx] = btn.dataset.choice;
            // Update selections
            const parent = btn.parentElement;
            parent.querySelectorAll('.cf-btn').forEach(b => b.classList.remove('cf-selected'));
            btn.classList.add('cf-selected');
            // Enable flip button if all chose
            if (Object.keys(choices).length === participants.length) {
              document.getElementById('btn-flip').disabled = false;
            }
          };
        });

        const flipBtn = this.container.querySelector('#btn-flip');
        flipBtn.onclick = () => {
          const result = Math.random() < 0.5 ? 'cara' : 'sello';
          participants.forEach(i => {
            if (choices[i] === result) scores[i]++;
          });

          this.container.innerHTML = `
            <div class="coinflip-game">
              <h2>🪙 ¡${result === 'cara' ? '😊 CARA' : '🦅 SELLO'}!</h2>
              <div class="cf-result-big">${result === 'cara' ? '😊' : '🦅'}</div>
              <div class="cf-round-results">${participants.map(i =>
                `<span class="${choices[i] === result ? 'cf-correct' : 'cf-wrong'}">${this.players[i].emoji} ${choices[i] === result ? '✅' : '❌'}</span>`
              ).join('')}</div>
            </div>`;

          setTimeout(nextRound, 1500);
        };
      };

      const finish = () => {
        const maxScore = Math.max(...Object.values(scores));
        const winners = participants.filter(i => scores[i] === maxScore);
        const losers = participants.filter(i => !winners.includes(i));
        resolve({ winners, losers, reward: CoinFlipGame.coinReward, gameName: CoinFlipGame.name });
      };

      nextRound();
    });
  }
}
