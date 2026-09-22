import { GAME_CONFIG } from '../config/GameConfig.js';

const ELEMENT_COLORS = {
  Physical: 0xdaf6ff,
  Fire: 0xff713d,
  Ice: 0x8ee9ff,
  Lightning: 0x9e8cff,
  Poison: 0x75ff88,
  Void: 0xb05cff,
  Holy: 0xffe9a6,
};

export class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.activeTrailCount = 0;
    this.maxTrails = this.qualityValue(18, 32, 52, 76);
    this.particlePool = [];
  }

  qualityValue(low, medium, high, ultra) {
    const q = String(GAME_CONFIG.effects.particleQuality || 'HIGH').toUpperCase();
    return ({ OFF: 0, LOW: low, MEDIUM: medium, HIGH: high, ULTRA: ultra })[q] ?? high;
  }

  elementColor(element = 'Physical') { return ELEMENT_COLORS[element] || ELEMENT_COLORS.Physical; }

  acquireParticle(x, y, color) {
    let p = this.particlePool.find(o => !o.active);
    if (!p) {
      p = this.scene.add.rectangle(x, y, 4, 8, color, 1).setVisible(false);
      p.active = false;
      this.particlePool.push(p);
    }
    p.active = true; p.setVisible(true).setPosition(x, y).setFillStyle(color, 1).setAlpha(1).setScale(1).setAngle(0).setDepth(9300).setBlendMode(Phaser.BlendModes.ADD);
    return p;
  }

  releaseParticle(p) {
    if (!p) return;
    p.active = false; p.setVisible(false).setAlpha(0);
  }

  makeShadow(target, width = 42, height = 16) {
    const shadow = this.scene.add.ellipse(target.x, target.y + 20, width, height, 0x000000, 0.35).setDepth(target.y - 2);
    target._groundShadow = shadow;
    return shadow;
  }

  syncShadow(target, lift = 0) {
    const s = target?._groundShadow;
    if (!s?.active) return;
    s.setPosition(target.x, target.y + 20 + lift).setDepth(target.y - 3).setScale(1 + Math.abs(lift) * -0.01, 1 + Math.abs(lift) * -0.008);
  }

  spawnSlash(x, y, angle, range, arc, element = 'Physical', strong = false) {
    if (GAME_CONFIG.effects.trailQuality === 'LOW') return;
    const color = this.elementColor(element);
    const g = this.scene.add.graphics().setPosition(x, y).setDepth(8500).setBlendMode(Phaser.BlendModes.ADD);
    const layers = strong ? 3 : 2;
    for (let i = 0; i < layers; i++) {
      g.lineStyle((strong ? 15 : 9) - i * 3, color, 0.16 + i * 0.2);
      g.beginPath();
      g.arc(0, 0, range - i * 5, angle - arc / 2, angle + arc / 2, false);
      g.strokePath();
    }
    g.setScale(0.86).setAlpha(0.95);
    this.scene.tweens.add({ targets: g, alpha: 0, scale: 1.08, duration: strong ? 210 : 155, ease: 'Cubic.Out', onComplete: () => g.destroy() });
  }

  spawnWeaponTrail(x1, y1, x2, y2, element = 'Physical', strong = false) {
    if (this.activeTrailCount >= this.maxTrails || GAME_CONFIG.effects.trailQuality === 'LOW') return;
    this.activeTrailCount++;
    const color = this.elementColor(element);
    const g = this.scene.add.graphics().setDepth(8400).setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(strong ? 10 : 6, color, strong ? 0.48 : 0.32);
    g.lineBetween(x1, y1, x2, y2);
    this.scene.tweens.add({ targets: g, alpha: 0, duration: strong ? 210 : 135, onComplete: () => { this.activeTrailCount--; g.destroy(); } });
  }

  spawnHitEffect(x, y, element = 'Physical', dir = { x: 1, y: 0 }, strength = 'LIGHT') {
    const color = this.elementColor(element);
    const count = strength === 'CRITICAL' ? this.qualityValue(9, 14, 20, 28) : strength === 'HEAVY' ? this.qualityValue(7, 11, 16, 22) : this.qualityValue(4, 7, 10, 14);
    const d = new Phaser.Math.Vector2(dir.x || 1, dir.y || 0).normalize();
    for (let i = 0; i < count; i++) {
      const spread = Phaser.Math.FloatBetween(-0.75, 0.75);
      const a = Math.atan2(d.y, d.x) + spread;
      const distance = Phaser.Math.Between(strength === 'LIGHT' ? 22 : 32, strength === 'CRITICAL' ? 96 : 70);
      const p = this.acquireParticle(x, y, color);
      p.setDisplaySize(Phaser.Math.Between(2, 5), Phaser.Math.Between(5, 13)).setRotation(a);
      this.scene.tweens.add({
        targets: p, x: x + Math.cos(a) * distance, y: y + Math.sin(a) * distance * 0.6,
        alpha: 0, scaleX: 0.2, duration: Phaser.Math.Between(140, 310), ease: 'Cubic.Out', onComplete: () => this.releaseParticle(p),
      });
    }
    const flash = this.scene.add.circle(x, y, strength === 'LIGHT' ? 10 : 18, 0xffffff, 0.9).setDepth(9400).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: flash, scale: 2.8, alpha: 0, duration: strength === 'CRITICAL' ? 150 : 95, onComplete: () => flash.destroy() });
  }

  spawnShockwave(x, y, element = 'Physical', size = 70) {
    const color = this.elementColor(element);
    const ring = this.scene.add.circle(x, y, 14, color, 0).setStrokeStyle(5, color, 0.7).setDepth(9200).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: ring, scale: size / 14, alpha: 0, duration: 260, ease: 'Cubic.Out', onComplete: () => ring.destroy() });
  }

  spawnDashTrail(player, dir, element = 'Physical') {
    const color = this.elementColor(element);
    const a = Math.atan2(dir.y, dir.x);
    const trail = this.scene.add.ellipse(player.x - dir.x * 12, player.y - dir.y * 12, 92, 24, color, 0.22)
      .setRotation(a).setDepth(player.y - 1).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: trail, alpha: 0, scaleX: 1.45, scaleY: 0.2, duration: 170, ease: 'Cubic.Out', onComplete: () => trail.destroy() });
  }

  spawnAfterimage(player, element = 'Physical') {
    if (!GAME_CONFIG.accessibility.motionBlur) return;
    const color = this.elementColor(element);
    const img = this.scene.add.image(player.x, player.y, player.texture.key).setTint(color).setAlpha(0.28).setScale(player.scaleX, player.scaleY).setDepth(player.y - 1);
    this.scene.tweens.add({ targets: img, alpha: 0, scaleX: player.scaleX * 0.92, duration: 120, onComplete: () => img.destroy() });
  }

  dashImpact(x, y, element = 'Physical') {
    const color = this.elementColor(element);
    for (let i = 0; i < this.qualityValue(3, 5, 8, 12); i++) {
      const p = this.scene.add.ellipse(x + Phaser.Math.Between(-14, 14), y + 18, Phaser.Math.Between(5, 12), Phaser.Math.Between(2, 5), color, 0.35).setDepth(y - 1);
      this.scene.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-35, 35), y: p.y - Phaser.Math.Between(10, 28), alpha: 0, duration: 260, onComplete: () => p.destroy() });
    }
  }

  spawnProjectileTrail(projectile, element = 'Physical') {
    if (!projectile.active || GAME_CONFIG.effects.trailQuality === 'LOW') return;
    const color = this.elementColor(element);
    const p = this.scene.add.circle(projectile.x, projectile.y, 5, color, 0.28).setDepth(projectile.depth - 1).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: p, alpha: 0, scale: 0.2, duration: 120, onComplete: () => p.destroy() });
  }

  spawnDeathEffect(x, y, element = 'Void', scale = 1) {
    const color = this.elementColor(element);
    this.spawnShockwave(x, y, element, 70 * scale);
    for (let i = 0; i < this.qualityValue(8, 13, 18, 26); i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Phaser.Math.Between(25, 90) * scale;
      const shard = this.scene.add.triangle(x, y, 0, 0, 8, 16, -7, 13, color, 0.78).setDepth(9000).setRotation(a);
      this.scene.tweens.add({ targets: shard, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.65, rotation: a + Phaser.Math.FloatBetween(-2, 2), alpha: 0, scale: 0.15, duration: Phaser.Math.Between(240, 520), ease: 'Cubic.Out', onComplete: () => shard.destroy() });
    }
  }

  ambientBurst(biome, bounds) {
    const count = this.qualityValue(8, 14, 22, 32);
    for (let i = 0; i < count; i++) {
      const c = this.scene.add.circle(Phaser.Math.Between(bounds.x, bounds.right), Phaser.Math.Between(bounds.y, bounds.bottom), Phaser.Math.Between(1, 3), biome.accent, Phaser.Math.FloatBetween(0.04, 0.15)).setDepth(-40);
      this.scene.tweens.add({ targets: c, y: c.y - Phaser.Math.Between(20, 80), x: c.x + Phaser.Math.Between(-30, 30), alpha: 0, duration: Phaser.Math.Between(1800, 4200), repeat: -1, delay: Phaser.Math.Between(0, 1200) });
    }
  }
}
