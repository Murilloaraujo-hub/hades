import { GAME_CONFIG } from '../config/GameConfig.js';
import { WeaponFactory } from '../weapons/WeaponFactory.js';
import { EventBus, EVENTS } from '../core/EventBus.js';

const WEAPON_TEXTURES = { sword: 'weapon-sword', spear: 'weapon-spear', bow: 'weapon-bow', gauntlets: 'weapon-gauntlet', scythe: 'weapon-scythe' };

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, stats, weaponId = 'sword') {
    super(scene, x, y, 'player');
    scene.add.existing(this); scene.physics.add.existing(this);
    Object.assign(this, stats);
    this.setCircle(18, 8, 8).setDepth(y).setCollideWorldBounds(true);
    this.body.setMaxVelocity(GAME_CONFIG.dashSpeed);
    this.weapon = WeaponFactory.create(this, weaponId);
    this.nextAttackAt = 0; this.nextSpecialAt = 0; this.nextDashAt = 0;
    this.invulnerableUntil = 0; this.dashingUntil = 0; this.lastMove = new Phaser.Math.Vector2(1, 0);
    this.moveDir = new Phaser.Math.Vector2(); this.aimDir = new Phaser.Math.Vector2(1, 0);
    this.attackLungeUntil = 0; this.attackLungeDir = new Phaser.Math.Vector2();
    this.controlLocked = false; this.weaponSwinging = false; this._afterimageAt = 0;
    this.bowCharging = false; this.bowChargeStartedAt = 0; this.bowChargeFx = null;
    this.baseScaleX = 1; this.baseScaleY = 1;
    scene.vfx?.makeShadow(this, 46, 17);
    this.createWeaponVisual();
  }

  createWeaponVisual() {
    const key = WEAPON_TEXTURES[this.weapon.id] || 'weapon-sword';
    this.weaponVisual = this.scene.add.image(this.x, this.y, key).setOrigin(0.5, 0.86).setDepth(this.y + 4);
    const scales = { sword: 0.82, spear: 0.88, bow: 0.82, gauntlets: 0.7, scythe: 0.88 };
    this.weaponVisual.setScale(scales[this.weapon.id] || 0.82);
    if (this.weapon.id === 'gauntlets') this.weaponVisual.setAlpha(0.82);
  }

  update(time, input, pointer) {
    this.setDepth(this.y + 20);
    this.scene.vfx?.syncShadow(this, this.dashingUntil > time ? 3 : 0);
    const mv = input.movement();
    this.moveDir.copy(mv);
    if (mv.lengthSq() > 0) this.lastMove.copy(mv);
    this.updateAim(pointer);
    this.syncWeaponIdle();

    if (this.dead || this.controlLocked) { this.body.setVelocity(0); return; }
    if (time < this.dashingUntil) {
      if (time >= this._afterimageAt) {
        this._afterimageAt = time + 36;
        this.scene.vfx?.spawnAfterimage(this, this.element);
      }
      return;
    }

    const desiredX = mv.x * this.speed;
    const desiredY = mv.y * this.speed;
    const accel = mv.lengthSq() > 0 ? 0.42 : 0.28;
    let vx = Phaser.Math.Linear(this.body.velocity.x, desiredX, accel);
    let vy = Phaser.Math.Linear(this.body.velocity.y, desiredY, accel);
    if (time < this.attackLungeUntil) {
      vx += this.attackLungeDir.x * 95;
      vy += this.attackLungeDir.y * 95;
    }
    this.body.setVelocity(vx, vy);

    const moving = this.body.speed > 18;
    if (!this.weaponSwinging) {
      const breathe = Math.sin(time * 0.006) * 0.018;
      this.setScale(1 - breathe * 0.2, 1 + breathe);
      this.setAngle(moving ? Phaser.Math.Clamp(this.body.velocity.x * 0.018, -3, 3) : 0);
    }

    if (Phaser.Input.Keyboard.JustDown(input.keys.dash)) this.dash(time, mv);
    if (this.weapon.id === 'bow') this.updateBowCharge(pointer, time);
    else if (pointer.leftButtonDown()) this.weapon.basic(pointer);
    if (pointer.rightButtonDown()) this.weapon.special(pointer);
    if (Phaser.Input.Keyboard.JustDown(input.keys.ability)) this.ability(pointer);
    if (Phaser.Input.Keyboard.JustDown(input.keys.ultimate)) this.ultimate();
  }


  updateBowCharge(pointer, time) {
    const down = pointer.leftButtonDown();
    if (down && !this.bowCharging && time >= this.nextAttackAt) {
      this.bowCharging = true;
      this.bowChargeStartedAt = time;
      this.bowChargeFx = this.scene.add.circle(this.x, this.y, 24, 0x8fe7ff, 0.04).setStrokeStyle(2, 0x8fe7ff, 0.45).setDepth(this.y + 30).setBlendMode(Phaser.BlendModes.ADD);
      this.scene.audio?.charge?.();
    }
    if (down && this.bowCharging) {
      const ratio = Phaser.Math.Clamp((time - this.bowChargeStartedAt) / 850, 0, 1);
      if (this.bowChargeFx?.active) this.bowChargeFx.setPosition(this.x, this.y).setScale(1 + ratio * 1.25).setAlpha(0.08 + ratio * 0.22);
      if (!this.weaponSwinging) {
        this.weaponVisual.setScale(0.82 + ratio * 0.08, 0.82 - ratio * 0.08);
        this.weaponVisual.setTint(ratio > .8 ? 0xdfffff : 0xffffff);
      }
    }
    if (!down && this.bowCharging) {
      const ratio = Phaser.Math.Clamp((time - this.bowChargeStartedAt) / 850, 0.12, 1);
      this.bowCharging = false;
      this.bowChargeFx?.destroy(); this.bowChargeFx = null;
      this.weaponVisual.clearTint().setScale(0.82);
      this.nextAttackAt = time + this.weapon.cooldown / this.attackSpeedMultiplier;
      const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const ang = Phaser.Math.Angle.Between(this.x, this.y, world.x, world.y);
      this.animateWeaponSwing(ang, 0, ratio > .82, this.weapon);
      this.scene.time.delayedCall(55, () => {
        if (!this.active || this.dead) return;
        const damage = this.weapon.damage * (0.72 + ratio * 0.78) * this.damageMultiplier;
        this.scene.fireProjectile(this, pointer, damage, this.element, ang, 620 + ratio * 250);
        this.scene.vfx?.spawnShockwave(this.x + this.aimDir.x * 20, this.y + this.aimDir.y * 20, this.element, 28 + ratio * 22);
      });
    }
  }

  updateAim(pointer) {
    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.aimDir.set(world.x - this.x, world.y - this.y);
    if (this.aimDir.lengthSq() > 0.001) this.aimDir.normalize();
  }

  syncWeaponIdle() {
    if (!this.weaponVisual?.active || this.weaponSwinging) return;
    const angle = Math.atan2(this.aimDir.y, this.aimDir.x);
    this.weaponVisual.setPosition(this.x + this.aimDir.x * 7, this.y + this.aimDir.y * 5 - 3);
    this.weaponVisual.setRotation(angle + Math.PI / 2);
    this.weaponVisual.setDepth(this.y + (this.aimDir.y > 0 ? 24 : 2));
  }

  dash(time, mv) {
    if (time < this.nextDashAt) return;
    const dir = mv.lengthSq() > 0 ? mv.clone() : this.lastMove.clone();
    if (dir.lengthSq() === 0) dir.set(1, 0);
    this.scene.tweens.killTweensOf(this.weaponVisual);
    this.weaponSwinging = false;
    this.dashingUntil = time + GAME_CONFIG.dashDuration;
    this.invulnerableUntil = this.dashingUntil + 45;
    this.nextDashAt = time + GAME_CONFIG.dashCooldown * this.dashCooldownMultiplier;
    this.body.setVelocity(dir.x * GAME_CONFIG.dashSpeed, dir.y * GAME_CONFIG.dashSpeed);
    this.scene.vfx?.spawnDashTrail(this, dir, this.element);
    this.scene.vfx?.spawnAfterimage(this, this.element);
    this.scene.audio?.dash();
    this.scene.tweens.add({ targets: this, scaleX: 1.25, scaleY: 0.78, duration: 55, yoyo: true, ease: 'Sine.InOut' });
    this.scene.time.delayedCall(GAME_CONFIG.dashDuration - 10, () => this.active && this.scene.vfx?.dashImpact(this.x, this.y, this.element));
    if (this.dashExplosion) this.scene.time.delayedCall(55, () => this.scene.radialDamage(this.x, this.y, 100, 30 * this.damageMultiplier, 'Fire', true));
    if (this.shadowDash) this.scene.time.delayedCall(90, () => this.scene.radialDamage(this.x, this.y, 75, 20 * this.damageMultiplier, 'Void'));
  }

  performMelee(pointer, weapon) {
    const now = this.scene.time.now;
    if (!weapon.canAttack(now) || this.controlLocked || this.dead) return;
    weapon.comboIndex = now - weapon.lastAttackAt > 720 ? 0 : (weapon.comboIndex + 1) % weapon.combo.length;
    weapon.lastAttackAt = now;
    const mult = weapon.combo[weapon.comboIndex] || 1;
    this.nextAttackAt = now + (weapon.cooldown / this.attackSpeedMultiplier);
    if (weapon.projectile) return this.performRanged(pointer, weapon, mult);

    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const ang = Phaser.Math.Angle.Between(this.x, this.y, world.x, world.y);
    const strong = weapon.comboIndex === weapon.combo.length - 1;
    this.attackLungeDir.set(Math.cos(ang), Math.sin(ang));
    this.attackLungeUntil = now + (strong ? 120 : 80);
    this.animateWeaponSwing(ang, weapon.comboIndex, strong, weapon);
    const anticipation = strong ? 72 : 42;
    this.scene.time.delayedCall(anticipation, () => {
      if (!this.active || this.dead) return;
      this.scene.meleeArc(this, ang, weapon.range, weapon.arc, weapon.damage * mult * this.damageMultiplier, this.element, strong);
    });
  }

  performRanged(pointer, weapon, mult = 1) {
    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const ang = Phaser.Math.Angle.Between(this.x, this.y, world.x, world.y);
    this.animateWeaponSwing(ang, weapon.comboIndex, false, weapon);
    this.scene.time.delayedCall(65, () => this.active && this.scene.fireProjectile(this, pointer, weapon.damage * mult * this.damageMultiplier, this.element));
  }

  animateWeaponSwing(aimAngle, comboIndex, strong, weapon) {
    if (!this.weaponVisual?.active) return;
    this.scene.tweens.killTweensOf(this.weaponVisual);
    this.weaponSwinging = true;
    this.scene.audio?.swing?.(strong, weapon.id);
    const base = aimAngle + Math.PI / 2;
    if (weapon.id === 'spear') { this.animateSpearThrust(aimAngle, strong, weapon); return; }
    let startOffset = -0.9, endOffset = 0.95;
    if (comboIndex % 4 === 1) { startOffset = 0.9; endOffset = -0.92; }
    if (comboIndex % 4 === 2) { startOffset = -1.18; endOffset = 0.55; }
    if (comboIndex % 4 === 3) { startOffset = -1.45; endOffset = 1.45; }
    if (weapon.id === 'spear') { startOffset = -0.18; endOffset = 0.16; }
    if (weapon.id === 'scythe') { startOffset *= 1.25; endOffset *= 1.25; }
    const start = base + startOffset;
    const end = base + endOffset;
    this.weaponVisual.setPosition(this.x, this.y - 3).setRotation(start).setAlpha(1);
    this.setAngle(Phaser.Math.Clamp(Phaser.Math.RadToDeg(startOffset) * 0.05, -6, 6));
    const prev = this.weaponTip(start);
    const duration = strong ? 185 : Math.max(105, weapon.cooldown * 0.52);
    this.scene.tweens.add({
      targets: this.weaponVisual, rotation: end, duration, ease: strong ? 'Cubic.InOut' : 'Sine.InOut',
      onUpdate: () => {
        this.weaponVisual.setPosition(this.x, this.y - 3).setDepth(this.y + 28);
        const tip = this.weaponTip(this.weaponVisual.rotation);
        this.scene.vfx?.spawnWeaponTrail(prev.x, prev.y, tip.x, tip.y, this.element, strong);
        prev.x = tip.x; prev.y = tip.y;
      },
      onComplete: () => {
        this.weaponSwinging = false;
        this.scene.tweens.add({ targets: this, angle: 0, scaleX: 1, scaleY: 1, duration: 90, ease: 'Sine.Out' });
        this.syncWeaponIdle();
      },
    });
  }


  animateSpearThrust(aimAngle, strong, weapon) {
    const base = aimAngle + Math.PI / 2;
    this.weaponVisual.setRotation(base).setPosition(this.x, this.y - 3);
    const state = { thrust: -8 };
    const maxThrust = strong ? 48 : 34;
    let prev = { x: this.x, y: this.y };
    this.scene.tweens.add({
      targets: state, thrust: maxThrust, duration: strong ? 105 : 82, ease: 'Cubic.In', yoyo: true,
      onUpdate: () => {
        const ox = Math.cos(aimAngle) * state.thrust, oy = Math.sin(aimAngle) * state.thrust;
        this.weaponVisual.setPosition(this.x + ox, this.y - 3 + oy).setDepth(this.y + 28);
        const tip = this.weaponTip(base);
        tip.x += ox; tip.y += oy;
        this.scene.vfx?.spawnWeaponTrail(prev.x, prev.y, tip.x, tip.y, this.element, strong);
        prev = tip;
      },
      onComplete: () => { this.weaponSwinging = false; this.syncWeaponIdle(); },
    });
  }

  weaponTip(rotation) {
    const len = this.weapon.id === 'spear' ? 78 : this.weapon.id === 'scythe' ? 72 : this.weapon.id === 'bow' ? 50 : 62;
    const a = rotation - Math.PI / 2;
    return { x: this.x + Math.cos(a) * len, y: this.y - 3 + Math.sin(a) * len };
  }

  performSpecial(pointer, weapon) {
    const now = this.scene.time.now;
    if (now < this.nextSpecialAt || this.controlLocked || this.dead) return;
    this.nextSpecialAt = now + weapon.specialCooldown;
    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const ang = Phaser.Math.Angle.Between(this.x, this.y, world.x, world.y);
    this.animateWeaponSwing(ang, 3, true, weapon);
    this.scene.time.delayedCall(85, () => {
      if (weapon.id === 'sword' || weapon.id === 'scythe') this.scene.radialDamage(this.x, this.y, weapon.specialRange, weapon.specialDamage * this.damageMultiplier, this.element, true);
      else if (weapon.id === 'bow') for (let i = -1; i <= 1; i++) this.scene.fireProjectile(this, pointer, weapon.specialDamage * this.damageMultiplier, this.element, ang + i * 0.16);
      else this.scene.meleeArc(this, ang, weapon.specialRange, weapon.id === 'spear' ? 0.35 : 1.1, weapon.specialDamage * this.damageMultiplier, this.element, true);
    });
  }

  ability() {
    if ((this.abilityReadyAt || 0) > this.scene.time.now || this.controlLocked) return;
    this.abilityReadyAt = this.scene.time.now + 5000;
    this.scene.radialDamage(this.x, this.y, 135, 48 * this.damageMultiplier, this.element, true);
  }

  ultimate() {
    if ((this.ultimateCharge || 100) < 100 || this.controlLocked) return;
    this.ultimateCharge = 0;
    this.scene.radialDamage(this.x, this.y, 260, 140 * this.damageMultiplier, this.element, true);
    this.scene.feedback?.explosion(this.x, this.y, this.element);
  }

  takeDamage(amount) {
    if (this.scene.time.now < this.invulnerableUntil || this.dead) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableUntil = this.scene.time.now + 380;
    if (GAME_CONFIG.accessibility.flashes) {
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(70, () => this.active && this.clearTint());
    }
    this.scene.cameraManager?.shake('MEDIUM');
    this.scene.hud?.onDamage?.();
    EventBus.emit(EVENTS.PLAYER_DAMAGED, this);
    if (this.hp <= 0) { this.dead = true; EventBus.emit(EVENTS.PLAYER_DIED, this); }
  }

  heal(n) { this.hp = Math.min(this.maxHP, this.hp + n); EventBus.emit(EVENTS.HUD_REFRESH); }

  destroy(fromScene) {
    this.weaponVisual?.destroy();
    this.bowChargeFx?.destroy();
    this._groundShadow?.destroy();
    super.destroy(fromScene);
  }
}
