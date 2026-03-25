import { MinigameBase } from './base.js';

export class ButtonMashGame extends MinigameBase {
  static id = 'button-mash';
  static name = 'Dale Duro';
  static description = '¡Toca el botón lo más rápido posible!';
  static rules = 'Cada jugador tiene un botón. ¡Dale como loco durante 10 segundos!';
  static types = ['1v1', 'ffa'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 8;

  async play() {
    const participants = this.getParticipants();
    const counts = {};
    participants.forEach(i => counts[i] = 0);
    const duration = 10;

    return new Promise(resolve => {
      let timeLeft = duration;

      const render = () => {
        this.container.innerHTML = `
          <div class="buttonmash-game">
            <h2>👊 Dale Duro</h2>
            <div class="bm-timer">⏱ ${timeLeft}s</div>
            <div class="bm-players">${participants.map(i => `
              <div class="bm-player">
                <div class="bm-emoji">${this.players[i].emoji}</div>
                <div class="bm-name">${this.escapeHtml(this.players[i].name)}</div>
                <div class="bm-count">${counts[i]}</div>
                <button class="bm-btn" data-idx="${i}" style="--pc:${this.players[i].color}">¡DALE!</button>
              </div>`).join('')}
            </div>
          </div>`;

        this.container.querySelectorAll('.bm-btn').forEach(btn => {
          btn.onpointerdown = (e) => {
            e.preventDefault();
            const idx = parseInt(btn.dataset.idx);
            counts[idx]++;
            const countEl = btn.parentElement.querySelector('.bm-count');
            if (countEl) countEl.textContent = counts[idx];
            btn.classList.add('bm-pressed');
            setTimeout(() => btn.classList.remove('bm-pressed'), 50);
          };
        });
      };

      render();

      const timer = setInterval(() => {
        timeLeft--;
        const timerEl = this.container.querySelector('.bm-timer');
        if (timerEl) timerEl.textContent = `⏱ ${timeLeft}s`;
        if (timeLeft <= 0) {
          clearInterval(timer);
          const maxCount = Math.max(...Object.values(counts));
          const winners = participants.filter(i => counts[i] === maxCount);
          const losers = participants.filter(i => !winners.includes(i));
          resolve({ winners, losers, reward: ButtonMashGame.coinReward, gameName: ButtonMashGame.name });
        }
      }, 1000);
    });
  }
}
