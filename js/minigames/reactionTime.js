import { MinigameBase } from './base.js';

export class ReactionTimeGame extends MinigameBase {
  static id = 'reaction-time';
  static name = 'Reflejos';
  static description = '¡Toca cuando la pantalla cambie de color!';
  static rules = 'La pantalla se pondrá verde en un momento aleatorio. ¡El primero en tocar gana!';
  static types = ['1v1', 'ffa'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 8;

  async play() {
    const participants = this.getParticipants();
    const totalRounds = 3;
    const scores = {};
    participants.forEach(i => scores[i] = 0);

    return new Promise(resolve => {
      let round = 0;

      const nextRound = () => {
        round++;
        if (round > totalRounds) return finish();

        this.container.innerHTML = `
          <div class="reaction-game">
            <h2>⚡ Reflejos — Ronda ${round}/${totalRounds}</h2>
            <div class="reaction-scores">${participants.map(i =>
              `<span class="qm-score" style="--pc:${this.players[i].color}">${this.players[i].emoji} ${scores[i]}</span>`
            ).join('')}</div>
            <div class="reaction-zone reaction-wait" id="reaction-zone">
              <p>Espera...</p>
            </div>
            <p class="reaction-instruction">¡No toquen hasta que se ponga verde!</p>
          </div>`;

        const zone = document.getElementById('reaction-zone');
        let canTap = false;
        let tapped = false;

        const delay = 2000 + Math.random() * 4000;
        const timeout = setTimeout(() => {
          zone.classList.remove('reaction-wait');
          zone.classList.add('reaction-go');
          zone.innerHTML = '<p>¡AHORA!</p>';
          canTap = true;

          // Show player buttons
          zone.innerHTML = `<p>¡AHORA! ¿Quién tocó primero?</p>
            <div class="mg-candidates">${participants.map(i => `
              <button class="mg-candidate-btn reaction-tap-btn" data-idx="${i}">
                ${this.players[i].emoji}
              </button>`).join('')}
            </div>`;

          zone.querySelectorAll('.reaction-tap-btn').forEach(btn => {
            btn.onclick = () => {
              if (tapped) return;
              tapped = true;
              const idx = parseInt(btn.dataset.idx);
              scores[idx]++;
              setTimeout(nextRound, 800);
            };
          });
        }, delay);

        zone.onclick = () => {
          if (!canTap && !tapped) {
            clearTimeout(timeout);
            zone.classList.add('reaction-early');
            zone.innerHTML = '<p>¡Muy pronto! — Nadie gana punto</p>';
            setTimeout(nextRound, 1500);
          }
        };
      };

      const finish = () => {
        const maxScore = Math.max(...Object.values(scores));
        const winners = participants.filter(i => scores[i] === maxScore);
        const losers = participants.filter(i => !winners.includes(i));
        resolve({ winners, losers, reward: ReactionTimeGame.coinReward, gameName: ReactionTimeGame.name });
      };

      nextRound();
    });
  }
}
