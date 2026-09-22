import { DamageSystem } from '../systems/DamageSystem.js';
import { StatusEffectSystem } from '../systems/StatusEffectSystem.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
import { GAME_CONFIG } from '../config/GameConfig.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'melee', difficulty = 1) {
    super(scene, x, y, 'enemy'); scene.add.existing(this); scene.physics.add.existing(this);
    this.type = type; this.isElite = type === 'elite';
    this.maxHP = (this.isElite ? 190 : 85) * difficulty * GAME_CONFIG.enemyHealthMultiplier; this.hp = this.maxHP;
    this.speed = (this.isElite ? 105 : 120) * Math.min(1.5, difficulty); this.speedMultiplier = 1;
    this.damage = (this.isElite ? 30 : 18) * difficulty * GAME_CONFIG.enemyDamageMultiplier;
    this.attackCooldown = this.isElite ? 800 : 1050; this.nextAttackAt = 0; this.dead = false; this.state = 'CHASE';
    this.stunnedUntil = 0; this.knockbackUntil = 0; this.knockbackVelocity = new Phaser.Math.Vector2();
    this.baseTint = this.isElite ? 0xffc46b : (scene.currentBiome?.enemyTint || 0xef766d);
    this.setCircle(18, 8, 8).setTint(this.baseTint);
    scene.vfx?.makeShadow(this, this.isElite ? 52 : 43, this.isElite ? 18 : 15);
    this.hpBar = scene.add.rectangle(x, y - 36, this.isElite ? 54 : 40, 5, 0x171b29, 0.9).setDepth(900);
    this.hpFill = scene.add.rectangle(x - (this.isElite ? 27 : 20), y - 36, this.isElite ? 54 : 40, 5, this.isElite ? 0xffc46b : 0xf16f7d).setOrigin(0, .5).setDepth(901);
  }

  update(time, player) {
    if (this.dead || !player?.active) return;
    StatusEffectSystem.update(this);
    const bob = Math.sin(time * 0.008 + this.x * 0.01) * 1.8;
    this.setDepth(this.y + 15).setScale(1, 1 + Math.sin(time * 0.01 + this.y) * 0.025);
    this.scene.vfx?.syncShadow(this, -bob * 0.15);
    this.hpBar.setPosition(this.x, this.y - 37 + bob);
    this.hpFill.setPosition(this.x - (this.isElite ? 27 : 20), this.y - 37 + bob);
    this.hpFill.width = (this.isElite ? 54 : 40) * Math.max(0, this.hp / this.maxHP);

    if (time < this.knockbackUntil) { this.body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y); return; }
    if (time < this.stunnedUntil) { this.body.setVelocity(0); this.setAngle(Math.sin(time * 0.08) * 3); return; }
    this.setAngle(Phaser.Math.Linear(this.angle, Phaser.Math.Clamp(this.body.velocity.x * 0.025, -4, 4), 0.15));

    if (this.type === 'dummy') { this.body.setVelocity(0); return; }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    if (this.type === 'ranged') {
      if (dist < 170) this.body.setVelocity(-Math.cos(ang) * this.speed, -Math.sin(ang) * this.speed);
      else if (dist > 270) this.body.setVelocity(Math.cos(ang) * this.speed, Math.sin(ang) * this.speed);
      else {
        this.body.setVelocity(0);
        if (time >= this.nextAttackAt) { this.nextAttackAt = time + 1400; this.telegraphRanged(player); }
      }
    } else if (this.type === 'charger' && time >= this.nextAttackAt && dist < 330) {
      this.nextAttackAt = time + 1800; this.telegraphCharge(ang);
    } else {
      if (dist > 46) {
        const side = Math.sin(time / 500 + this.x) * .18;
        this.body.setVelocity((Math.cos(ang) - Math.sin(ang) * side) * this.speed * this.speedMultiplier, (Math.sin(ang) + Math.cos(ang) * side) * this.speed * this.speedMultiplier);
      } else {
        this.body.setVelocity(0);
        if (time >= this.nextAttackAt) { this.nextAttackAt = time + this.attackCooldown; player.takeDamage(this.damage); }
      }
    }
  }

  telegraphRanged(player) {
    const line = this.scene.add.line(0, 0, this.x, this.y, player.x, player.y, 0xff6b7d, 0.32).setOrigin(0).setDepth(5200);
    this.scene.tweens.add({ targets: line, alpha: 0.75, duration: 180, yoyo: true, onComplete: () => { line.destroy(); if (this.active && !this.dead) this.scene.enemyProjectile(this, player, this.damage); } });
  }

  telegraphCharge(ang) {
    this.body.setVelocity(0);
    const tele = this.scene.add.rectangle(this.x, this.y, 150, 20, 0xff4d62, 0.22).setOrigin(0, 0.5).setRotation(ang).setDepth(5000);
    this.scene.tweens.add({ targets: tele, alpha: 0.65, duration: 160, yoyo: true, onComplete: () => {
      tele.destroy();
      if (this.active && !this.dead) {
        this.body.setVelocity(Math.cos(ang) * 380, Math.sin(ang) * 380);
        this.scene.time.delayedCall(310, () => this.active && this.body.setVelocity(0));
      }
    } });
  }

  receiveHit(amount, element = 'Physical', knock = 0, angle = 0, strong = false) {
    if (this.dead) return;
    let final = amount;
    if (this.scene.player?.executeBonus && this.hp / this.maxHP < .35) final *= 1 + this.scene.player.executeBonus;
    const result = DamageSystem.roll({ baseDamage: final, criticalChance: this.scene.player?.criticalChance || .05, criticalMultiplier: this.scene.player?.criticalMultiplier || 1.5, element });
    this.hp -= result.amount;
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    this.scene.feedback?.hit(this, result, { x: this.x, y: this.y, dir, strong, boss: this.isBoss });
    if (element !== 'Physical') StatusEffectSystem.apply(this, element, 1800, 1);
    if (knock > 0 && !this.isBoss) {
      const resist = this.isElite ? 0.42 : 1;
      this.knockbackVelocity.set(Math.cos(angle) * knock * resist, Math.sin(angle) * knock * resist);
      this.knockbackUntil = this.scene.time.now + (strong ? 115 : 70);
    }
    if (!this.isBoss || strong) this.stunnedUntil = Math.max(this.stunnedUntil, this.scene.time.now + (strong ? (this.isElite ? 100 : 180) : (this.isElite ? 25 : 70)));
    EventBus.emit(EVENTS.ENEMY_DAMAGED, this, result);
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true; this.body.enable = false;
    this.hpBar.destroy(); this.hpFill.destroy(); this._groundShadow?.destroy();
    this.scene.vfx?.spawnDeathEffect(this.x, this.y, this.isElite ? 'Lightning' : 'Void', this.isElite ? 1.25 : 0.85);
    EventBus.emit(EVENTS.ENEMY_DIED, this);
    this.scene.tweens.add({ targets: this, alpha: 0, scaleX: 1.35, scaleY: 0.18, angle: this.angle + Phaser.Math.Between(-28, 28), duration: this.isElite ? 320 : 230, ease: 'Cubic.In', onComplete: () => this.destroy() });
  }
}
