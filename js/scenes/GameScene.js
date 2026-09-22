import { GAME_CONFIG } from '../config/GameConfig.js';
import { GameManager } from '../core/GameManager.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
import { InputManager } from '../core/InputManager.js';
import { AudioManager } from '../core/AudioManager.js';
import { Player } from '../player/Player.js';
import { makePlayerStats } from '../player/PlayerStats.js';
import { Enemy } from '../enemies/Enemy.js';
import { Boss } from '../enemies/Boss.js';
import { HUD } from '../ui/HUD.js';
import { OverlayMenu } from '../ui/OverlayMenu.js';
import { UpgradeSystem, ENTITIES } from '../systems/UpgradeSystem.js';
import { RoomManager } from '../systems/RoomManager.js';
import { LootSystem } from '../systems/LootSystem.js';
import { BIOMES } from '../systems/DungeonGenerator.js';
import { CameraManager } from '../systems/CameraManager.js';
import { VFXManager } from '../systems/VFXManager.js';
import { CombatFeedback } from '../systems/CombatFeedback.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.weaponId = data?.weapon || GameManager.ensureRun().weapon || 'sword';
    this.visualTest = !!data?.visualTest;
  }

  create() {
    OverlayMenu.clear();
    this.run = GameManager.ensureRun();
    this.run.weapon = this.weaponId;
    this.audio = new AudioManager(this);
    this.inputManager = new InputManager(this);
    this.vfx = new VFXManager(this);
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.projectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
    this.roomManager = new RoomManager(this);
    this.roomManager.setup(this.run.rooms);

    this.physics.world.setBounds(150, 120, 1300, 660);
    this.player = new Player(this, 800, 660, makePlayerStats(GameManager.save.progression.permanent), this.weaponId);
    this.cameraManager = new CameraManager(this, this.player);
    this.feedback = new CombatFeedback(this, this.cameraManager, this.vfx, this.audio);
    this.hud = new HUD(this, this.player, this.run);
    this.bossActive = false; this.roomResolved = false; this.debugVisible = false; this.paused = false;
    this.foregroundObjects = []; this.breakables = [];

    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(this.player, this.enemies, (p, e) => { if (e.type === 'charger' && e.body?.speed > 250) p.takeDamage(e.damage); });
    this.physics.add.overlap(this.projectiles, this.enemies, (proj, e) => {
      if (!proj.active || e.dead) return;
      e.receiveHit(proj.damage, proj.element, 90, proj.angleOfTravel || 0, false);
      this.vfx.spawnHitEffect(proj.x, proj.y, proj.element, { x: Math.cos(proj.angleOfTravel || 0), y: Math.sin(proj.angleOfTravel || 0) }, 'LIGHT');
      proj.destroy();
    });
    this.physics.add.overlap(this.player, this.enemyProjectiles, (p, proj) => { p.takeDamage(proj.damage || 15); proj.destroy(); });

    this.input.on('pointerdown', p => { if (p.button === 2) p.event.preventDefault(); });
    this._contextHandler = e => e.preventDefault();
    this.game.canvas.addEventListener('contextmenu', this._contextHandler);
    this.bindEvents();
    this.startRoom();

    this.debugText = this.add.text(10, 150, '', { fontSize: '12px', color: '#72ffa8', backgroundColor: '#050a08dd', padding: { x: 8, y: 8 } })
      .setScrollFactor(0).setDepth(30000).setVisible(false);
  }

  bindEvents() {
    this._onEnemyDied = e => {
      this.run.kills++;
      this.run.gold += LootSystem.goldForEnemy(e);
      GameManager.save.statistics.enemiesDefeated++;
      EventBus.emit(EVENTS.GOLD_CHANGED);
      this.roomManager.checkClear();
    };
    this._onDamaged = (e, r) => {
      this.run.damageDealt += r.amount;
      this.player.ultimateCharge = Math.min(100, (this.player.ultimateCharge || 0) + 4);
      this.hud.refresh();
      this.trySynergies(e, r);
    };
    this._onPlayerDied = () => this.playerDeath();
    this._onRoomClear = () => this.onRoomClear();
    this._onBoss = () => {
      this.run.bosses++;
      GameManager.save.statistics.bossesDefeated++;
      GameManager.save.progression.soulShards += LootSystem.shardsForBoss();
      this.bossActive = false;
      this.roomManager.checkClear();
    };
    EventBus.on(EVENTS.ENEMY_DIED, this._onEnemyDied);
    EventBus.on(EVENTS.ENEMY_DAMAGED, this._onDamaged);
    EventBus.on(EVENTS.PLAYER_DIED, this._onPlayerDied);
    EventBus.on(EVENTS.ROOM_CLEARED, this._onRoomClear);
    EventBus.on(EVENTS.BOSS_DEFEATED, this._onBoss);
    this.events.once('shutdown', () => this.unbindEvents());
  }

  unbindEvents() {
    EventBus.off(EVENTS.ENEMY_DIED, this._onEnemyDied);
    EventBus.off(EVENTS.ENEMY_DAMAGED, this._onDamaged);
    EventBus.off(EVENTS.PLAYER_DIED, this._onPlayerDied);
    EventBus.off(EVENTS.ROOM_CLEARED, this._onRoomClear);
    EventBus.off(EVENTS.BOSS_DEFEATED, this._onBoss);
    this.game.canvas.removeEventListener('contextmenu', this._contextHandler);
    this.hud?.destroy();
  }

  clearArena() {
    this.children.list.filter(o => o.getData?.('arena')).forEach(o => o.destroy());
    this.foregroundObjects = []; this.breakables = [];
  }

  renderArena(biome) {
    this.clearArena();
    this.cameras.main.setBackgroundColor('#050711');
    const cx = GAME_CONFIG.worldWidth / 2, cy = GAME_CONFIG.worldHeight / 2;
    const arena = { x: 145, y: 115, right: 1455, bottom: 785 };
    const floor = this.add.polygon(cx, cy, [0, 135, 190, 0, 1410, 0, 1600, 135, 1410, 765, 190, 765], biome.floor)
      .setData('arena', 1).setDepth(-100);

    for (let i = 0; i < 8; i++) {
      const fog = this.add.ellipse(Phaser.Math.Between(100, 1500), Phaser.Math.Between(110, 760), Phaser.Math.Between(180, 360), Phaser.Math.Between(45, 90), biome.accent, .018)
        .setScrollFactor(.94).setData('arena', 1).setDepth(-115);
      this.tweens.add({ targets: fog, x: fog.x + Phaser.Math.Between(-50, 50), alpha: { from: .012, to: .04 }, duration: Phaser.Math.Between(3500, 6200), yoyo: true, repeat: -1 });
    }

    const grid = this.add.graphics().setData('arena', 1).setDepth(-95);
    grid.lineStyle(1, biome.accent, 0.075);
    for (let x = 180; x <= 1420; x += 80) grid.lineBetween(x, 150, x + 170, 740);
    for (let x = 180; x <= 1420; x += 80) grid.lineBetween(x, 740, x + 170, 150);

    for (let i = 0; i < 34; i++) {
      const x = Phaser.Math.Between(180, 1420), y = Phaser.Math.Between(150, 750);
      this.add.ellipse(x, y, Phaser.Math.Between(35, 120), Phaser.Math.Between(8, 26), biome.accent, .045)
        .setData('arena', 1).setDepth(-90);
    }

    const boundary = this.add.graphics().setData('arena', 1).setDepth(-70);
    boundary.lineStyle(8, biome.accent, .23); boundary.strokeRoundedRect(145, 115, 1310, 670, 34);
    boundary.lineStyle(2, 0xffffff, .08); boundary.strokeRoundedRect(160, 130, 1280, 640, 28);

    // Decorative columns split into base/top for depth sorting and dynamic transparency.
    const columns = [{ x: 245, y: 300 }, { x: 1360, y: 330 }, { x: 315, y: 630 }, { x: 1285, y: 640 }];
    columns.forEach(({ x, y }, idx) => {
      const shadow = this.add.ellipse(x, y + 20, 76, 22, 0x000000, .34).setData('arena', 1).setDepth(y - 5);
      const base = this.add.rectangle(x, y, 46, 82, Phaser.Display.Color.ValueToColor(biome.accent).darken(55).color, .92)
        .setStrokeStyle(2, biome.accent, .24).setData('arena', 1).setDepth(y);
      const cap = this.add.polygon(x, y - 54, [0, 15, 23, 0, 46, 15, 23, 29], biome.accent, .48)
        .setData('arena', 1).setDepth(y + 170);
      cap.setData('occluder', { x, y, radius: 80 });
      this.foregroundObjects.push(cap);
      if (idx % 2 === 0) {
        const glow = this.add.circle(x, y - 82, 28, biome.accent, .08).setBlendMode(Phaser.BlendModes.ADD).setData('arena', 1).setDepth(y + 160);
        this.tweens.add({ targets: glow, alpha: { from: .05, to: .15 }, scale: { from: .9, to: 1.18 }, duration: 1300, yoyo: true, repeat: -1 });
      }
      void shadow; void base;
    });

    // Reactive scenery: simple original pots/crystals that can be broken by attacks.
    for (let i = 0; i < 9; i++) {
      const x = Phaser.Math.Between(235, 1365), y = Phaser.Math.Between(205, 700);
      if (Phaser.Math.Distance.Between(x, y, 800, 660) < 150) continue;
      const obj = this.add.polygon(x, y, [0, 10, 8, 0, 21, 3, 28, 15, 22, 31, 6, 31], biome.accent, .38)
        .setStrokeStyle(2, 0xffffff, .12).setData('arena', 1).setDepth(y);
      obj.setData('breakable', true); this.breakables.push(obj);
    }

    // Doors remain closed until room clear.
    this.doors = [];
    [{ x: 800, y: 132, horizontal: true }, { x: 800, y: 768, horizontal: true }].forEach(d => {
      const door = this.add.rectangle(d.x, d.y, 150, 28, 0x12192a, 1).setStrokeStyle(3, biome.accent, .65).setData('arena', 1).setDepth(d.y + 120);
      const rune = this.add.circle(d.x, d.y, 9, biome.accent, .8).setData('arena', 1).setDepth(d.y + 121).setBlendMode(Phaser.BlendModes.ADD);
      this.doors.push({ door, rune });
      this.tweens.add({ targets: rune, alpha: { from: .35, to: .95 }, duration: 760, yoyo: true, repeat: -1 });
    });

    this.add.text(cx, 145, biome.name.toUpperCase(), { fontSize: '14px', fontStyle: 'bold', color: '#ffffffaa', letterSpacing: 2 })
      .setOrigin(.5).setData('arena', 1).setDepth(200);
    this.vfx.ambientBurst(biome, arena);
  }

  startRoom() {
    this.enemies.clear(true, true); this.projectiles.clear(true, true); this.enemyProjectiles.clear(true, true);
    this.roomResolved = false; this.roomManager.cleared = false; this.bossActive = false; this.boss = null;
    this.player.setPosition(800, 665); this.player.body.setVelocity(0); this.player.controlLocked = false;
    const local = this.run.rooms % 3;
    const biomeIdx = Math.min(BIOMES.length - 1, Math.floor(this.run.rooms / 3));
    this.currentBiome = BIOMES[biomeIdx];
    this.renderArena(this.currentBiome);

    if (this.visualTest) {
      const dummy = new Enemy(this, 800, 350, 'dummy', 1);
      dummy.maxHP = 999999; dummy.hp = dummy.maxHP; dummy.damage = 0; dummy.setScale(1.25);
      this.enemies.add(dummy);
      this.visualTestLabel = this.add.text(640, 82, 'SALA DE TESTE VISUAL — DUMMY INFINITO', { fontSize: '16px', fontStyle: 'bold', color: '#ffe28a', backgroundColor: '#090d18cc', padding: { x: 12, y: 7 } })
        .setOrigin(.5).setScrollFactor(0).setDepth(25000);
      this.cameraManager.roomReveal({ x: 800, y: 420 });
      return;
    }

    if (local === 2) this.spawnBoss();
    else {
      const count = 3 + Math.min(5, this.run.rooms);
      for (let i = 0; i < count; i++) {
        const types = ['melee', 'ranged', 'charger'];
        this.spawnEnemy(types[i % types.length], 1 + this.run.rooms * .08);
      }
      if (this.run.rooms > 0 && this.run.rooms % 2 === 1) this.spawnEnemy('elite', 1 + this.run.rooms * .09);
      this.cameraManager.roomReveal({ x: 800, y: 430 });
    }
  }

  spawnEnemy(type = 'melee', difficulty = 1) {
    const p = this.randomSpawn();
    const e = new Enemy(this, p.x, p.y, type, difficulty);
    this.enemies.add(e);
    return e;
  }

  spawnBoss() {
    this.bossActive = true;
    const boss = new Boss(this, 800, 285, this.currentBiome.boss, 1 + this.run.rooms * .08);
    this.enemies.add(boss); this.boss = boss;
    this.bossBarBack = this.add.rectangle(640, 45, 640, 19, 0x171b2b, .95).setScrollFactor(0).setDepth(22000).setStrokeStyle(1, 0xffffff, .12);
    this.bossBar = this.add.rectangle(320, 45, 640, 19, 0xc67cff).setOrigin(0, .5).setScrollFactor(0).setDepth(22001);
    this.bossName = this.add.text(640, 18, boss.name.toUpperCase(), { fontSize: '14px', fontStyle: 'bold', letterSpacing: 2 }).setOrigin(.5).setScrollFactor(0).setDepth(22002);
    boss.hpBar.setVisible(false); boss.hpFill.setVisible(false);
    this.cameraManager.bossIntro(boss, boss.name);
  }

  randomSpawn() {
    let x, y;
    do { x = Phaser.Math.Between(260, 1340); y = Phaser.Math.Between(215, 555); }
    while (Phaser.Math.Distance.Between(x, y, this.player?.x || 800, this.player?.y || 665) < 220);
    return { x, y };
  }

  update(time) {
    if (!this.player || this.paused) return;
    this.player.update(time, this.inputManager, this.input.activePointer);
    this.enemies.getChildren().forEach(e => e.update(time, this.player));
    this.projectiles.getChildren().forEach(p => this.updateProjectile(p, time));
    this.enemyProjectiles.getChildren().forEach(p => this.updateProjectile(p, time));
    if (this.boss?.active) this.bossBar.width = 640 * Math.max(0, this.boss.hp / this.boss.maxHP);

    this.cameraManager.update(time, this.player.moveDir, this.player.aimDir, this.enemies.countActive(true), this.bossActive);
    this.updateForegroundOcclusion();

    if (Phaser.Input.Keyboard.JustDown(this.inputManager.keys.pause)) this.pauseMenu();
    if (Phaser.Input.Keyboard.JustDown(this.inputManager.keys.debug)) { this.debugVisible = !this.debugVisible; this.debugText.setVisible(this.debugVisible); }
    if (this.debugVisible) this.debugText.setText(`FPS ${Math.round(this.game.loop.actualFps)}\nPlayer ${Math.round(this.player.x)}, ${Math.round(this.player.y)}\nRoom ${this.run.rooms}\nEnemies ${this.enemies.countActive(true)}\nWeapon ${this.player.weapon.id}\nBuild ${this.player.boons.map(b => b.name).join(', ') || '-'}\nF4 God • F5 +100 Gold • F6 Boss • F7 Visual Test`);
    this.debugKeys();
  }

  updateForegroundOcclusion() {
    for (const obj of this.foregroundObjects) {
      if (!obj.active) continue;
      const data = obj.getData('occluder');
      const blocking = data && this.player.y < data.y + 30 && this.player.y > data.y - 135 && Math.abs(this.player.x - data.x) < data.radius;
      const target = blocking ? 0.28 : 1;
      obj.alpha = Phaser.Math.Linear(obj.alpha, target, 0.12);
    }
  }

  debugKeys() {
    if (!GAME_CONFIG.debug) return;
    this.f4 ||= this.input.keyboard.addKey('F4'); this.f5 ||= this.input.keyboard.addKey('F5'); this.f6 ||= this.input.keyboard.addKey('F6'); this.f7 ||= this.input.keyboard.addKey('F7');
    if (Phaser.Input.Keyboard.JustDown(this.f4)) { this.player.maxHP = 99999; this.player.hp = 99999; EventBus.emit(EVENTS.HUD_REFRESH); }
    if (Phaser.Input.Keyboard.JustDown(this.f5)) { this.run.gold += 100; EventBus.emit(EVENTS.GOLD_CHANGED); }
    if (Phaser.Input.Keyboard.JustDown(this.f6) && !this.bossActive && !this.visualTest) this.spawnBoss();
    if (Phaser.Input.Keyboard.JustDown(this.f7) && !this.visualTest) this.scene.restart({ weapon: 'sword', visualTest: true });
  }

  updateProjectile(p, time) {
    if (!p.active) return;
    if (time >= (p.nextTrailAt || 0)) { p.nextTrailAt = time + 45; this.vfx.spawnProjectileTrail(p, p.element); }
    if (p.x < 120 || p.x > 1480 || p.y < 90 || p.y > 810) p.destroy();
  }

  fireProjectile(owner, pointer, damage, element, forcedAngle = null, speed = 650) {
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const ang = forcedAngle ?? Phaser.Math.Angle.Between(owner.x, owner.y, world.x, world.y);
    const p = this.physics.add.image(owner.x, owner.y, 'projectile').setTint(this.vfx.elementColor(element)).setDepth(5000).setRotation(ang);
    p.damage = damage; p.element = element; p.angleOfTravel = ang; p.nextTrailAt = 0;
    p.body.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
    this.projectiles.add(p);
  }

  enemyProjectile(enemy, player, damage) {
    const ang = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
    const p = this.physics.add.image(enemy.x, enemy.y, 'enemy-projectile').setDepth(5000);
    p.damage = damage; p.element = 'Void'; p.angleOfTravel = ang; p.nextTrailAt = 0;
    p.body.setVelocity(Math.cos(ang) * 270, Math.sin(ang) * 270);
    this.enemyProjectiles.add(p);
  }

  meleeArc(owner, angle, range, arc, damage, element, strong = false) {
    this.vfx.spawnSlash(owner.x, owner.y, angle, range, arc, element, strong);
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.dead) return;
      const d = Phaser.Math.Distance.Between(owner.x, owner.y, e.x, e.y);
      if (d > range + 32) return;
      const a = Phaser.Math.Angle.Between(owner.x, owner.y, e.x, e.y);
      if (Math.abs(Phaser.Math.Angle.Wrap(a - angle)) <= arc / 2 + .18) e.receiveHit(damage, element, strong ? 190 : 100, angle, strong);
    });
    this.breakables.slice().forEach(obj => {
      if (!obj.active) return;
      const d = Phaser.Math.Distance.Between(owner.x, owner.y, obj.x, obj.y);
      const a = Phaser.Math.Angle.Between(owner.x, owner.y, obj.x, obj.y);
      if (d <= range + 20 && Math.abs(Phaser.Math.Angle.Wrap(a - angle)) <= arc / 2 + .2) this.breakScenery(obj, angle, element);
    });
  }

  radialDamage(x, y, radius, damage, element, strong = false) {
    this.vfx.spawnShockwave(x, y, element, radius);
    if (strong) this.feedback.explosion(x, y, element);
    this.enemies.getChildren().forEach(e => {
      if (e.active && !e.dead && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= radius) {
        e.receiveHit(damage, element, strong ? 155 : 85, Phaser.Math.Angle.Between(x, y, e.x, e.y), strong);
      }
    });
    this.breakables.slice().forEach(obj => { if (obj.active && Phaser.Math.Distance.Between(x, y, obj.x, obj.y) <= radius) this.breakScenery(obj, Phaser.Math.Angle.Between(x, y, obj.x, obj.y), element); });
  }

  breakScenery(obj, angle = 0, element = 'Physical') {
    if (!obj?.active) return;
    this.breakables = this.breakables.filter(o => o !== obj);
    const x = obj.x, y = obj.y;
    this.vfx.spawnHitEffect(x, y, element, { x: Math.cos(angle), y: Math.sin(angle) }, 'LIGHT');
    for (let i = 0; i < 5; i++) {
      const shard = this.add.rectangle(x, y, Phaser.Math.Between(3, 7), Phaser.Math.Between(5, 11), this.currentBiome.accent, .65).setDepth(y + 5);
      const a = angle + Phaser.Math.FloatBetween(-1, 1), d = Phaser.Math.Between(25, 65);
      this.tweens.add({ targets: shard, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, angle: Phaser.Math.Between(-90, 90), alpha: 0, duration: 360, onComplete: () => shard.destroy() });
    }
    obj.destroy();
  }

  onHitFeedback(x, y, strong) {
    this.vfx.spawnHitEffect(x, y, 'Physical', { x: 1, y: 0 }, strong ? 'HEAVY' : 'LIGHT');
    this.cameraManager.shake(strong ? 'MEDIUM' : 'LIGHT');
  }

  fxBurst(x, y, color) {
    const element = color === 0xff596f ? 'Fire' : 'Physical';
    this.vfx.spawnHitEffect(x, y, element, { x: 1, y: 0 }, 'HEAVY');
  }

  fxTrail(x, y) { this.vfx.spawnShockwave(x, y, this.player?.element || 'Physical', 42); }

  trySynergies(enemy, result) {
    if (Math.random() < this.player.chainLightningChance) {
      const other = this.enemies.getChildren().find(e => e.active && !e.dead && e !== enemy && Phaser.Math.Distance.Between(e.x, e.y, enemy.x, enemy.y) < 180);
      if (other) {
        other.receiveHit(result.amount * .45, 'Lightning', 40, 0, false);
        const l = this.add.line(0, 0, enemy.x, enemy.y, other.x, other.y, 0x8fe7ff, .8).setOrigin(0).setDepth(9000).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: l, alpha: 0, duration: 100, onComplete: () => l.destroy() });
      }
    }
    if (result.critical && this.player.overcharge) this.radialDamage(enemy.x, enemy.y, 80, result.amount * .35, 'Lightning');
  }

  bossTelegraph(boss, player) {
    const target = { x: player.x, y: player.y };
    const tele = this.add.circle(target.x, target.y, 82, 0xff374f, .10).setStrokeStyle(4, 0xff5a6f, .9).setDepth(6000);
    this.tweens.add({ targets: tele, scale: { from: .78, to: 1 }, alpha: { from: .12, to: .55 }, duration: 520, ease: 'Sine.In', onComplete: () => {
      if (Phaser.Math.Distance.Between(target.x, target.y, this.player.x, this.player.y) < 88) this.player.takeDamage(boss.damage * 1.35);
      this.feedback.explosion(target.x, target.y, 'Void'); tele.destroy();
    } });
  }

  onRoomClear() {
    if (this.roomResolved) return;
    this.roomResolved = true;
    this.bossBarBack?.destroy(); this.bossBar?.destroy(); this.bossName?.destroy(); this.boss = null;
    if (GAME_CONFIG.accessibility.slowMotion) {
      this.physics.world.timeScale = .55;
      this.time.delayedCall(160, () => { this.physics.world.timeScale = 1; });
    }
    this.openDoors();
    this.time.delayedCall(620, () => this.rewardMenu());
  }

  openDoors() {
    this.audio?.door?.();
    this.doors?.forEach(({ door, rune }, i) => {
      this.tweens.add({ targets: door, scaleX: .08, alpha: .2, duration: 420, delay: i * 70, ease: 'Cubic.InOut' });
      this.tweens.add({ targets: rune, scale: 2.5, alpha: 0, duration: 360, onComplete: () => rune.destroy() });
      this.vfx.spawnShockwave(door.x, door.y, 'Holy', 64);
    });
    const reward = this.add.text(800, 708, '✦  RECOMPENSA DISPONÍVEL  ✦', { fontSize: '15px', fontStyle: 'bold', color: '#ffe59a', backgroundColor: '#0b0e18dd', padding: { x: 12, y: 7 } })
      .setOrigin(.5).setDepth(10000).setAlpha(0).setData('arena', 1);
    this.tweens.add({ targets: reward, y: 690, alpha: 1, duration: 360, ease: 'Back.Out' });
  }

  rewardMenu() {
    const choices = UpgradeSystem.choices(3);
    OverlayMenu.show({
      title: 'RECOMPENSA', subtitle: 'Escolha uma bênção para esta run.',
      buttons: choices.map(b => ({ label: `${b.rarity.name} • ${b.entity} — ${b.name} | ${b.desc}`, onClick: () => {
        UpgradeSystem.apply(this.player, b); this.run.boons = this.player.boons; EventBus.emit(EVENTS.BOON_SELECTED, b); this.audio.reward(); OverlayMenu.clear(); this.nextRoom();
      } })).concat([{ label: 'CURAR 25% (ignorar bênção)', onClick: () => { this.player.heal(this.player.maxHP * .25); OverlayMenu.clear(); this.nextRoom(); } }]),
    });
  }

  nextRoom() {
    this.run.rooms++; GameManager.persist();
    if (this.run.rooms >= 12) { this.scene.start('GameOverScene', { won: true }); return; }
    this.player.controlLocked = true;
    this.cameras.main.fadeOut(160, 4, 6, 12);
    this.time.delayedCall(180, () => {
      this.roomManager.setup(this.run.rooms); this.startRoom(); this.hud.refresh(); this.cameras.main.fadeIn(220, 4, 6, 12);
    });
  }

  playerDeath() {
    this.paused = true;
    if (GAME_CONFIG.accessibility.slowMotion) this.physics.world.timeScale = .25;
    this.cameraManager.shake('HEAVY');
    this.cameras.main.fade(700, 10, 10, 18);
    this.time.delayedCall(750, () => { this.physics.world.timeScale = 1; this.scene.start('GameOverScene', { won: false }); });
  }

  pauseMenu() {
    if (this.paused) return;
    this.paused = true; this.physics.world.pause();
    OverlayMenu.show({ title: 'PAUSADO', subtitle: 'A run está congelada.', buttons: [
      { label: 'RESUME', onClick: () => { OverlayMenu.clear(); this.physics.world.resume(); this.paused = false; } },
      { label: 'CONTROLS', onClick: () => OverlayMenu.show({ title: 'CONTROLES', subtitle: 'WASD/Setas mover • Mouse mirar • LMB ataque • RMB especial • Q habilidade • R ultimate • SPACE dash • F3 debug • F7 sala visual', buttons: [{ label: 'VOLTAR', onClick: () => { OverlayMenu.clear(); this.paused = false; this.physics.world.resume(); } }] }) },
      { label: 'RETURN TO MENU', danger: true, onClick: () => { OverlayMenu.clear(); GameManager.endRun({ won: false }); this.scene.start('MainMenuScene'); } },
    ] });
  }
}
