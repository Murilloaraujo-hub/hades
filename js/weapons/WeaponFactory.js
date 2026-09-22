import { Weapon } from './Weapon.js';
const DATA = {
  sword:{name:'Espada do Eco',damage:32,range:82,arc:1.15,cooldown:260,specialDamage:58,specialRange:105,specialCooldown:900,combo:[1,1.05,1.45]},
  spear:{name:'Lança Prismática',damage:37,range:125,arc:.5,cooldown:320,specialDamage:72,specialRange:190,specialCooldown:1150,combo:[1,1.1,1.35]},
  bow:{name:'Arco da Fenda',damage:29,range:330,arc:.25,cooldown:390,specialDamage:54,specialRange:390,specialCooldown:1000,projectile:true,combo:[1,1,1.3]},
  gauntlets:{name:'Manoplas Cinéticas',damage:20,range:62,arc:1,cooldown:155,specialDamage:49,specialRange:85,specialCooldown:700,combo:[1,1,1.05,1.1,1.5]},
  scythe:{name:'Foice Umbral',damage:35,range:110,arc:1.65,cooldown:350,specialDamage:68,specialRange:140,specialCooldown:1050,combo:[1,1.1,1.5]},
};
export class WeaponFactory { static create(player,id='sword'){ return new Weapon(player,{id,...(DATA[id]||DATA.sword)}); } static ids(){return Object.keys(DATA);} static data(){return DATA;} }
