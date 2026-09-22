import { GameManager } from '../core/GameManager.js';
import { OverlayMenu } from '../ui/OverlayMenu.js';
export class GameOverScene extends Phaser.Scene {
  constructor(){super('GameOverScene');}
  create(data){const run=GameManager.run||{};const secs=Math.floor((Date.now()-(run.startedAt||Date.now()))/1000);GameManager.endRun({won:!!data?.won});this.cameras.main.setBackgroundColor('#080a11');OverlayMenu.show({title:data?.won?'RUPTURA SELADA':'A RUN TERMINOU',subtitle:`Tempo: ${Math.floor(secs/60)}m ${secs%60}s<br>Salas: ${run.rooms||0}<br>Inimigos: ${run.kills||0}<br>Bosses: ${run.bosses||0}<br>Dano causado: ${Math.round(run.damageDealt||0)}<br>Gold: ${run.gold||0}<br>Build: ${(run.boons||[]).map(b=>b.name).join(', ')||'Sem bênçãos'}`,buttons:[{label:'RETURN TO HUB',onClick:()=>{OverlayMenu.clear();this.scene.start('HubScene');}},{label:'MENU',onClick:()=>{OverlayMenu.clear();this.scene.start('MainMenuScene');}}]});}
}
