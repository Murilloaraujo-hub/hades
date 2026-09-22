import { GAME_CONFIG } from '../config/GameConfig.js';
import { WeaponFactory } from '../weapons/WeaponFactory.js';
import { DamageSystem } from '../systems/DamageSystem.js';
import { EventBus, EVENTS } from '../core/EventBus.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene,x,y,stats,weaponId='sword') {
    super(scene,x,y,'player'); scene.add.existing(this); scene.physics.add.existing(this);
    Object.assign(this, stats);
    this.setCircle(18,8,8); this.setDepth(y); this.setCollideWorldBounds(true);
    this.body.setMaxVelocity(GAME_CONFIG.dashSpeed);
    this.weapon=WeaponFactory.create(this,weaponId); this.nextAttackAt=0; this.nextSpecialAt=0; this.nextDashAt=0;
    this.invulnerableUntil=0; this.dashingUntil=0; this.lastMove=new Phaser.Math.Vector2(1,0);
  }
  update(time,input,pointer) {
    this.setDepth(this.y+20);
    const mv=input.movement(); if(mv.lengthSq()>0) this.lastMove.copy(mv);
    if(time < this.dashingUntil) return;
    this.body.setVelocity(mv.x*this.speed,mv.y*this.speed);
    if(Phaser.Input.Keyboard.JustDown(input.keys.dash)) this.dash(time,mv);
    if(pointer.leftButtonDown()) this.weapon.basic(pointer);
    if(pointer.rightButtonDown()) this.weapon.special(pointer);
    if(Phaser.Input.Keyboard.JustDown(input.keys.ability)) this.ability(pointer);
    if(Phaser.Input.Keyboard.JustDown(input.keys.ultimate)) this.ultimate();
  }
  dash(time,mv) {
    if(time<this.nextDashAt) return;
    const dir=mv.lengthSq()>0?mv.clone():this.lastMove.clone(); if(dir.lengthSq()===0) dir.set(1,0);
    this.dashingUntil=time+GAME_CONFIG.dashDuration; this.invulnerableUntil=this.dashingUntil+40;
    this.nextDashAt=time+GAME_CONFIG.dashCooldown*this.dashCooldownMultiplier;
    this.body.setVelocity(dir.x*GAME_CONFIG.dashSpeed,dir.y*GAME_CONFIG.dashSpeed);
    this.scene.fxTrail(this.x,this.y,0x8fe7ff); this.scene.audio.dash();
    if(this.dashExplosion) this.scene.radialDamage(this.x,this.y,100,30*this.damageMultiplier,'Fire');
    if(this.shadowDash) this.scene.time.delayedCall(90,()=>this.scene.radialDamage(this.x,this.y,75,20*this.damageMultiplier,'Void'));
  }
  performMelee(pointer,weapon) {
    const now=this.scene.time.now; if(!weapon.canAttack(now)) return;
    weapon.comboIndex = now-weapon.lastAttackAt>700?0:(weapon.comboIndex+1)%weapon.combo.length; weapon.lastAttackAt=now;
    const mult=weapon.combo[weapon.comboIndex]||1; this.nextAttackAt=now+(weapon.cooldown/this.attackSpeedMultiplier);
    if(weapon.projectile) return this.scene.fireProjectile(this,pointer,weapon.damage*mult*this.damageMultiplier,this.element);
    const world=this.scene.cameras.main.getWorldPoint(pointer.x,pointer.y); const ang=Phaser.Math.Angle.Between(this.x,this.y,world.x,world.y);
    this.scene.meleeArc(this,ang,weapon.range,weapon.arc,weapon.damage*mult*this.damageMultiplier,this.element,weapon.comboIndex===weapon.combo.length-1);
  }
  performSpecial(pointer,weapon) {
    const now=this.scene.time.now; if(now<this.nextSpecialAt) return; this.nextSpecialAt=now+weapon.specialCooldown;
    const world=this.scene.cameras.main.getWorldPoint(pointer.x,pointer.y); const ang=Phaser.Math.Angle.Between(this.x,this.y,world.x,world.y);
    if(weapon.id==='sword'||weapon.id==='scythe') this.scene.radialDamage(this.x,this.y,weapon.specialRange,weapon.specialDamage*this.damageMultiplier,this.element,true);
    else if(weapon.id==='bow') for(let i=-1;i<=1;i++) this.scene.fireProjectile(this,pointer,weapon.specialDamage*this.damageMultiplier,this.element,ang+i*.16);
    else this.scene.meleeArc(this,ang,weapon.specialRange,weapon.id==='spear'?.35:1.1,weapon.specialDamage*this.damageMultiplier,this.element,true);
  }
  ability(pointer) { if((this.abilityReadyAt||0)>this.scene.time.now) return; this.abilityReadyAt=this.scene.time.now+5000; this.scene.radialDamage(this.x,this.y,135,48*this.damageMultiplier,this.element,true); }
  ultimate() { if((this.ultimateCharge||100)<100) return; this.ultimateCharge=0; this.scene.radialDamage(this.x,this.y,260,140*this.damageMultiplier,this.element,true); this.scene.cameras.main.shake(180,.012); }
  takeDamage(amount) {
    if(this.scene.time.now<this.invulnerableUntil||this.dead) return; this.hp=Math.max(0,this.hp-amount); this.invulnerableUntil=this.scene.time.now+380;
    this.setTintFill(0xffffff); this.scene.time.delayedCall(70,()=>this.clearTint()); EventBus.emit(EVENTS.PLAYER_DAMAGED,this);
    if(GAME_CONFIG.accessibility.screenShake) this.scene.cameras.main.shake(80,.004*GAME_CONFIG.accessibility.screenShake);
    if(this.hp<=0){this.dead=true;EventBus.emit(EVENTS.PLAYER_DIED,this);}
  }
  heal(n){this.hp=Math.min(this.maxHP,this.hp+n);EventBus.emit(EVENTS.HUD_REFRESH);}
}
