# SHATTERED REALMS — Visual Overhaul v0.2

Vertical slice de roguelite de ação isométrico original para navegador, feito com HTML5, CSS3, JavaScript ES6+ e Phaser 3.

Esta versão concentra o trabalho em câmera, animação de armas, VFX, impacto de combate, apresentação do boss, UI animada e leitura visual.

## Executar

1. Extraia a pasta.
2. Abra no VS Code.
3. Rode `index.html` com a extensão **Live Server**.
4. O Phaser 3 é carregado por CDN, então o navegador precisa de internet ao iniciar.

Também funciona com qualquer servidor HTTP local simples. Não abra por `file://`, pois módulos ES6 costumam ser bloqueados pelo navegador nesse modo.

## Controles

- `WASD` / setas — movimento em 8 direções
- Mouse — mira independente
- Clique esquerdo — ataque / carregar arco
- Clique direito — especial
- `Q` — habilidade
- `R` — ultimate
- `SPACE` — dash
- `ESC` — pausa
- `F3` — debug
- `F4` — God Mode de desenvolvimento
- `F5` — +100 Gold
- `F6` — invocar boss
- `F7` — entrar na Sala de Teste Visual

## Sala de Teste Visual

O menu principal possui **SALA DE TESTE VISUAL**. Ela usa espada e um dummy com vida praticamente infinita para testar:

- antecipação do golpe;
- swing físico da espada;
- quatro movimentos de combo;
- slash em arco;
- trail da ponta da arma;
- attack lunge;
- partículas no ponto de contato;
- flash de dano;
- stagger;
- knockback;
- hit stop;
- crítico;
- câmera/look ahead;
- zoom dinâmico;
- dash/afterimages.

## Câmera

`js/systems/CameraManager.js`

- follow interpolado;
- pequeno atraso cinematográfico;
- look ahead por movimento;
- look ahead por mira;
- deadzone;
- zoom de exploração;
- zoom de combate;
- zoom para multidões;
- zoom de boss;
- camera focus;
- room reveal;
- boss intro;
- boss finish;
- presets de shake;
- limites do mapa para não mostrar o exterior.

## VFX

`js/systems/VFXManager.js`

- slash arcs;
- weapon trails;
- partículas direcionais;
- shockwaves;
- dash trail;
- afterimages;
- dash impact;
- projectile trails;
- death shards;
- partículas ambientais;
- sombras no chão;
- cores específicas por elemento;
- limite de trails;
- pool reutilizável para partículas de hit.

## Combat Feedback

`js/systems/CombatFeedback.js`

Presets:

- `LIGHT_HIT`
- `MEDIUM_HIT`
- `HEAVY_HIT`
- `CRITICAL_HIT`
- `BOSS_HIT`
- `EXPLOSION`

Cada preset combina shake, hit stop, flash e partículas.

## Espada e armas

A espada possui combo de quatro ataques com arcos diferentes. O dano é aplicado depois da antecipação para sincronizar a hitbox com o movimento visível da lâmina.

Também existem:

- lança com thrust visual;
- arco com carregamento e potência variável;
- manoplas rápidas;
- foice com arcos amplos;
- especiais próprios.

## Dash

- 8 direções;
- invulnerabilidade curta;
- dash cancel;
- squash/stretch;
- afterimages;
- trail elemental;
- efeito ao terminar;
- suporte aos upgrades Inferno Dash e Shadow Step.

## Inimigos

- melee;
- ranged com telegraph;
- charger com linha/área de antecipação;
- elite;
- dummy de teste;
- bosses com três fases.

Feedback recebido:

- flash curto;
- partículas;
- knockback;
- stagger;
- reação visual;
- barra de HP;
- animação de morte em vez de desaparecer instantaneamente.

## Boss

A sala de boss possui:

- bloqueio curto de controle;
- foco de câmera;
- nome do boss;
- cue sonoro original sintetizado;
- zoom especial;
- barra de vida dedicada;
- múltiplas fases;
- summons;
- ataque de área telegrafado;
- câmera e slow motion curtos na morte.

## Cenário

- arena ampliada para permitir movimento real da câmera;
- piso diagonal/isométrico simulado;
- depth sorting por Y;
- sombras;
- glows mágicos;
- névoa com parallax suave;
- partículas ambientais;
- colunas em camadas;
- foreground com transparência dinâmica;
- objetos decorativos quebráveis;
- portas com abertura animada;
- transição curta entre salas.

## HUD

- entrada animada;
- barra de HP principal;
- barra atrasada de dano;
- pulso ao receber dano;
- vinheta leve;
- indicação sutil de low health;
- barra de ultimate;
- Gold, sala e arma;
- números de dano por elemento;
- crítico maior com bounce.

## Configurações visuais

No menu:

- qualidade `LOW / MEDIUM / HIGH / ULTRA`;
- partículas on/off;
- trails on/off;
- screen shake 100% / 50% / off;
- flashes on/off;
- motion blur/afterimage on/off;
- damage numbers on/off;
- slow motion on/off.

## Arquivos principais

```text
js/config/GameConfig.js
js/core/AudioManager.js
js/core/EventBus.js
js/core/GameManager.js
js/core/InputManager.js
js/core/SaveManager.js
js/player/Player.js
js/enemies/Enemy.js
js/enemies/Boss.js
js/systems/CameraManager.js
js/systems/VFXManager.js
js/systems/CombatFeedback.js
js/systems/DamageSystem.js
js/systems/RoomManager.js
js/scenes/GameScene.js
js/ui/HUD.js
```

## Validação realizada

- Todos os módulos `.js` passam em `node --check`.
- Todos os imports relativos apontam para arquivos existentes.
- Não existem TODOs, funções vazias ou mensagens `implementar depois` no projeto.
- O ambiente usado para montar o projeto não consegue resolver `cdn.jsdelivr.net`, portanto a validação visual completa do Phaser no Chromium não pôde ser executada aqui. Em um navegador com internet, o CDN configurado em `index.html` fornece o Phaser 3.90.0.

## Identidade

Não usa personagens, sprites, mapas, interface, músicas ou assets de Hades. Os placeholders visuais desta build são gerados pelo próprio código e servem como uma identidade original temporária para continuar evoluindo o projeto.
