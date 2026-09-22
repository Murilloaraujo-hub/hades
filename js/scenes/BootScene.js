export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const g = this.add.graphics();

    // Player: silhouette with readable shoulders/head/body, generated locally.
    g.fillStyle(0x10182c); g.fillEllipse(32, 43, 38, 18);
    g.fillStyle(0x6fe8ff); g.fillRoundedRect(16, 18, 32, 34, 10);
    g.fillStyle(0xdffbff); g.fillCircle(32, 16, 11);
    g.fillStyle(0x26345a); g.fillTriangle(17, 28, 4, 50, 23, 45); g.fillTriangle(47, 28, 60, 50, 41, 45);
    g.generateTexture('player', 64, 64); g.clear();

    // Enemy silhouette.
    g.fillStyle(0x481b2b); g.fillEllipse(32, 45, 44, 17);
    g.fillStyle(0xef766d); g.fillRoundedRect(13, 18, 38, 36, 12);
    g.fillStyle(0xffc5bb); g.fillCircle(32, 17, 10);
    g.fillStyle(0x2b0d18); g.fillTriangle(18, 14, 24, 1, 29, 15); g.fillTriangle(35, 15, 41, 1, 47, 15);
    g.generateTexture('enemy', 64, 64); g.clear();

    // Sword.
    g.fillStyle(0x6b4c2f); g.fillRoundedRect(13, 66, 10, 18, 3);
    g.fillStyle(0xd7b36b); g.fillRoundedRect(5, 61, 26, 7, 3);
    g.fillStyle(0xdff8ff); g.fillTriangle(18, 4, 8, 62, 28, 62);
    g.fillStyle(0x78dfff); g.fillTriangle(18, 8, 14, 58, 20, 58);
    g.generateTexture('weapon-sword', 36, 88); g.clear();

    // Spear.
    g.fillStyle(0x8d6844); g.fillRoundedRect(15, 20, 6, 68, 2);
    g.fillStyle(0xc9f3ff); g.fillTriangle(18, 0, 7, 26, 29, 26);
    g.generateTexture('weapon-spear', 36, 92); g.clear();

    // Bow.
    g.lineStyle(5, 0xd9a85e, 1); g.beginPath(); g.arc(28, 43, 27, -Math.PI / 2, Math.PI / 2); g.strokePath();
    g.lineStyle(2, 0xdff8ff, .85); g.lineBetween(28, 16, 28, 70);
    g.generateTexture('weapon-bow', 60, 86); g.clear();

    // Gauntlet marker.
    g.fillStyle(0xdff8ff); g.fillRoundedRect(6, 15, 24, 42, 8); g.fillStyle(0x7ae1ff); g.fillRect(10, 20, 16, 9);
    g.generateTexture('weapon-gauntlet', 36, 64); g.clear();

    // Scythe.
    g.fillStyle(0x735c4b); g.fillRoundedRect(16, 18, 6, 72, 2);
    g.fillStyle(0xcf9cff); g.fillTriangle(18, 8, 56, 0, 27, 22); g.fillTriangle(27, 22, 56, 0, 43, 28);
    g.generateTexture('weapon-scythe', 64, 94); g.clear();

    // Projectiles.
    g.fillStyle(0xffffff); g.fillTriangle(15, 8, 0, 2, 0, 14); g.fillStyle(0x7ae1ff); g.fillRect(1, 6, 11, 4);
    g.generateTexture('projectile', 18, 16); g.clear();
    g.fillStyle(0xff7288); g.fillCircle(8, 8, 7); g.fillStyle(0xffffff); g.fillCircle(8, 8, 2);
    g.generateTexture('enemy-projectile', 16, 16); g.clear();

    g.destroy();
    this.scene.start('MainMenuScene');
  }
}
