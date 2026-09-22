import { GAME_CONFIG } from '../config/GameConfig.js';

export class CameraManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.camera = scene.cameras.main;
    this.cfg = GAME_CONFIG.camera;
    this.camera.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
    this.camera.setZoom(this.cfg.cameraBaseZoom);
    this.targetZoom = this.cfg.cameraBaseZoom;
    this.focusTarget = null;
    this.focusUntil = 0;
    this.enabled = true;
    const cx = Phaser.Math.Clamp(player.x - this.camera.width / 2, 0, GAME_CONFIG.worldWidth - this.camera.width);
    const cy = Phaser.Math.Clamp(player.y - this.camera.height / 2, 0, GAME_CONFIG.worldHeight - this.camera.height);
    this.camera.setScroll(cx, cy);
  }

  update(time, moveDir, aimDir, enemyCount = 0, bossActive = false) {
    if (!this.enabled) return;
    let tx = this.player.x;
    let ty = this.player.y;
    if (this.focusTarget && time < this.focusUntil) {
      tx = this.focusTarget.x;
      ty = this.focusTarget.y;
    } else {
      this.focusTarget = null;
      tx += (moveDir?.x || 0) * this.cfg.cameraLookAhead + (aimDir?.x || 0) * this.cfg.cameraAimLookAhead;
      ty += (moveDir?.y || 0) * this.cfg.cameraLookAhead * 0.65 + (aimDir?.y || 0) * this.cfg.cameraAimLookAhead * 0.65;
    }

    const viewW = this.camera.width / this.camera.zoom;
    const viewH = this.camera.height / this.camera.zoom;
    const desiredX = Phaser.Math.Clamp(tx - viewW / 2, 0, Math.max(0, GAME_CONFIG.worldWidth - viewW));
    const desiredY = Phaser.Math.Clamp(ty - viewH / 2, 0, Math.max(0, GAME_CONFIG.worldHeight - viewH));
    const dx = desiredX - this.camera.scrollX;
    const dy = desiredY - this.camera.scrollY;
    const dz = this.cfg.cameraDeadzone;
    if (Math.abs(dx) > dz) this.camera.scrollX = Phaser.Math.Linear(this.camera.scrollX, desiredX, this.cfg.cameraFollowSpeed);
    if (Math.abs(dy) > dz * 0.7) this.camera.scrollY = Phaser.Math.Linear(this.camera.scrollY, desiredY, this.cfg.cameraFollowSpeed);

    if (bossActive) this.targetZoom = this.cfg.cameraBossZoom;
    else if (enemyCount >= 8) this.targetZoom = this.cfg.cameraCrowdZoom;
    else if (enemyCount >= 3) this.targetZoom = this.cfg.cameraCombatZoom;
    else this.targetZoom = this.cfg.cameraBaseZoom;
    this.camera.zoom = Phaser.Math.Linear(this.camera.zoom, this.targetZoom, 0.035);
  }

  shake(kind = 'LIGHT') {
    if (!GAME_CONFIG.accessibility.screenShake) return;
    const amount = { LIGHT: 0.0018, MEDIUM: 0.0042, HEAVY: 0.0075, BOSS: 0.010 }[kind] || 0.002;
    const duration = { LIGHT: 45, MEDIUM: 75, HEAVY: 115, BOSS: 150 }[kind] || 55;
    this.camera.shake(duration, amount * GAME_CONFIG.accessibility.screenShake * this.cfg.screenShakeMultiplier);
  }

  focusCamera(target, duration = 500, zoom = null) {
    this.focusTarget = target;
    this.focusUntil = this.scene.time.now + duration;
    if (zoom) {
      this.camera.zoomTo(zoom, Math.min(350, duration), 'Sine.easeInOut');
      this.scene.time.delayedCall(duration, () => this.camera.zoomTo(this.targetZoom, 320, 'Sine.easeInOut'));
    }
  }

  bossIntro(boss, name, done) {
    this.player.controlLocked = true;
    this.scene.audio?.bossCue?.();
    this.focusCamera(boss, 850, this.cfg.cameraBossZoom);
    const title = this.scene.add.text(this.camera.width / 2, 126, name.toUpperCase(), {
      fontFamily: 'system-ui', fontSize: '38px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#120a24', strokeThickness: 8, letterSpacing: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(40000).setAlpha(0).setScale(0.92);
    const line = this.scene.add.rectangle(this.camera.width / 2, 164, 0, 2, 0xc987ff, 0.95).setScrollFactor(0).setDepth(39999);
    this.scene.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 220, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: line, width: 320, duration: 300, ease: 'Cubic.Out' });
    this.scene.time.delayedCall(720, () => {
      this.scene.tweens.add({ targets: [title, line], alpha: 0, duration: 220, onComplete: () => { title.destroy(); line.destroy(); } });
      this.player.controlLocked = false;
      done?.();
    });
  }

  roomReveal(center = { x: GAME_CONFIG.worldWidth / 2, y: GAME_CONFIG.worldHeight / 2 }) {
    this.player.controlLocked = true;
    this.focusCamera(center, 440, 0.94);
    this.scene.time.delayedCall(420, () => { this.player.controlLocked = false; });
  }

  bossFinish(target) {
    if (!GAME_CONFIG.accessibility.slowMotion) return;
    this.focusCamera(target, 420, this.cfg.cameraFinishZoom);
    this.scene.physics.world.timeScale = 0.3;
    this.scene.time.delayedCall(380, () => { this.scene.physics.world.timeScale = 1; });
  }
}
