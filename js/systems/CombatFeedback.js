import { GAME_CONFIG } from '../config/GameConfig.js';
import { DamageSystem } from './DamageSystem.js';

export const FEEDBACK_PRESETS = {
  LIGHT_HIT: { shake: 'LIGHT', hitStop: 24, flash: 50, particles: 'LIGHT' },
  MEDIUM_HIT: { shake: 'MEDIUM', hitStop: 42, flash: 60, particles: 'HEAVY' },
  HEAVY_HIT: { shake: 'MEDIUM', hitStop: 65, flash: 72, particles: 'HEAVY' },
  CRITICAL_HIT: { shake: 'HEAVY', hitStop: 88, flash: 80, particles: 'CRITICAL' },
  BOSS_HIT: { shake: 'MEDIUM', hitStop: 52, flash: 62, particles: 'HEAVY' },
  EXPLOSION: { shake: 'HEAVY', hitStop: 58, flash: 72, particles: 'CRITICAL' },
};

export class CombatFeedback {
  constructor(scene, cameraManager, vfx, audio) {
    this.scene = scene;
    this.cameraManager = cameraManager;
    this.vfx = vfx;
    this.audio = audio;
    this.hitStopActive = false;
    this.flashOverlay = scene.add.rectangle(scene.scale.width / 2, scene.scale.height / 2, scene.scale.width, scene.scale.height, 0xffffff, 0)
      .setScrollFactor(0).setDepth(39000).setBlendMode(Phaser.BlendModes.ADD);
  }

  hit(enemy, result, { x, y, dir, strong = false, boss = false } = {}) {
    const presetName = result.critical ? 'CRITICAL_HIT' : boss ? 'BOSS_HIT' : strong ? 'HEAVY_HIT' : 'LIGHT_HIT';
    const p = FEEDBACK_PRESETS[presetName];
    this.vfx.spawnHitEffect(x ?? enemy.x, y ?? enemy.y, result.element, dir, p.particles);
    if (strong || result.critical) this.vfx.spawnShockwave(x ?? enemy.x, y ?? enemy.y, result.element, result.critical ? 86 : 62);
    this.cameraManager.shake(p.shake);
    this.audio?.hit(strong || result.critical);
    DamageSystem.number(this.scene, enemy.x, enemy.y, result);
    this.flashEnemy(enemy, p.flash);
    this.hitStop(p.hitStop);
    if (result.critical && GAME_CONFIG.accessibility.flashes) this.screenFlash(0.08 * GAME_CONFIG.effects.flashIntensity, 70);
  }

  flashEnemy(enemy, duration = 55) {
    if (!enemy?.active || !GAME_CONFIG.accessibility.flashes) return;
    enemy.setTintFill(0xffffff);
    this.scene.time.delayedCall(duration, () => enemy?.active && enemy.clearTint());
  }

  screenFlash(alpha = 0.06, duration = 60) {
    if (!GAME_CONFIG.accessibility.flashes) return;
    this.flashOverlay.setAlpha(alpha);
    this.scene.tweens.add({ targets: this.flashOverlay, alpha: 0, duration, ease: 'Cubic.Out' });
  }

  hitStop(ms) {
    const duration = Math.round(ms * GAME_CONFIG.effects.hitStopMultiplier);
    if (this.hitStopActive || duration <= 0) return;
    this.hitStopActive = true;
    this.scene.physics.world.pause();
    this.scene.time.delayedCall(duration, () => {
      if (this.scene.physics?.world) this.scene.physics.world.resume();
      this.hitStopActive = false;
    });
  }

  explosion(x, y, element = 'Fire') {
    const p = FEEDBACK_PRESETS.EXPLOSION;
    this.vfx.spawnShockwave(x, y, element, 115);
    this.vfx.spawnHitEffect(x, y, element, { x: 1, y: 0 }, p.particles);
    this.cameraManager.shake(p.shake);
    this.screenFlash(0.1, 90);
    this.hitStop(p.hitStop);
  }
}
