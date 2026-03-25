import { MinigameBase } from './base.js';

export class QuickMathGame extends MinigameBase {
  static id = 'quick-math';
  static name = 'Matemática Relámpago';
  static description = 'Resuelve operaciones matemáticas lo más rápido posible';
  static rules = 'Se muestran operaciones en pantalla. El primero en decir la respuesta correcta gana el punto.';
  static types = ['ffa', '1v1', '1vAll'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 10;

  async play() {
    const participants = this.getParticipants();
    const scores = {};
    participants.forEach(i => scores[i] = 0);
    const totalRounds = 5;

    return new Promise(resolve => {
      let round = 0;

      const nextRound = () => {
        round++;
        if (round > totalRounds) return finish();
        const { question, answer } = this.generateQuestion();

        this.container.innerHTML = `
          <div class="quickmath-game">
            <h2>🧮 Matemática Relámpago</h2>
            <div class="qm-round">Ronda ${round}/${totalRounds}</div>
            <div class="qm-scores">${participants.map(i =>
              `<span class="qm-score" style="--pc:${this.players[i].color}">${this.players[i].emoji} ${scores[i]}</span>`
            ).join('')}</div>
            <div class="qm-question">${question}</div>
            <div class="qm-answer-reveal" id="qm-answer" style="display:none">= ${answer}</div>
            <p class="qm-instruction">¡Digan la respuesta en voz alta! Seleccionen quién respondió primero:</p>
            <div class="mg-candidates">${participants.map(i => `
              <button class="mg-candidate-btn" data-idx="${i}">
                ${this.players[i].emoji} ${this.escapeHtml(this.players[i].name)}
              </button>`).join('')}
              <button class="mg-candidate-btn qm-none" data-idx="-1">Nadie acertó</button>
            </div>
            <button class="btn-show-answer" id="btn-qm-reveal">Mostrar respuesta</button>
          </div>`;

        document.getElementById('btn-qm-reveal').onclick = () => {
          document.getElementById('qm-answer').style.display = 'block';
        };

        this.container.querySelectorAll('.mg-candidate-btn').forEach(btn => {
          btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            if (idx >= 0) scores[idx]++;
            nextRound();
          };
        });
      };

      const finish = () => {
        const maxScore = Math.max(...Object.values(scores));
        const winners = participants.filter(i => scores[i] === maxScore);
        const losers = participants.filter(i => !winners.includes(i));
        resolve({ winners, losers, reward: QuickMathGame.coinReward, gameName: QuickMathGame.name });
      };

      nextRound();
    });
  }

  generateQuestion() {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;
    switch (op) {
      case '+':
        a = Math.floor(Math.random() * 90) + 10;
        b = Math.floor(Math.random() * 90) + 10;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * 90) + 20;
        b = Math.floor(Math.random() * a);
        answer = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * 12) + 2;
        b = Math.floor(Math.random() * 12) + 2;
        answer = a * b;
        break;
    }
    return { question: `${a} ${op} ${b}`, answer };
  }
}
