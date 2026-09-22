import { SaveManager } from './SaveManager.js';

class GameManagerImpl {
  constructor() {
    this.save = SaveManager.load();
    this.run = null;
  }

  newRun() {
    this.save.statistics.runs += 1;
    this.run = {
      startedAt: Date.now(), rooms: 0, kills: 0, bosses: 0, damageDealt: 0,
      gold: 0, keys: 0, special: 0, weapon: 'sword', boons: [], biomeIndex: 0,
    };
    this.persist();
    return this.run;
  }

  ensureRun() { return this.run || this.newRun(); }

  endRun({ won = false } = {}) {
    if (!this.run) return;
    this.save.statistics.bestRooms = Math.max(this.save.statistics.bestRooms, this.run.rooms);
    if (won) this.save.statistics.wins += 1;
    else this.save.statistics.deaths += 1;
    this.persist();
  }

  persist() { SaveManager.save(this.save); }
}

export const GameManager = new GameManagerImpl();
