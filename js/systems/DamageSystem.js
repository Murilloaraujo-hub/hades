import { GAME_CONFIG } from '../config/GameConfig.js';

export class DamageSystem {
  static roll({ baseDamage, criticalChance = GAME_CONFIG.criticalChance, criticalMultiplier = GAME_CONFIG.criticalMultiplier, element = 'Physical' }) {
    const critical = Math.random() < criticalChance;
    const amount = Math.max(1, Math.round(baseDamage * (critical ? criticalMultiplier : 1)));
    return { amount, critical, element };
  }

  static number(scene, x, y, result) {
    if (!GAME_CONFIG.accessibility.damageNumbers) return;
    const size = result.critical ? 25 : 18;
    const color = result.critical ? '#ffd36c' : '#ffffff';
    const text = scene.add.text(x + Phaser.Math.Between(-8, 8), y - 28, `${result.amount}`, {
      fontFamily: 'system-ui', fontSize: `${size}px`, color, fontStyle: result.critical ? 'bold' : 'normal', stroke: '#090b12', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(9999);
    scene.tweens.add({ targets: text, y: y - 75, alpha: 0, duration: 650, ease: 'Cubic.easeOut', onComplete: () => text.destroy() });
  }
}
