import { MinigameBase } from './base.js';

const WORDS = [
  { word: 'CEVICHE', hint: 'Comida de mariscos' },
  { word: 'SANCOCHO', hint: 'Sopa tradicional' },
  { word: 'POLLERA', hint: 'Traje típico' },
  { word: 'TAMBORITO', hint: 'Baile folclórico' },
  { word: 'MIRAFLORES', hint: 'Esclusas del Canal' },
  { word: 'BALBOA', hint: 'Moneda panameña' },
  { word: 'CHICHEME', hint: 'Bebida de maíz' },
  { word: 'PATACONES', hint: 'Plátano frito aplastado' },
  { word: 'GAMBOA', hint: 'Pueblo en el Canal' },
  { word: 'CHORRERA', hint: 'Ciudad de Panamá Oeste' },
  { word: 'DIABLICO', hint: 'Personaje del Corpus Christi' },
  { word: 'CHIRIQUI', hint: 'Provincia panameña' },
  { word: 'BOCATORO', hint: 'Archipiélago caribeño' },
  { word: 'RASPADO', hint: 'Hielo con sirope' },
  { word: 'EMPANADA', hint: 'Masa rellena frita' },
];

export class WordScrambleGame extends MinigameBase {
  static id = 'word-scramble';
  static name = 'Palabras Revueltas';
  static description = 'Descifra la palabra revuelta antes que los demás';
  static rules = 'Se muestra una palabra con las letras revueltas y una pista. ¡El primero en descifrarla gana!';
  static types = ['ffa', '1v1', 'teams'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 8;

  async play() {
    const isTeams = this.matchInfo.type === 'teams';
    const participants = this.getParticipants();
    const scores = {};

    if (isTeams) {
      this.matchInfo.teams.forEach((_, ti) => scores[ti] = 0);
    } else {
      participants.forEach(i => scores[i] = 0);
    }

    const totalRounds = 5;
    const usedWords = new Set();

    return new Promise(resolve => {
      let round = 0;

      const nextRound = () => {
        round++;
        if (round > totalRounds) return finish();

        let wordData;
        do {
          wordData = WORDS[Math.floor(Math.random() * WORDS.length)];
        } while (usedWords.has(wordData.word) && usedWords.size < WORDS.length);
        usedWords.add(wordData.word);

        const scrambled = this.scramble(wordData.word);

        this.container.innerHTML = `
          <div class="word-game">
            <h2>🔤 Palabras Revueltas — Ronda ${round}/${totalRounds}</h2>
            <div class="word-scores">${isTeams ?
              this.matchInfo.teams.map((team, ti) =>
                `<span class="qm-score">Equipo ${ti+1}: ${scores[ti]} ${team.map(i => this.players[i].emoji).join('')}</span>`
              ).join('') :
              participants.map(i =>
                `<span class="qm-score" style="--pc:${this.players[i].color}">${this.players[i].emoji} ${scores[i]}</span>`
              ).join('')}
            </div>
            <div class="word-scrambled">${scrambled.split('').join(' ')}</div>
            <div class="word-hint">Pista: ${this.escapeHtml(wordData.hint)}</div>
            <button class="btn-show-answer" id="btn-word-reveal">Mostrar respuesta</button>
            <div class="word-answer" id="word-answer" style="display:none">${wordData.word}</div>
            <p>¿Quién la adivinó primero?</p>
            <div class="mg-candidates">
              ${isTeams ?
                this.matchInfo.teams.map((team, ti) => `
                  <button class="mg-candidate-btn" data-team="${ti}">
                    Equipo ${ti+1}: ${team.map(i => this.players[i].emoji).join(' ')}
                  </button>`).join('') :
                participants.map(i => `
                  <button class="mg-candidate-btn" data-idx="${i}">
                    ${this.players[i].emoji} ${this.escapeHtml(this.players[i].name)}
                  </button>`).join('')}
              <button class="mg-candidate-btn qm-none" data-idx="-1" data-team="-1">Nadie</button>
            </div>
          </div>`;

        document.getElementById('btn-word-reveal').onclick = () => {
          document.getElementById('word-answer').style.display = 'block';
        };

        this.container.querySelectorAll('.mg-candidate-btn').forEach(btn => {
          btn.onclick = () => {
            if (isTeams) {
              const ti = parseInt(btn.dataset.team);
              if (ti >= 0) scores[ti]++;
            } else {
              const idx = parseInt(btn.dataset.idx);
              if (idx >= 0) scores[idx]++;
            }
            nextRound();
          };
        });
      };

      const finish = () => {
        if (isTeams) {
          const maxScore = Math.max(...Object.values(scores));
          const winningTeams = Object.entries(scores).filter(([, s]) => s === maxScore).map(([ti]) => parseInt(ti));
          const winners = winningTeams.flatMap(ti => this.matchInfo.teams[ti]);
          const losers = participants.filter(p => !winners.includes(p));
          resolve({ winners, losers, reward: WordScrambleGame.coinReward, gameName: WordScrambleGame.name });
        } else {
          const maxScore = Math.max(...Object.values(scores));
          const winners = participants.filter(i => scores[i] === maxScore);
          const losers = participants.filter(i => !winners.includes(i));
          resolve({ winners, losers, reward: WordScrambleGame.coinReward, gameName: WordScrambleGame.name });
        }
      };

      nextRound();
    });
  }

  scramble(word) {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Don't return original
    if (arr.join('') === word) return this.scramble(word);
    return arr.join('');
  }
}
