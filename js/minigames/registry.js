import { TriviaGame } from './trivia.js';
import { QuickMathGame } from './quickMath.js';
import { ButtonMashGame } from './buttonMash.js';
import { ReactionTimeGame } from './reactionTime.js';
import { MemoryMatchGame } from './memoryMatch.js';
import { RPSGame } from './rps.js';
import { HigherLowerGame } from './higherLower.js';
import { WordScrambleGame } from './wordScramble.js';
import { CountingGame } from './countingGame.js';
import { DiceDuelGame } from './diceDuel.js';
import { CoinFlipGame } from './coinFlip.js';
import { GuessSongGame } from './guessSong.js';
import { PhysicalGames } from './physical.js';

const ALL_GAMES = [
  TriviaGame,
  QuickMathGame,
  ButtonMashGame,
  ReactionTimeGame,
  MemoryMatchGame,
  RPSGame,
  HigherLowerGame,
  WordScrambleGame,
  CountingGame,
  DiceDuelGame,
  CoinFlipGame,
  GuessSongGame,
  ...PhysicalGames,
];

export class MinigameRegistry {
  constructor() {
    this.games = [...ALL_GAMES];
    this.usedIds = new Set();
  }

  getGamesForType(matchType, playerCount) {
    return this.games.filter(G =>
      G.types.includes(matchType) &&
      playerCount >= G.minPlayers
    );
  }

  selectGame(matchType, playerCount) {
    const available = this.getGamesForType(matchType, playerCount);
    // Prefer unused games
    let unused = available.filter(G => !this.usedIds.has(G.id));
    if (unused.length === 0) {
      this.usedIds.clear();
      unused = available;
    }
    if (unused.length === 0) return null;
    const game = unused[Math.floor(Math.random() * unused.length)];
    this.usedIds.add(game.id);
    return game;
  }

  addGame(GameClass) {
    this.games.push(GameClass);
  }
}
