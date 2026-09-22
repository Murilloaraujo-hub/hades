import { GAME_CONFIG } from '../config/GameConfig.js';
import { GameManager } from '../core/GameManager.js';
import { OverlayMenu } from '../ui/OverlayMenu.js';
import { WeaponFactory } from '../weapons/WeaponFactory.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#080b13');
    const w = this.scale.width, h = this.scale.height;
    for (let i = 0; i < 80; i++) {
      const c = this.add.circle(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), Phaser.Math.Between(1, 3), 0x7ae1ff, Phaser.Math.FloatBetween(.08, .35));
      this.tweens.add({ targets: c, alpha: { from: c.alpha, to: .03 }, y: c.y - Phaser.Math.Between(8, 30), duration: Phaser.Math.Between(1000, 3000), yoyo: true, repeat: -1 });
    }
    const unlocked = GameManager.save.progression.unlockedWeapons;
    OverlayMenu.show({ title: GAME_CONFIG.gameName, subtitle: `Roguelite isométrico original • v${GAME_CONFIG.version}<br>Runs: ${GameManager.save.statistics.runs} • Soul Shards: ${GameManager.save.progression.soulShards}`, buttons: [
      { label: 'PLAY', onClick: () => { OverlayMenu.clear(); GameManager.newRun(); this.scene.start('GameScene', { weapon: GameManager.save.progression.selectedWeapon || unlocked[0] || 'sword' }); } },
      { label: 'SALA DE TESTE VISUAL', onClick: () => { OverlayMenu.clear(); GameManager.newRun(); this.scene.start('GameScene', { weapon: 'sword', visualTest: true }); } },
      { label: 'HUB', onClick: () => { OverlayMenu.clear(); this.scene.start('HubScene'); } },
      { label: 'ARMAS', onClick: () => this.weaponMenu() },
      { label: 'CONFIGURAÇÕES', onClick: () => this.settingsMenu() },
    ] });
  }

  weaponMenu() {
    const p = GameManager.save.progression, unlocked = p.unlockedWeapons;
    OverlayMenu.show({ title: 'ARMAS', subtitle: `Selecionada: ${WeaponFactory.data()[p.selectedWeapon || 'sword'].name}`, buttons: [
      ...WeaponFactory.ids().map(id => ({ label: `${p.selectedWeapon === id ? '▶' : unlocked.includes(id) ? '✓' : '🔒'} ${WeaponFactory.data()[id].name}`, onClick: () => {
        if (unlocked.includes(id)) { p.selectedWeapon = id; GameManager.persist(); this.weaponMenu(); }
        else OverlayMenu.show({ title: 'ARMA BLOQUEADA', subtitle: 'Desbloqueie esta arma no Arsenal do Hub usando Soul Shards.', buttons: [{ label: 'VOLTAR', onClick: () => this.weaponMenu() }] });
      } })), { label: 'VOLTAR', onClick: () => this.create() },
    ] });
  }

  settingsMenu() {
    const s = GameManager.save.settings;
    const qualities = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
    const apply = () => {
      GAME_CONFIG.accessibility.screenShake = s.screenShake;
      GAME_CONFIG.accessibility.damageNumbers = s.damageNumbers;
      GAME_CONFIG.accessibility.flashes = s.flashes;
      GAME_CONFIG.accessibility.motionBlur = s.motionBlur;
      GAME_CONFIG.accessibility.slowMotion = s.slowMotion;
      GAME_CONFIG.effects.particleQuality = s.particles === false ? 'OFF' : s.quality;
      GAME_CONFIG.effects.trailQuality = s.trails ? s.quality : 'LOW';
      GameManager.persist(); this.settingsMenu();
    };
    OverlayMenu.show({ title: 'CONFIGURAÇÕES VISUAIS', subtitle: `Qualidade: ${s.quality} • Shake: ${s.screenShake === 1 ? '100%' : s.screenShake === .5 ? '50%' : 'OFF'} • Partículas: ${s.particles ? 'ON' : 'OFF'} • Flashes: ${s.flashes ? 'ON' : 'OFF'} • Trails: ${s.trails ? 'ON' : 'OFF'} • Slow Motion: ${s.slowMotion ? 'ON' : 'OFF'}`, buttons: [
      { label: `Qualidade: ${s.quality}`, onClick: () => { s.quality = qualities[(qualities.indexOf(s.quality) + 1) % qualities.length]; apply(); } },
      { label: 'Screen Shake: alternar 100% / 50% / OFF', onClick: () => { s.screenShake = s.screenShake === 1 ? .5 : s.screenShake === .5 ? 0 : 1; apply(); } },
      { label: 'Alternar Partículas', onClick: () => { s.particles = !s.particles; apply(); } },
      { label: 'Alternar Damage Numbers', onClick: () => { s.damageNumbers = !s.damageNumbers; apply(); } },
      { label: 'Alternar Flashes', onClick: () => { s.flashes = !s.flashes; apply(); } },
      { label: 'Alternar Motion Blur / Afterimage', onClick: () => { s.motionBlur = !s.motionBlur; apply(); } },
      { label: 'Alternar Trails', onClick: () => { s.trails = !s.trails; apply(); } },
      { label: 'Alternar Slow Motion', onClick: () => { s.slowMotion = !s.slowMotion; apply(); } },
      { label: 'VOLTAR', onClick: () => this.create() },
    ] });
  }
}
