import { GameManager } from './GameManager.js';

export class AudioManager {
  constructor(scene) { this.scene = scene; }
  click() { this.tone(420, 0.04, 0.05); }
  hit(strong = false) { this.tone(strong ? 110 : 180, strong ? 0.08 : 0.04, strong ? 0.16 : 0.09); }
  dash() { this.tone(280, 0.05, 0.07); }
  reward() { this.tone(660, 0.08, 0.08); setTimeout(() => this.tone(880, 0.07, 0.06), 70); }
  tone(freq, duration = 0.05, gainValue = 0.07) {
    const master = GameManager.save.settings.masterVolume ?? 0.8;
    const sfx = GameManager.save.settings.sfxVolume ?? 0.8;
    if (master <= 0 || sfx <= 0) return;
    try {
      const ctx = this.scene.game.sound.context || new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'triangle';
      gain.gain.value = gainValue * master * sfx;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }
}
