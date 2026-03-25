export class MinigameBase {
  // Override these in subclasses
  static id = 'base';
  static name = 'Base';
  static description = '';
  static rules = '';
  static types = []; // '1v1', 'ffa', 'teams', '1vAll'
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 10;

  constructor(players, matchInfo, container, state) {
    this.players = players;       // full players array
    this.matchInfo = matchInfo;   // { type, teams, spectators }
    this.container = container;
    this.state = state;
    this.results = null;
  }

  // Must return { winners: [playerIdx...], losers: [playerIdx...], reward }
  async play() {
    throw new Error('Override play()');
  }

  destroy() {
    this.container.innerHTML = '';
  }

  // Helper: get all participants (not spectators)
  getParticipants() {
    return this.matchInfo.teams.flat();
  }

  // Helper: build a "select winner" UI for physical games
  buildWinnerSelector(prompt, candidates) {
    return new Promise(resolve => {
      this.container.innerHTML = `
        <div class="minigame-physical">
          <p class="mg-prompt">${prompt}</p>
          <div class="mg-candidates">${candidates.map(idx => `
            <button class="mg-candidate-btn" data-idx="${idx}">
              <span class="mg-candidate-emoji">${this.players[idx].emoji}</span>
              <span class="mg-candidate-name">${this.escapeHtml(this.players[idx].name)}</span>
            </button>`).join('')}
          </div>
        </div>`;
      this.container.querySelectorAll('.mg-candidate-btn').forEach(btn => {
        btn.onclick = () => resolve(parseInt(btn.dataset.idx));
      });
    });
  }

  // Helper for team winner selection
  buildTeamWinnerSelector(prompt) {
    return new Promise(resolve => {
      const teams = this.matchInfo.teams;
      this.container.innerHTML = `
        <div class="minigame-physical">
          <p class="mg-prompt">${prompt}</p>
          <div class="mg-teams-select">${teams.map((team, ti) => `
            <button class="mg-team-btn" data-team="${ti}">
              <div class="mg-team-label">Equipo ${ti + 1}</div>
              <div>${team.map(i => `${this.players[i].emoji} ${this.escapeHtml(this.players[i].name)}`).join('<br>')}</div>
            </button>`).join('')}
          </div>
        </div>`;
      this.container.querySelectorAll('.mg-team-btn').forEach(btn => {
        btn.onclick = () => resolve(parseInt(btn.dataset.team));
      });
    });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
