import { GAME_CONFIG } from '../config/GameConfig.js';

const COLORS = {
  Physical: '#f4fbff', Fire: '#ff8a54', Ice: '#9deeff', Lightning: '#b2a1ff',
  Poison: '#83ff92', Void: '#cb83ff', Holy: '#ffe9a6',
};

export class DamageSystem {
  static roll({ baseDamage, criticalChance = GAME_CONFIG.criticalChance, criticalMultiplier = GAME_CONFIG.criticalMultiplier, element = 'Physical' }) {
    const critical = Math.random() < criticalChance;
    const amount = Math.max(1, Math.round(baseDamage * (critical ? criticalMultiplier : 1)));
    return { amount, critical, element };
  }

  static number(scene, x, y, result) {
    if (!GAME_CONFIG.accessibility.damageNumbers) return;
    const scale = GAME_CONFIG.effects.damageNumberScale || 1;
    const size = (result.critical ? 29 : 18) * scale;
    const color = result.critical ? '#ffe27a' : (COLORS[result.element] || '#ffffff');
    const text = scene.add.text(x + Phaser.Math.Between(-10, 10), y - 34, `${result.amount}`, {
      fontFamily: 'system-ui', fontSize: `${size}px`, color,
      fontStyle: result.critical ? 'bold' : 'normal', stroke: '#070812', strokeThickness: result.critical ? 6 : 4,
    }).setOrigin(0.5).setDepth(12000).setScale(result.critical ? 0.55 : 0.9);

    if (result.critical) {
      scene.tweens.add({ targets: text, scale: 1.28, duration: 90, ease: 'Back.Out', yoyo: true, hold: 15 });
    } else {
      scene.tweens.add({ targets: text, scale: 1, duration: 80, ease: 'Cubic.Out' });
    }
    scene.tweens.add({ targets: text, y: y - (result.critical ? 100 : 78), alpha: 0, duration: result.critical ? 820 : 620, delay: 80, ease: 'Cubic.Out', onComplete: () => text.destroy() });
  }
}
