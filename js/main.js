import { GAME_CONFIG } from './config/GameConfig.js';
import { GameManager } from './core/GameManager.js';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { HubScene } from './scenes/HubScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

GAME_CONFIG.accessibility.screenShake = GameManager.save.settings.screenShake ?? 1;
GAME_CONFIG.accessibility.damageNumbers = GameManager.save.settings.damageNumbers ?? true;
GAME_CONFIG.accessibility.flashes = GameManager.save.settings.flashes ?? true;

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
  render: { powerPreference: 'high-performance' },
  scene: [BootScene, MainMenuScene, HubScene, GameScene, GameOverScene],
});
