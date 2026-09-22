export const BIOMES = [
  { id:'underground', name:'Ruínas Subterrâneas', floor:0x24283b, accent:0xff7a44, enemyTint:0xef766d, boss:'The Warden' },
  { id:'forest', name:'Floresta Sombria', floor:0x1d352d, accent:0x79d98c, enemyTint:0x78b887, boss:'The Hollow Stag' },
  { id:'celestial', name:'Templo Celestial', floor:0x444659, accent:0xf0df9c, enemyTint:0xe7d8a9, boss:'Seraph Null' },
  { id:'abyss', name:'Abismo', floor:0x1e1835, accent:0xae7bff, enemyTint:0x9d6bdb, boss:'The Rift Maw' },
];

export class DungeonGenerator {
  static generate(seed=Math.floor(Math.random()*999999)) {
    const rooms=[];
    for(let biome=0;biome<BIOMES.length;biome++) {
      rooms.push({type:'start',biome});
      rooms.push({type:'combat',biome});
      rooms.push({type:Math.random()<.35?'elite':'combat',biome});
      rooms.push({type:'reward',biome});
      rooms.push({type:'shop',biome});
      rooms.push({type:'boss',biome});
    }
    return { seed, rooms };
  }
}
