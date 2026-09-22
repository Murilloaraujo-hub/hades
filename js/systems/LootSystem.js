export class LootSystem {
  static goldForEnemy(enemy) { return enemy.isElite ? Phaser.Math.Between(10,18) : Phaser.Math.Between(2,6); }
  static shardsForBoss() { return Phaser.Math.Between(14,24); }
}
