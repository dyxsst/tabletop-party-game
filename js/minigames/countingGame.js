import { MinigameBase } from './base.js';

export class CountingGame extends MinigameBase {
  static id = 'counting';
  static name = 'Cuenta Rápida';
  static description = 'Cuenta los objetos en pantalla lo más rápido posible';
  static rules = 'Se muestran objetos en pantalla por unos segundos. ¡Adivina cuántos hay!';
  static types = ['ffa', '1v1'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 8;

  async play() {
    const participants = this.getParticipants();
    const scores = {};
    participants.forEach(i => scores[i] = 0);
    const totalRounds = 3;
    const objects = ['🌟', '🐸', '🌺', '🎈', '🍎', '🐟', '🦋'];

    return new Promise(resolve => {
      let round = 0;

      const nextRound = () => {
        round++;
        if (round > totalRounds) return finish();

        const emoji = objects[Math.floor(Math.random() * objects.length)];
        const count = Math.floor(Math.random() * 20) + 8;
        const items = [];
        for (let i = 0; i < count; i++) {
          items.push({
            x: Math.random() * 80 + 10,
            y: Math.random() * 60 + 10,
            size: 0.8 + Math.random() * 0.8,
          });
        }

        // Show items for 4 seconds
        this.container.innerHTML = `
          <div class="counting-game">
            <h2>🔢 Cuenta Rápida — Ronda ${round}/${totalRounds}</h2>
            <div class="counting-scores">${participants.map(i =>
              `<span class="qm-score" style="--pc:${this.players[i].color}">${this.players[i].emoji} ${scores[i]}</span>`
            ).join('')}</div>
            <div class="counting-field">
              ${items.map(it => `<span class="counting-item" style="left:${it.x}%;top:${it.y}%;font-size:${it.size}em">${emoji}</span>`).join('')}
            </div>
            <div class="counting-timer">Observa... 4s</div>
          </div>`;

        let timeLeft = 4;
        const countTimer = setInterval(() => {
          timeLeft--;
          const timerEl = this.container.querySelector('.counting-timer');
          if (timerEl) timerEl.textContent = `Observa... ${timeLeft}s`;
          if (timeLeft <= 0) {
            clearInterval(countTimer);
            showGuess();
          }
        }, 1000);

        const showGuess = () => {
          this.container.innerHTML = `
            <div class="counting-game">
              <h2>🔢 ¿Cuántos ${emoji} había?</h2>
              <p>La respuesta correcta es: <strong id="counting-answer" style="visibility:hidden">${count}</strong></p>
              <button class="btn-show-answer" id="btn-count-reveal">Revelar respuesta</button>
              <p>¿Quién se acercó más?</p>
              <div class="mg-candidates">
                ${participants.map(i => `
                  <button class="mg-candidate-btn" data-idx="${i}">
                    ${this.players[i].emoji} ${this.escapeHtml(this.players[i].name)}
                  </button>`).join('')}
                <button class="mg-candidate-btn qm-none" data-idx="-1">Empate</button>
              </div>
            </div>`;

          document.getElementById('btn-count-reveal').onclick = () => {
            document.getElementById('counting-answer').style.visibility = 'visible';
          };

          this.container.querySelectorAll('.mg-candidate-btn').forEach(btn => {
            btn.onclick = () => {
              const idx = parseInt(btn.dataset.idx);
              if (idx >= 0) scores[idx]++;
              nextRound();
            };
          });
        };
      };

      const finish = () => {
        const maxScore = Math.max(...Object.values(scores));
        const winners = participants.filter(i => scores[i] === maxScore);
        const losers = participants.filter(i => !winners.includes(i));
        resolve({ winners, losers, reward: CountingGame.coinReward, gameName: CountingGame.name });
      };

      nextRound();
    });
  }
}
