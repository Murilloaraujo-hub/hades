export class Weapon {
  constructor(player, config) { this.player=player; Object.assign(this, config); this.comboIndex=0; this.lastAttackAt=0; }
  canAttack(now) { return now >= (this.player.nextAttackAt || 0); }
  basic(pointer) { this.player.performMelee(pointer, this); }
  special(pointer) { this.player.performSpecial(pointer, this); }
}
