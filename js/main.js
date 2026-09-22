import { GAME_CONFIG } from './config/GameConfig.js';
import { GameManager } from './core/GameManager.js';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { HubScene } from './scenes/HubScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const settings = GameManager.save.settings;
GAME_CONFIG.accessibility.screenShake = settings.screenShake ?? 1;
GAME_CONFIG.accessibility.damageNumbers = settings.damageNumbers ?? true;
GAME_CONFIG.accessibility.flashes = settings.flashes ?? true;
GAME_CONFIG.accessibility.motionBlur = settings.motionBlur ?? true;
GAME_CONFIG.accessibility.slowMotion = settings.slowMotion ?? true;
GAME_CONFIG.effects.particleQuality = settings.particles === false ? 'OFF' : (settings.quality || 'HIGH');
GAME_CONFIG.effects.trailQuality = settings.trails === false ? 'LOW' : (settings.quality || 'HIGH');

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  backgroundColor: GAME_CONFIG.backgroundColor,
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  physics: { default: 'arcade', arcade: { debug: false, gravity: { y: 0 } } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GAME_CONFIG.width, height: GAME_CONFIG.height },
  render: { powerPreference: 'high-performance', antialias: true },
  scene: [BootScene, MainMenuScene, HubScene, GameScene, GameOverScene],
});
