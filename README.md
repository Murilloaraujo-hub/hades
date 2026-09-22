# SHATTERED REALMS

Protótipo jogável de roguelite de ação isométrico/top-down diagonal para navegador, construído com HTML5, CSS3, JavaScript ES6+ e Phaser 3.

## Como executar

1. Abra a pasta no VS Code.
2. Use a extensão **Live Server** e abra `index.html`.
3. Também funciona com qualquer servidor HTTP estático.

> O Phaser é carregado por CDN, então é necessária internet para a biblioteca na primeira execução.

## Controles

- WASD / Setas: movimento em 8 direções
- Mouse: mira
- Clique esquerdo: ataque
- Clique direito: especial
- Q: habilidade
- R: ultimate
- Espaço: dash
- ESC: pause
- F3: painel debug
- F4: God Mode (desenvolvimento)
- F5: +100 Gold (desenvolvimento)
- F6: spawn boss (desenvolvimento)

## Implementado

- Menu principal funcional
- Hub com 3 NPCs e diálogo persistente
- Soul Shards e progressão permanente
- Save em localStorage com versão/migração
- 5 armas configuradas: espada, lança, arco, manoplas e foice
- Movimento 8 direções e mira independente pelo mouse
- Dash com invulnerabilidade curta, trail e cancelamento prático de recuperação
- Combo, ataque especial, habilidade e ultimate
- Crítico, knockback, elementos e status
- Inimigos melee, ranged, charger e elite
- Boss com 3 fases, summon e ataque telegrafado
- Salas em sequência e 4 biomas visuais
- Recompensa após sala com 3 bênçãos aleatórias
- Entidades originais: Aurelia, Nyxara, Thalion, Voltris e Boreal
- Raridades Common/Rare/Epic/Legendary/Mythic
- Chain Lightning / Overcharge e efeitos elementais
- HUD, HP, gold, sala e arma
- Números de dano e críticos
- Hit stop, screen shake e partículas geradas em runtime
- Pause e controles
- Configurações básicas de acessibilidade
- Debug overlay
- Resumo da run e retorno ao Hub
- Responsividade via Phaser.Scale.FIT

## Estrutura

O projeto foi separado por `core`, `config`, `player`, `weapons`, `enemies`, `systems`, `ui` e `scenes` para expansão contínua.

## Observação sobre arte e áudio

Não há assets copiados de Hades. O protótipo usa formas geradas em runtime e pequenos tons sintetizados como placeholders originais. Isso deixa o gameplay testável imediatamente sem depender de conteúdo protegido por copyright.
