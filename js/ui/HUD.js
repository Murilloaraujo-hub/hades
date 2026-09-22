import { EventBus, EVENTS } from '../core/EventBus.js';

export class HUD {
  constructor(scene, player, run) {
    this.scene = scene; this.player = player; this.run = run;
    this.make();
    this.bound = () => this.refresh();
    EventBus.on(EVENTS.PLAYER_DAMAGED, this.bound);
    EventBus.on(EVENTS.HUD_REFRESH, this.bound);
    EventBus.on(EVENTS.GOLD_CHANGED, this.bound);
  }

  make() {
    const s = this.scene;
    this.container = s.add.container(24, 24).setScrollFactor(0).setDepth(20000).setAlpha(0).setX(-30);
    this.bg = s.add.rectangle(0, 0, 340, 112, 0x090d18, .90).setOrigin(0).setStrokeStyle(1, 0x8fe7ff, .18);
    this.name = s.add.text(18, 12, 'SHATTERED REALMS', { fontSize: '13px', fontStyle: 'bold', color: '#9de9ff', letterSpacing: 1 });
    this.hpBack = s.add.rectangle(18, 43, 270, 17, 0x22283a).setOrigin(0);
    this.hpDelay = s.add.rectangle(18, 43, 270, 17, 0xffc764, .72).setOrigin(0);
    this.hpFill = s.add.rectangle(18, 43, 270, 17, 0xff6578).setOrigin(0);
    this.hpText = s.add.text(153, 51, '', { fontSize: '12px', fontStyle: 'bold' }).setOrigin(.5);
    this.meta = s.add.text(18, 75, '', { fontSize: '13px', color: '#d6d9e7' });
    this.ultimate = s.add.rectangle(18, 97, 270, 5, 0x24304c).setOrigin(0);
    this.ultimateFill = s.add.rectangle(18, 97, 0, 5, 0x8fe7ff).setOrigin(0);
    this.container.add([this.bg, this.name, this.hpBack, this.hpDelay, this.hpFill, this.hpText, this.meta, this.ultimate, this.ultimateFill]);
    s.tweens.add({ targets: this.container, alpha: 1, x: 24, duration: 420, ease: 'Cubic.Out' });

    this.controls = s.add.text(s.scale.width - 22, s.scale.height - 22, 'LMB Ataque  •  RMB Especial  •  Q Habilidade  •  R Ultimate  •  SPACE Dash  •  ESC Pausa', {
      fontSize: '12px', color: '#c6c9d8', backgroundColor: '#090d18cc', padding: { x: 10, y: 7 },
    }).setOrigin(1).setScrollFactor(0).setDepth(20000).setAlpha(0);
    s.tweens.add({ targets: this.controls, alpha: 1, duration: 500, delay: 160 });

    this.damageVignette = s.add.rectangle(s.scale.width / 2, s.scale.height / 2, s.scale.width, s.scale.height, 0xb3132f, 0)
      .setScrollFactor(0).setDepth(18000).setStrokeStyle(28, 0xff284f, 0);
    this.lowHealth = s.add.rectangle(s.scale.width / 2, s.scale.height / 2, s.scale.width - 14, s.scale.height - 14, 0x000000, 0)
      .setScrollFactor(0).setDepth(17999).setStrokeStyle(12, 0xff3855, 0);
    this.refresh(true);
  }

  refresh(immediate = false) {
    if (!this.player?.active) return;
    const ratio = Math.max(0, this.player.hp / this.player.maxHP);
    const target = 270 * ratio;
    this.scene.tweens.killTweensOf(this.hpFill);
    this.scene.tweens.add({ targets: this.hpFill, width: target, duration: immediate ? 0 : 110, ease: 'Cubic.Out' });
    this.scene.tweens.killTweensOf(this.hpDelay);
    this.scene.tweens.add({ targets: this.hpDelay, width: target, duration: immediate ? 0 : 520, delay: immediate ? 0 : 120, ease: 'Sine.Out' });
    this.hpText.setText(`${Math.ceil(this.player.hp)} / ${Math.ceil(this.player.maxHP)}`);
    this.meta.setText(`Gold ${this.run.gold}   •   Sala ${this.run.rooms + 1}   •   ${this.player.weapon.name}`);
    this.ultimateFill.width = 270 * Math.min(1, (this.player.ultimateCharge || 0) / 100);
    this.lowHealth.setStrokeStyle(12, 0xff3855, ratio <= .25 ? .22 : 0);
    if (ratio <= .25 && !this._lowHealthTween) {
      this._lowHealthTween = this.scene.tweens.add({ targets: this.lowHealth, alpha: { from: .08, to: .24 }, duration: 700, yoyo: true, repeat: -1 });
    } else if (ratio > .25 && this._lowHealthTween) {
      this._lowHealthTween.stop(); this._lowHealthTween = null; this.lowHealth.setAlpha(0);
    }
  }

  onDamage() {
    this.refresh();
    this.scene.tweens.killTweensOf(this.container);
    this.container.setScale(1.04);
    this.scene.tweens.add({ targets: this.container, scale: 1, duration: 180, ease: 'Back.Out' });
    this.damageVignette.setFillStyle(0xb3132f, 0.09).setStrokeStyle(24, 0xff2348, 0.22);
    this.scene.tweens.add({ targets: this.damageVignette, alpha: 0, duration: 260, onComplete: () => this.damageVignette.setFillStyle(0xb3132f, 0).setStrokeStyle(24, 0xff2348, 0) });
    if (this.player.hp / this.player.maxHP <= .25) {
      this.scene.tweens.killTweensOf(this.lowHealth);
      this.scene.tweens.add({ targets: this.lowHealth, alpha: { from: .25, to: .08 }, duration: 620, yoyo: true, repeat: 1 });
    }
  }

  destroy() {
    EventBus.off(EVENTS.PLAYER_DAMAGED, this.bound);
    EventBus.off(EVENTS.HUD_REFRESH, this.bound);
    EventBus.off(EVENTS.GOLD_CHANGED, this.bound);
    this._lowHealthTween?.stop();
    this.container.destroy(true); this.controls.destroy(); this.damageVignette.destroy(); this.lowHealth.destroy();
  }
}
