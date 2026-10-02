# Arquitetura

Como o portfólio é montado, carregado e executado. Para rodar, editar e publicar, veja [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md).

## Visão geral

O site é estático: HTML, CSS e JavaScript servidos pelo GitHub Pages, sem backend, sem CDN e sem `npm install`. A interface é declarada num template (`src/template.html`) e controlada por um componente React (`src/app.js`), estendido por módulos independentes. Progresso e preferências ficam no `localStorage` do visitante.

```
src/template.html ─┐                       ┌─> index.html (template + componente embutido)
src/app.js ────────┼─ scripts/build.mjs ───┼─> assets/*.js, assets/*.css (com ?v=hash)
src/*.js, *.css ───┤                       ├─> assets/content.js (projetos, catálogo, currículos)
src/*.tsv, *.json ─┘                       └─> public/ copiado (fontes, imagens, PDFs, vendor/)
                                            (tudo em dist/ e numa cópia na raiz)
```

## Build (`scripts/build.mjs`)

1. Lê o template, o componente, os projetos e todas as traduções.
2. Valida o template (`scripts/validate-template.mjs`): um único `<x-dc>`, o script de controle com o marcador de inserção, `sc-if`/`sc-for` balanceados e o documento fechado.
3. Monta o catálogo de traduções:
   - linhas dos `src/translations*.tsv` (português, inglês, japonês e uma substituição opcional do português), lidas em ordem de nome; uma frase repetida com traduções diferentes interrompe o build;
   - os dados finais do componente, avaliados num `vm` do Node, combinados com `src/localized-data.json` pelo caminho de cada campo;
   - os campos dos projetos, a partir de `src/project-translations.json`.
4. Copia a seção Lab para dentro do desktop do quarto e insere `src/app.js` no script de controle, seguido de `Portfolio.install(Component)`. O resultado passa de novo pelo validador.
5. Confere que os três currículos em PDF existem.
6. Limpa `dist/` (recusando links simbólicos) e, para `dist/` e para a raiz: copia `public/`, copia os módulos e folhas de estilo para `assets/`, gera `assets/content.js` (com `<` escapado no JSON), acrescenta `?v=` com o SHA-256 de cada JS/CSS e grava `index.html` e `.nojekyll`.

## Carregamento no navegador

`index.html` carrega as folhas de estilo, React e ReactDOM locais (`vendor/`), `assets/content.js`, os módulos (`defer`, na ordem do template) e por último `vendor/dc-runtime.js`.

O **runtime de templates** (`dc-runtime.js`, vindo do documento original) encontra o `<x-dc>` e o script `data-dc-script`, executa o script (que define `class Component extends DCLogic`) e compila o template em elementos React:

- `{{expressão}}` lê valores de `renderVals()`;
- `<sc-if value>` e `<sc-for list as>` controlam condicionais e listas;
- `sc-camel-*` vira o nome real da propriedade (`sc-camel-on-click` → `onClick`, `sc-camel-view-box` → `viewBox`, `sc-camel-src` → `src`), com as URLs saneadas pelo runtime.

Antes de o runtime iniciar, o navegador lê o conteúdo de `<x-dc>` como HTML comum (escondido por CSS). Por isso, atributos dinâmicos que o navegador carregaria ou validaria usam `sc-camel-`: assim não há requisições para `{{…}}` nem erros de SVG no console.

## Componente e módulos

`src/app.js` contém o componente original: dados (projetos, quarto, habilidades, conquistas), páginas, quarto em canvas, jogos do fliperama e do controle, paleta de comandos, save e o laço de animação. Os demais arquivos são módulos `window.Portfolio*` com um método `install(Component)` que acrescenta métodos ao protótipo ou envolve os existentes:

```js
const wrap = (name, fn) => { const prior = p[name]; p[name] = function (...args) { return fn.call(this, prior.bind(this), ...args); }; };
```

`src/enhancements.js` instala a integração (idioma, foco, galeria) e, em seguida, os módulos na ordem da lista `Portfolio.modules`: personagem, quarto, dado, tiro, cena, limpeza, boot, desktop, cartuchos, hitbox, conquistas, jogo da TV, TV de entrada, som (escolha de idioma, com sua trilha e equalizador, e tela de título) e controle de toque. Cada módulo envolve o que os anteriores deixaram, então a ordem faz parte do comportamento. Um módulo ausente é registrado no console e o restante continua.

`renderVals()` é a ponte com o template: cada módulo acrescenta os valores e handlers de que suas telas precisam. Handlers usados como `ref` são memorizados no componente para não serem recriados a cada render.

## Laço de animação

- **`startLoop`** (em `app.js`) mantém um único `requestAnimationFrame` e chama, a cada quadro, os trabalhos existentes (`loopRoom`, `loopWorld`, `loopShooter`, `loopTvGame`, `loopScene` e outros). Um trabalho que falha é registrado uma vez e não interrompe os demais. Com a aba oculta, nada é desenhado.
- **Intervalo de 1 s:** atualiza o relógio, verifica eventos de horário e salva o progresso a cada 30 s.
- **TV de entrada** (`tv3d.js`): tem seu próprio `requestAnimationFrame` enquanto o portão de entrada existe, e é destruída ao começar o boot.

## Telas em canvas

| Canvas | Conteúdo |
| --- | --- |
| Quarto | Mundo de 384×224 em pixel art desenhado a partir de `portfolio-art.png`, com câmera que segue Hikaru |
| Mundo das páginas | Hikaru, portas, portais, passagens e o boneco de treino sobre o HTML das páginas |
| TV de entrada | WebGL próprio; a tela usa uma textura desenhada num canvas 2D de 480×360 |
| Jogos | Fliperamas, cartuchos, quebra-blocos, jogo do desktop e Operação Circuito |

## Televisão 3D (`src/tv3d.js`)

- **Estado puro** (`createState`, `step`, `press`, `beginEnter`, `knock`): energia (`on`, `cooling`, `off`, `warming`), canal, volume, câmera orbital, vidro (batidas, rachaduras, quebrado) e entrada (`warm`/`tune` → `align` → `dolly` → `done`). Testável sem WebGL.
- **Modelo:** malhas montadas em código (caixas, troncos, cilindros, esferas, tela curva), materiais por vértice (madeira procedural, plástico, metal, emissivo), quatro luzes e sombra no chão.
- **Interação:** arrastar gira a câmera em torno da TV com inércia; a roda aproxima; um raio contra o plano do painel encontra o seletor ou botão clicado (metade esquerda volta, direita avança), e outro contra o vidro (`screenPoint`) dá o ponto da batida no primeiro canal.
- **Tela:** seis canais desenhados em 160×120 e ampliados (o primeiro é o do modo recrutador: três batidas retornam `crack`, `crack` e `break`, e depois `open`), sobreposições nítidas em 480×360 (placar, textos, número do canal, barra de volume), aquecimento, desligamento e estática. As rachaduras ficam numa camada própria, por cima de qualquer canal, e esmaecem com o mergulho da câmera.
- **Som:** um barramento próprio, controlado pelo volume da TV, e um barramento para os cliques mecânicos, ambos ligados ao mixer do site. A trilha da TV (`theme`) é agendada um pouco à frente nesse barramento a cada quadro; só toca com a TV ligada, fora da entrada e em canais sem música própria (`score`).
- **Entrada:** o cartão OKARU é desenhado na escala exata em que a câmera termina o mergulho, para o portão esmaecer sobre a mesma imagem em tela cheia.
- **Reserva:** sem WebGL, a TV em CSS do template recebe o mesmo canvas da tela e mantém o zoom antigo.

Na primeira visita, a escolha de idioma vem antes: o portão só aparece depois dela (`displayPowerGate` exige o idioma) e entra com a animação de tubo `is-tv-arrive`. A terceira batida chama `breakGlass` com o ponto da página, que abre o modo recrutador por cima do portão; um link dele chama `leaveDisplay`, que desmonta a TV sem boot. O botão de energia reabre o portão na fase `exit`: a TV é criada com `host.exit` e roda `beginExit` (`hold` → `pull` → `swing` → `done`, o inverso de `align` e `dolly`), chamando `onExited` no fim; a reserva em CSS anima `.tv-camera` do zoom até a posição normal, e um tempo-limite garante a saída. `src/display.js` coordena o portão: (`exit`, ao voltar pelo botão de energia) → `idle` → `entering` → (`zoom`, só na reserva) → `reveal` → `done`, com tempos-limite de segurança. O boot só começa em `done`. Segurar o botão de energia do HUD chama `reboot(true)`, que reabre o portão (`reopenDisplay`) com uma TV nova, em vez de iniciar o boot; os demais reboots continuam indo direto ao boot.

## Idiomas

`src/i18n.js` envolve `React.createElement`: textos filhos e os atributos `title`, `aria-label`, `placeholder` e `alt` são traduzidos no momento da renderização, sem reescrever o DOM. A busca usa a frase inteira normalizada; se ela não existir, frases conhecidas dentro do texto são trocadas (da mais longa para a mais curta, com limites de palavra). Textos desenhados em canvas passam por `PortfolioI18n.t`. Trechos que devem manter o idioma original usam `nativeText`.

## Dados no navegador

| Chave | Conteúdo |
| --- | --- |
| `okaru-save-v1` | Progresso: conquistas, objetos explorados, recordes, tutorial do quarto e outros marcadores |
| `okaru-language` | Idioma escolhido (a primeira visita mostra o do navegador sem salvá-lo até a escolha) |
| `okaru-boot-seen` | Marca de que o boot já aconteceu (primeira visita em pânico) |
| `okaru-display` | Estilo de imagem da TV do quarto |
| `okaru-motion` | Ajuste Movimento do menu (completo ou reduzido) |
| `okaru-first-roll` | Primeira rolagem do D20 |

Todo acesso fica em `try/catch`. Sem armazenamento, os valores valem só durante a visita. Novo jogo apaga o progresso, mas mantém idioma, estilo de imagem e Movimento.

## Movimento e acessibilidade

- O item **Movimento** do menu de pausa é a única chave para animações grandes (câmeras, zooms, giros, passagens). Por decisão do projeto, ele vale mesmo que o sistema operacional peça menos animação; o padrão é completo.
- Diálogos usam `role="dialog"` com `aria-modal`, prendem o foco e devolvem o foco ao fechar.
- Os controles da TV, dos jogos e do desktop têm equivalentes por teclado e rótulos acessíveis nos três idiomas.

## Testes

`node --test` com harnesses em `vm`: os módulos e o componente rodam num contexto com DOM, `localStorage`, temporizadores e áudio simulados. Os testes cobrem regras (estado, caminhos, probabilidades, catálogos), contratos de template e CSS, e o conteúdo gerado em `dist/`. `npm test` gera o build antes.

## Publicação

`.github/workflows/pages.yml` instala Node 24, executa o build e os testes e publica `dist/` no GitHub Pages pelo ambiente `github-pages`, com permissões mínimas.
