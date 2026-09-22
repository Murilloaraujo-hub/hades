export const ENTITIES = {
  AURELIA: { element: 'Fire', tint: 0xff7b47 },
  NYXARA: { element: 'Void', tint: 0x9a6bff },
  THALION: { element: 'Poison', tint: 0x66e48e },
  VOLTRIS: { element: 'Lightning', tint: 0x77d7ff },
  BOREAL: { element: 'Ice', tint: 0x99e9ff },
};

const BOONS = [
  { id:'blazing-strike', entity:'AURELIA', name:'Blazing Strike', desc:'Ataques causam +20% de dano e ganham elemento Fire.', apply:p=>{p.damageMultiplier*=1.2;p.element='Fire';} },
  { id:'inferno-dash', entity:'AURELIA', name:'Inferno Dash', desc:'Dash cria uma explosão de fogo.', apply:p=>{p.dashExplosion=true;} },
  { id:'chain-lightning', entity:'VOLTRIS', name:'Chain Lightning', desc:'Ataques podem disparar um raio em cadeia.', apply:p=>{p.chainLightningChance+=0.22;p.element='Lightning';} },
  { id:'overcharge', entity:'VOLTRIS', name:'Overcharge', desc:'+12% crítico; críticos liberam descarga.', apply:p=>{p.criticalChance+=0.12;p.overcharge=true;} },
  { id:'frozen-edge', entity:'BOREAL', name:'Frozen Edge', desc:'Golpes desaceleram e +10% dano.', apply:p=>{p.damageMultiplier*=1.1;p.element='Ice';} },
  { id:'shadow-step', entity:'NYXARA', name:'Shadow Step', desc:'Dash recarrega 20% mais rápido e deixa sombra ofensiva.', apply:p=>{p.dashCooldownMultiplier*=0.8;p.shadowDash=true;} },
  { id:'thorn-heart', entity:'THALION', name:'Thorn Heart', desc:'+70 HP máximo e cura 70 imediatamente.', apply:p=>{p.maxHP+=70;p.hp=Math.min(p.maxHP,p.hp+70);} },
  { id:'venom-touch', entity:'THALION', name:'Venom Touch', desc:'Ataques ganham Poison e +15% velocidade.', apply:p=>{p.attackSpeedMultiplier*=1.15;p.element='Poison';} },
  { id:'executioner', entity:'NYXARA', name:'Executioner', desc:'+35% dano contra inimigos com menos de 35% HP.', apply:p=>{p.executeBonus=0.35;} },
];

const RARITIES = [
  { name:'Common', weight:55, multiplier:1 },
  { name:'Rare', weight:25, multiplier:1.15 },
  { name:'Epic', weight:12, multiplier:1.3 },
  { name:'Legendary', weight:6, multiplier:1.5 },
  { name:'Mythic', weight:2, multiplier:1.8 },
];

export class UpgradeSystem {
  static randomRarity() {
    const total = RARITIES.reduce((s,r)=>s+r.weight,0); let roll=Math.random()*total;
    for(const r of RARITIES){ roll-=r.weight; if(roll<=0) return r; }
    return RARITIES[0];
  }
  static choices(count=3) {
    const pool=[...BOONS].sort(()=>Math.random()-.5).slice(0,count);
    return pool.map(b=>({ ...b, rarity:this.randomRarity() }));
  }
  static apply(player, boon) {
    boon.apply(player);
    player.boons.push({ id: boon.id, name: boon.name, rarity: boon.rarity.name, entity: boon.entity });
  }
}
