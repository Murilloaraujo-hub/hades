import { Enemy } from './Enemy.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
export class Boss extends Enemy {
  constructor(scene,x,y,name='The Warden',difficulty=1){super(scene,x,y,'elite',difficulty);this.name=name;this.maxHP=900*difficulty;this.hp=this.maxHP;this.damage=34*difficulty;this.speed=88;this.phase=1;this.isBoss=true;this.setScale(1.7).setTint(0xc67cff);}
  update(time,player){if(this.dead)return;const ratio=this.hp/this.maxHP;this.phase=ratio>.66?1:ratio>.33?2:3;if(this.phase===2&&time>(this.nextSummonAt||0)){this.nextSummonAt=time+6500;this.scene.spawnEnemy('melee',2);}if(this.phase===3&&time>(this.nextNovaAt||0)){this.nextNovaAt=time+2500;this.scene.bossTelegraph(this,player);}super.update(time,player);}
  die(){if(this.dead)return;EventBus.emit(EVENTS.BOSS_DEFEATED,this);super.die();}
}
