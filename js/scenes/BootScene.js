export class BootScene extends Phaser.Scene {
  constructor(){super('BootScene');}
  create(){const g=this.add.graphics();
    g.fillStyle(0x7ae1ff);g.fillCircle(24,24,18);g.generateTexture('player',48,48);g.clear();
    g.fillStyle(0xef766d);g.fillCircle(24,24,18);g.generateTexture('enemy',48,48);g.clear();
    g.fillStyle(0xffd26f);g.fillCircle(8,8,7);g.generateTexture('projectile',16,16);g.destroy();
    this.scene.start('MainMenuScene');}
}
