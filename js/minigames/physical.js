import { MinigameBase } from './base.js';

class PhysicalGameBase extends MinigameBase {
  static isDigital = false;

  async play() {
    const isTeams = this.matchInfo.type === 'teams';

    return new Promise(resolve => {
      this.container.innerHTML = `
        <div class="physical-game">
          <div class="phys-icon">${this.constructor.icon}</div>
          <h2>${this.escapeHtml(this.constructor.name)}</h2>
          <p class="phys-rules">${this.escapeHtml(this.constructor.rules)}</p>
          ${isTeams ? this.renderTeams() : this.renderParticipants()}
          <div class="phys-separator"></div>
          <p class="phys-prompt">Realicen el juego presencialmente, luego seleccionen al ganador:</p>
          ${isTeams ? this.renderTeamSelector() : this.renderPlayerSelector()}
        </div>`;

      if (isTeams) {
        this.container.querySelectorAll('.mg-team-btn').forEach(btn => {
          btn.onclick = () => {
            const ti = parseInt(btn.dataset.team);
            const winners = this.matchInfo.teams[ti];
            const losers = this.getParticipants().filter(p => !winners.includes(p));
            resolve({ winners, losers, reward: this.constructor.coinReward, gameName: this.constructor.name });
          };
        });
      } else {
        this.container.querySelectorAll('.mg-candidate-btn').forEach(btn => {
          btn.onclick = () => {
            const winner = parseInt(btn.dataset.idx);
            const losers = this.getParticipants().filter(p => p !== winner);
            resolve({ winners: [winner], losers, reward: this.constructor.coinReward, gameName: this.constructor.name });
          };
        });
      }
    });
  }

  renderParticipants() {
    return `<div class="phys-participants">
      <h3>Participantes:</h3>
      ${this.getParticipants().map(i =>
        `<span class="phys-player">${this.players[i].emoji} ${this.escapeHtml(this.players[i].name)}</span>`
      ).join('')}
    </div>`;
  }

  renderTeams() {
    return `<div class="phys-teams-display">${this.matchInfo.teams.map((team, ti) =>
      `<div class="phys-team">
        <h3>Equipo ${ti + 1}</h3>
        ${team.map(i => `<span class="phys-player">${this.players[i].emoji} ${this.escapeHtml(this.players[i].name)}</span>`).join('')}
      </div>`
    ).join('<span class="phys-vs">VS</span>')}</div>`;
  }

  renderPlayerSelector() {
    return `<div class="mg-candidates">${this.getParticipants().map(i => `
      <button class="mg-candidate-btn" data-idx="${i}">
        ${this.players[i].emoji} ${this.escapeHtml(this.players[i].name)}
      </button>`).join('')}
    </div>`;
  }

  renderTeamSelector() {
    return `<div class="mg-teams-select">${this.matchInfo.teams.map((team, ti) => `
      <button class="mg-team-btn" data-team="${ti}">
        <div>Equipo ${ti + 1}</div>
        <div>${team.map(i => this.players[i].emoji).join(' ')}</div>
      </button>`).join('')}
    </div>`;
  }
}

class PulsoGame extends PhysicalGameBase {
  static id = 'pulso';
  static name = 'Pulso (Arm Wrestling)';
  static icon = '💪';
  static description = '¡Prueba de fuerza!';
  static rules = 'Los dos jugadores se enfrentan en un pulso. ¡El que gane se lleva las monedas!';
  static types = ['1v1'];
  static minPlayers = 2;
  static coinReward = 8;
}

class MiradasGame extends PhysicalGameBase {
  static id = 'miradas';
  static name = 'Concurso de Miradas';
  static icon = '👀';
  static description = '¡No parpadees!';
  static rules = 'Mírase a los ojos sin parpadear ni reír. El primero en fallar pierde.';
  static types = ['1v1'];
  static minPlayers = 2;
  static coinReward = 6;
}

class TrabalenguasGame extends PhysicalGameBase {
  static id = 'trabalenguas';
  static name = 'Trabalenguas';
  static icon = '👅';
  static description = 'Repite el trabalenguas sin equivocarte';
  static rules = 'Cada jugador debe decir el trabalenguas lo más rápido posible sin equivocarse. Trabalenguas sugeridos: "Tres tristes tigres tragaban trigo", "Pedro Pérez pide permiso para partir para París"';
  static types = ['1v1', 'ffa'];
  static minPlayers = 2;
  static coinReward = 6;
}

class PataCalienteGame extends PhysicalGameBase {
  static id = 'pata-caliente';
  static name = 'Papa Caliente';
  static icon = '🥔';
  static description = '¡Pasa la papa antes de que explote!';
  static rules = 'Pasen un objeto entre todos al ritmo de la música. Cuando la música pare, quien tenga la papa pierde. Usen un celular con alarma como temporizador.';
  static types = ['ffa'];
  static minPlayers = 3;
  static coinReward = 8;
}

class BaileGame extends PhysicalGameBase {
  static id = 'baile';
  static name = 'Duelo de Baile';
  static icon = '💃';
  static description = '¡Muestra tus mejores pasos!';
  static rules = 'Cada jugador tiene 15 segundos para bailar. El público vota al mejor bailarín.';
  static types = ['ffa', '1v1'];
  static minPlayers = 2;
  static coinReward = 10;
}

class CharadasGame extends PhysicalGameBase {
  static id = 'charadas';
  static name = 'Charadas';
  static icon = '🎭';
  static description = 'Actúa sin hablar para que tu equipo adivine';
  static rules = 'Un jugador de cada equipo actúa una palabra sin hablar. Su equipo tiene 30 segundos para adivinar.';
  static types = ['teams'];
  static minPlayers = 4;
  static coinReward = 10;
}

class SimonDiceGame extends PhysicalGameBase {
  static id = 'simon-dice';
  static name = 'Simón Dice';
  static icon = '🗣️';
  static description = 'Sigue las instrucciones solo cuando Simón lo diga';
  static rules = 'Un jugador es "Simón" y da instrucciones. Solo deben seguirlas si dice "Simón dice..." primero. Los que fallen quedan eliminados.';
  static types = ['1vAll'];
  static minPlayers = 3;
  static coinReward = 10;
}

class EquilibrioGame extends PhysicalGameBase {
  static id = 'equilibrio';
  static name = 'Desafío de Equilibrio';
  static icon = '🧘';
  static description = '¡Mantén el equilibrio lo más que puedas!';
  static rules = 'Todos los jugadores se paran en un pie. El último en perder el equilibrio gana.';
  static types = ['ffa'];
  static minPlayers = 2;
  static coinReward = 8;
}

class PictionaryGame extends PhysicalGameBase {
  static id = 'pictionary';
  static name = 'Pictionary';
  static icon = '🎨';
  static description = 'Dibuja para que tu equipo adivine';
  static rules = 'Un jugador dibuja (en papel o pizarra) y su equipo tiene 45 segundos para adivinar la palabra.';
  static types = ['teams'];
  static minPlayers = 4;
  static coinReward = 10;
}

class CarreraGame extends PhysicalGameBase {
  static id = 'carrera-cucharas';
  static name = 'Carrera de Cucharas';
  static icon = '🥄';
  static description = '¡Equilibra y corre!';
  static rules = 'Cada jugador lleva un objeto en una cuchara sin dejarlo caer. El primero en llegar a la meta gana.';
  static types = ['ffa', '1v1'];
  static minPlayers = 2;
  static coinReward = 8;
}

export const PhysicalGames = [
  PulsoGame,
  MiradasGame,
  TrabalenguasGame,
  PataCalienteGame,
  BaileGame,
  CharadasGame,
  SimonDiceGame,
  EquilibrioGame,
  PictionaryGame,
  CarreraGame,
];
