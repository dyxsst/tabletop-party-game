import { MinigameBase } from './base.js';

export class TriviaGame extends MinigameBase {
  static id = 'trivia';
  static name = 'Trivia: America Says';
  static description = 'Adivina las respuestas más populares de la encuesta';
  static rules = 'Se muestra una pregunta y las respuestas más populares parcialmente ocultas. Los equipos se turnan para adivinar.';
  static types = ['teams', 'ffa'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 12;

  async play() {
    const question = await this.loadQuestion();
    if (!question) return this.fallbackGame();
    return new Promise(resolve => {
      const teams = this.matchInfo.teams;
      const scores = teams.map(() => 0);
      let currentTeam = 0;
      let revealed = new Set();
      const answers = question.answers;
      let timeLeft = 60;

      const render = () => {
        this.container.innerHTML = `
          <div class="trivia-game">
            <div class="trivia-header">
              <h2>🎤 Trivia: America Says</h2>
              <div class="trivia-timer">⏱ ${timeLeft}s</div>
            </div>
            <div class="trivia-question">${this.escapeHtml(question.question)}</div>
            <div class="trivia-answers">
              ${answers.map((a, i) => `
                <div class="trivia-answer ${revealed.has(i) ? 'revealed' : ''}">
                  <span class="trivia-num">${i + 1}.</span>
                  <span class="trivia-text">${revealed.has(i) ? this.escapeHtml(a.text) : this.getHint(a.text)}</span>
                  <span class="trivia-points">${a.points} pts</span>
                </div>`).join('')}
            </div>
            <div class="trivia-teams">
              ${teams.map((team, ti) => `
                <div class="trivia-team ${ti === currentTeam ? 'trivia-active-team' : ''}">
                  <div class="trivia-team-name">Equipo ${ti + 1}: ${scores[ti]} pts</div>
                  <div>${team.map(i => `${this.players[i].emoji}`).join(' ')}</div>
                </div>`).join('')}
            </div>
            <div class="trivia-input-area">
              <p>Turno del Equipo ${currentTeam + 1} — Digan su respuesta en voz alta</p>
              <div class="trivia-controls">
                ${answers.map((a, i) => !revealed.has(i) ? `<button class="trivia-reveal-btn" data-idx="${i}">Revelar #${i + 1}</button>` : '').join('')}
              </div>
              <div class="trivia-actions">
                <button class="btn-next-team" id="btn-trivia-next">Pasar turno</button>
                <button class="btn-end-trivia" id="btn-trivia-end">Terminar</button>
              </div>
            </div>
          </div>`;

        this.container.querySelectorAll('.trivia-reveal-btn').forEach(btn => {
          btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            revealed.add(idx);
            scores[currentTeam] += answers[idx].points;
            render();
          };
        });

        const nextBtn = this.container.querySelector('#btn-trivia-next');
        if (nextBtn) nextBtn.onclick = () => {
          currentTeam = (currentTeam + 1) % teams.length;
          render();
        };

        const endBtn = this.container.querySelector('#btn-trivia-end');
        if (endBtn) endBtn.onclick = () => {
          clearInterval(timer);
          finishGame();
        };
      };

      const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(timer);
          finishGame();
        } else {
          const timerEl = this.container.querySelector('.trivia-timer');
          if (timerEl) timerEl.textContent = `⏱ ${timeLeft}s`;
        }
      }, 1000);

      const finishGame = () => {
        const maxScore = Math.max(...scores);
        const winningTeams = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i >= 0);
        const winners = winningTeams.flatMap(ti => teams[ti]);
        const losers = this.getParticipants().filter(p => !winners.includes(p));
        resolve({ winners, losers, reward: TriviaGame.coinReward, gameName: TriviaGame.name });
      };

      render();
    });
  }

  async loadQuestion() {
    try {
      const resp = await fetch('./data/trivia_questions.csv');
      const text = await resp.text();
      const lines = text.trim().split('\n').slice(1); // skip header
      const available = lines.filter((_, i) => !this.state.usedTriviaQuestions.has(i));
      if (available.length === 0) {
        this.state.usedTriviaQuestions.clear();
        return this.parseQuestion(lines[Math.floor(Math.random() * lines.length)], 0);
      }
      const idx = Math.floor(Math.random() * available.length);
      const origIdx = lines.indexOf(available[idx]);
      this.state.usedTriviaQuestions.add(origIdx);
      return this.parseQuestion(available[idx], origIdx);
    } catch {
      return null;
    }
  }

  parseQuestion(line, idx) {
    // CSV: question,answer1,points1,answer2,points2,...
    const parts = this.parseCSVLine(line);
    if (parts.length < 3) return null;
    const question = parts[0];
    const answers = [];
    for (let i = 1; i < parts.length - 1; i += 2) {
      answers.push({ text: parts[i], points: parseInt(parts[i + 1]) || 1 });
    }
    return { question, answers, idx };
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  }

  getHint(text) {
    if (text.length <= 1) return '_ ';
    return text[0] + ' ' + '_ '.repeat(text.length - 1);
  }

  fallbackGame() {
    // If no CSV data, do a simple buzzer-style trivia
    return new Promise(resolve => {
      this.container.innerHTML = `
        <div class="trivia-game">
          <h2>🎤 Trivia Rápida</h2>
          <p>No se encontraron preguntas. Hagan una pregunta verbal y seleccionen al ganador.</p>
          <div class="mg-candidates">${this.getParticipants().map(idx => `
            <button class="mg-candidate-btn" data-idx="${idx}">
              ${this.players[idx].emoji} ${this.escapeHtml(this.players[idx].name)}
            </button>`).join('')}
          </div>
        </div>`;
      this.container.querySelectorAll('.mg-candidate-btn').forEach(btn => {
        btn.onclick = () => {
          const winner = parseInt(btn.dataset.idx);
          const losers = this.getParticipants().filter(p => p !== winner);
          resolve({ winners: [winner], losers, reward: TriviaGame.coinReward, gameName: TriviaGame.name });
        };
      });
    });
  }
}
