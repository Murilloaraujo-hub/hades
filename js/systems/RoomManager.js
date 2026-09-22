import { EventBus, EVENTS } from '../core/EventBus.js';
import { BIOMES } from './DungeonGenerator.js';

export class RoomManager {
  constructor(scene) { this.scene=scene; this.index=0; this.cleared=false; }
  setup(index=0) {
    this.index=index; this.cleared=false;
    const biome = BIOMES[Math.min(BIOMES.length-1, Math.floor(index/3))];
    this.scene.currentBiome = biome;
    this.scene.renderArena(biome);
  }
  checkClear() {
    const living = this.scene.enemies?.getChildren().filter(e=>e.active && !e.dead).length || 0;
    if(!this.cleared && living===0 && !this.scene.bossActive) {
      this.cleared=true;
      EventBus.emit(EVENTS.ROOM_CLEARED);
    }
  }
}
