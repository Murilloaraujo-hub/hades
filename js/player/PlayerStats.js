import { GAME_CONFIG } from '../config/GameConfig.js';
export function makePlayerStats(permanent={}) {
  return {
    maxHP: GAME_CONFIG.playerBaseHP + (permanent.hp||0)*5,
    hp: GAME_CONFIG.playerBaseHP + (permanent.hp||0)*5,
    speed: GAME_CONFIG.playerSpeed,
    damageMultiplier:1,
    attackSpeedMultiplier:1,
    criticalChance:GAME_CONFIG.criticalChance+(permanent.crit||0)*.01,
    criticalMultiplier:GAME_CONFIG.criticalMultiplier,
    element:'Physical',
    dashCooldownMultiplier:1,
    dashExplosion:false,
    shadowDash:false,
    chainLightningChance:0,
    overcharge:false,
    executeBonus:0,
    boons:[],
  };
}
