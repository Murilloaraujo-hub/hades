export const NPCS = [
  { id:'lyra', name:'Lyra', role:'Cartógrafa das Fendas', color:'#8ee9ff', lines:['As fissuras mudaram outra vez. Volte vivo e eu atualizo o mapa.', 'Você está ficando rápido. Talvez rápido demais para as próprias cicatrizes.'] },
  { id:'orin', name:'Orin', role:'Ferreiro do Eco', color:'#ffc47d', lines:['Cada arma lembra quem a empunhou. Escolha o que quer deixar para trás.', 'Soul Shards ressoam com metal antigo. Posso fazê-las trabalhar por você.'] },
  { id:'ves', name:'Ves', role:'Guardião Silencioso', color:'#c6a0ff', lines:['O núcleo ainda pulsa.', 'Quatro regiões. Quatro mentiras. Uma saída.'] },
];
export class DialogueSystem {
  static line(npc, save) {
    const idx = (save.dialogueFlags[`${npc.id}_talks`] || 0) % npc.lines.length;
    save.dialogueFlags[`${npc.id}_talks`] = idx + 1;
    return npc.lines[idx];
  }
}
