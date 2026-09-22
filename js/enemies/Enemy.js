import { DamageSystem } from '../systems/DamageSystem.js';
import { StatusEffectSystem } from '../systems/StatusEffectSystem.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
import { GAME_CONFIG } from '../config/GameConfig.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene,x,y,type='melee',difficulty=1) {
    super(scene,x,y,'enemy'); scene.add.existing(this); scene.physics.add.existing(this);
    this.type=type; this.isElite=type==='elite'; this.maxHP=(this.isElite?190:85)*difficulty*GAME_CONFIG.enemyHealthMultiplier; this.hp=this.maxHP;
    this.speed=(this.isElite?105:120)*Math.min(1.5,difficulty); this.speedMultiplier=1; this.damage=(this.isElite?30:18)*difficulty*GAME_CONFIG.enemyDamageMultiplier;
    this.attackCooldown=this.isElite?800:1050; this.nextAttackAt=0; this.dead=false; this.state='CHASE'; this.stunnedUntil=0;
    this.setCircle(18,8,8).setTint(this.isElite?0xffc46b:(scene.currentBiome?.enemyTint||0xef766d));
    this.hpBar=scene.add.rectangle(x,y-34,40,5,0x1c2030).setDepth(900); this.hpFill=scene.add.rectangle(x-20,y-34,40,5,this.isElite?0xffc46b:0xf16f7d).setOrigin(0,.5).setDepth(901);
  }
  update(time,player) {
    if(this.dead||!player?.active) return; StatusEffectSystem.update(this); this.setDepth(this.y+15);
    this.hpBar.setPosition(this.x,this.y-34); this.hpFill.setPosition(this.x-20,this.y-34); this.hpFill.width=40*Math.max(0,this.hp/this.maxHP);
    if(time<this.stunnedUntil){this.body.setVelocity(0);return;}
    const dist=Phaser.Math.Distance.Between(this.x,this.y,player.x,player.y); const ang=Phaser.Math.Angle.Between(this.x,this.y,player.x,player.y);
    if(this.type==='ranged') {
      if(dist<170) this.body.setVelocity(-Math.cos(ang)*this.speed,-Math.sin(ang)*this.speed);
      else if(dist>270) this.body.setVelocity(Math.cos(ang)*this.speed,Math.sin(ang)*this.speed);
      else {this.body.setVelocity(0); if(time>=this.nextAttackAt){this.nextAttackAt=time+1400;this.scene.enemyProjectile(this,player,this.damage);}}
    } else if(this.type==='charger'&&time>=this.nextAttackAt&&dist<330) {
      this.nextAttackAt=time+1800; this.setTintFill(0xff7777); this.body.setVelocity(0); this.scene.time.delayedCall(330,()=>{if(this.active&&!this.dead){this.clearTint();this.body.setVelocity(Math.cos(ang)*360,Math.sin(ang)*360);this.scene.time.delayedCall(300,()=>this.active&&this.body.setVelocity(0));}});
    } else {
      if(dist>46){const side=Math.sin(time/500+this.x)*.18;this.body.setVelocity((Math.cos(ang)-Math.sin(ang)*side)*this.speed*this.speedMultiplier,(Math.sin(ang)+Math.cos(ang)*side)*this.speed*this.speedMultiplier);} else {this.body.setVelocity(0);if(time>=this.nextAttackAt){this.nextAttackAt=time+this.attackCooldown;player.takeDamage(this.damage);}}
    }
  }
  receiveHit(amount,element='Physical',knock=0,angle=0,strong=false) {
    if(this.dead)return; let final=amount; if(this.scene.player?.executeBonus&&this.hp/this.maxHP<.35) final*=1+this.scene.player.executeBonus;
    const result=DamageSystem.roll({baseDamage:final,criticalChance:this.scene.player?.criticalChance||.05,criticalMultiplier:this.scene.player?.criticalMultiplier||1.5,element});
    this.hp-=result.amount; DamageSystem.number(this.scene,this.x,this.y,result); this.scene.onHitFeedback(this.x,this.y,strong||result.critical); this.setTintFill(0xffffff);this.scene.time.delayedCall(50,()=>this.active&&this.clearTint());
    if(element!=='Physical') StatusEffectSystem.apply(this,element,1800,1); if(knock>0){this.body.velocity.x+=Math.cos(angle)*knock;this.body.velocity.y+=Math.sin(angle)*knock;}
    EventBus.emit(EVENTS.ENEMY_DAMAGED,this,result); if(this.hp<=0)this.die();
  }
  die(){if(this.dead)return;this.dead=true;this.body.enable=false;this.hpBar.destroy();this.hpFill.destroy();this.scene.fxBurst(this.x,this.y,this.tintTopLeft||0xff7777);EventBus.emit(EVENTS.ENEMY_DIED,this);this.scene.tweens.add({targets:this,alpha:0,scale:.4,duration:180,onComplete:()=>this.destroy()});}
}
