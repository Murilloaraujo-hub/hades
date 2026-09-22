import { EventBus, EVENTS } from '../core/EventBus.js';
import { BIOMES } from './DungeonGenerator.js';

export class RoomManager {
  constructor(scene) { this.scene = scene; this.index = 0; this.cleared = false; }
  setup(index = 0) {
    this.index = index; this.cleared = false;
    this.scene.currentBiome = BIOMES[Math.min(BIOMES.length - 1, Math.floor(index / 3))];
  }
  checkClear() {
    if (this.scene.visualTest) return;
    const living = this.scene.enemies?.getChildren().filter(e => e.active && !e.dead).length || 0;
    if (!this.cleared && living === 0 && !this.scene.bossActive) {
      this.cleared = true;
      EventBus.emit(EVENTS.ROOM_CLEARED);
    }
  }
}
