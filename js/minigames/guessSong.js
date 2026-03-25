import { MinigameBase } from './base.js';

export class GuessSongGame extends MinigameBase {
  static id = 'guess-song';
  static name = 'Adivina la Canción';
  static description = 'Escucha un fragmento y adivina la canción';
  static rules = 'Se reproduce un fragmento de 3 segundos. ¡El primero en adivinar la canción gana!';
  static types = ['ffa', '1v1'];
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 10;

  async play() {
    const participants = this.getParticipants();
    const scores = {};
    participants.forEach(i => scores[i] = 0);

    const songs = await this.loadSongs();
    const totalRounds = Math.min(5, songs.length || 3);

    if (songs.length === 0) return this.fallbackGame();

    return new Promise(resolve => {
      let round = 0;
      const usedSongs = new Set();

      const nextRound = () => {
        round++;
        if (round > totalRounds) return finish();

        let song;
        const available = songs.filter((_, i) => !usedSongs.has(i) && !this.state.usedSongs.has(i));
        if (available.length === 0) {
          return finish();
        }
        const songIdx = songs.indexOf(available[Math.floor(Math.random() * available.length)]);
        song = songs[songIdx];
        usedSongs.add(songIdx);
        this.state.usedSongs.add(songIdx);

        this.container.innerHTML = `
          <div class="song-game">
            <h2>🎵 Adivina la Canción — Ronda ${round}/${totalRounds}</h2>
            <div class="song-scores">${participants.map(i =>
              `<span class="qm-score" style="--pc:${this.players[i].color}">${this.players[i].emoji} ${scores[i]}</span>`
            ).join('')}</div>
            <div class="song-controls">
              <button class="song-play-btn" id="btn-play-song">▶️ Reproducir (3s)</button>
              <button class="song-play-btn" id="btn-play-more" style="display:none">▶️ Reproducir más (6s)</button>
            </div>
            <div class="song-reveal" id="song-answer" style="display:none">
              🎵 ${this.escapeHtml(song.title)} — ${this.escapeHtml(song.artist || '')}
            </div>
            <button class="btn-show-answer" id="btn-song-reveal">Revelar canción</button>
            <p>¿Quién la adivinó?</p>
            <div class="mg-candidates">
              ${participants.map(i => `
                <button class="mg-candidate-btn" data-idx="${i}">
                  ${this.players[i].emoji} ${this.escapeHtml(this.players[i].name)}
                </button>`).join('')}
              <button class="mg-candidate-btn qm-none" data-idx="-1">Nadie</button>
            </div>
          </div>`;

        let audio = null;
        document.getElementById('btn-play-song').onclick = () => {
          audio = new Audio(song.file);
          audio.currentTime = song.startTime || 0;
          audio.play();
          setTimeout(() => { if (audio) audio.pause(); }, 3000);
          document.getElementById('btn-play-more').style.display = 'inline-block';
        };

        document.getElementById('btn-play-more').onclick = () => {
          if (audio) {
            audio.currentTime = song.startTime || 0;
            audio.play();
            setTimeout(() => { if (audio) audio.pause(); }, 6000);
          }
        };

        document.getElementById('btn-song-reveal').onclick = () => {
          document.getElementById('song-answer').style.display = 'block';
        };

        this.container.querySelectorAll('.mg-candidate-btn').forEach(btn => {
          btn.onclick = () => {
            if (audio) { audio.pause(); audio = null; }
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
        resolve({ winners, losers, reward: GuessSongGame.coinReward, gameName: GuessSongGame.name });
      };

      nextRound();
    });
  }

  async loadSongs() {
    try {
      const resp = await fetch('./data/songs.json');
      const data = await resp.json();
      return data.songs || [];
    } catch {
      return [];
    }
  }

  fallbackGame() {
    return new Promise(resolve => {
      const participants = this.getParticipants();
      this.container.innerHTML = `
        <div class="song-game">
          <h2>🎵 Adivina la Canción</h2>
          <p>No se encontraron canciones. Reproduce una canción manualmente y selecciona al ganador.</p>
          <div class="mg-candidates">${participants.map(i => `
            <button class="mg-candidate-btn" data-idx="${i}">
              ${this.players[i].emoji} ${this.escapeHtml(this.players[i].name)}
            </button>`).join('')}
          </div>
        </div>`;
      this.container.querySelectorAll('.mg-candidate-btn').forEach(btn => {
        btn.onclick = () => {
          const winner = parseInt(btn.dataset.idx);
          const losers = participants.filter(p => p !== winner);
          resolve({ winners: [winner], losers, reward: GuessSongGame.coinReward, gameName: GuessSongGame.name });
        };
      });
    });
  }
}
