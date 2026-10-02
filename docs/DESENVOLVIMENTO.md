# Desenvolvimento e manutenção

Notas técnicas do portfólio: execução local, organização do código, regras para editar, publicação, currículos, privacidade, verificação e o comportamento detalhado de cada área. A apresentação do portfólio e do autor fica no [README](../README.md); o funcionamento interno, em [ARQUITETURA.md](ARQUITETURA.md).

## Executar localmente

Use Node.js 22 ou superior (o workflow usa Node 24). Não é necessário `npm install`: o build usa módulos nativos do Node.

```powershell
npm run build
npm test
npm run dev
```

Abra `http://127.0.0.1:4173`. Encerre com `Ctrl+C`. Após editar fontes, execute o build novamente; não há recarga automática. `npm test` executa o build antes (`pretest`), porque os testes também conferem os arquivos gerados.

O build reconstrói `dist/` e gera uma cópia na raiz para uso local (ignorada pelo Git; o workflow gera e publica `dist/`). CSS/JS recebem hashes de conteúdo na URL para atualizar o cache quando mudam. Edite os arquivos em `src/`, pois `index.html`, `assets/` e `vendor/` são gerados. React, fontes, imagens e PDFs são locais; o site não depende de CDN ou backend.

## Organização

| Caminho | Função |
| --- | --- |
| `src/template.html` | Marcação de todas as telas, interpretada pelo runtime de templates |
| `src/app.js` | Componente principal: dados, páginas, quarto, jogos originais, save e laço de animação |
| `src/enhancements.js` | Integração: idioma, foco dos diálogos, galeria e a ordem de instalação dos módulos |
| `src/i18n.js` | Tradução na fronteira de renderização e preferência de idioma |
| `src/tv3d.js` | Televisão 3D da entrada: modelo WebGL próprio, câmera orbital, canais, controles e som |
| `src/display.js` | Fluxo da entrada (explorar, entrar, zoom, revelar), TV em CSS como reserva e estilos de imagem da TV do quarto |
| `src/boot.js`, `src/boot-flow.js` | Linhas do boot, pânico fictício e recuperação |
| `src/skill-tree.js` | Layout da árvore de habilidades |
| `src/character.js`, `src/character-care.js` | Quedas, tropeços e limpeza da poeira de Hikaru |
| `src/scene.js` | Caminhada entre páginas, rede de passagens secretas (páginas e quarto), passagens dos botões da home, ajuste de Movimento e fichas |
| `src/title-sound.js` | Som da tela de título: preferência desde o menu, trilha própria, tecla M e silêncio atrás da TV de entrada |
| `src/room-props.js` | Objetos extras do quarto, pelúcias, estante e diálogos |
| `src/desktop.js` | Desktop do computador do quarto: zoom no monitor, janelas e aplicativos |
| `src/tv-game.js` | Quebra-blocos jogado no puff |
| `src/dice.js`, `src/shooter.js`, `src/pocket-games.js` | D20, Operação Circuito e cartuchos dos controles clássicos |
| `src/hitbox.js` | Hitbox, lista de lutadores e golpes, e o boneco de treino |
| `src/achievements.js` | Conquistas adicionadas aos módulos |
| `src/*.css` | `styles.css` (base), `enhancements.css`, `desktop.css`, `display.css`, `tv-game.css` e `fonts.css` (fontes locais) |
| `src/projects.json` | Projetos, repositórios e galerias |
| `src/translations*.tsv` | Catálogo PT/EN/JA separado por tabulação |
| `src/project-translations.json`, `src/localized-data.json` | Traduções dos projetos e dos dados do componente |
| `public/` | Fontes, imagens, diagramas, currículos em PDF e bibliotecas (`vendor/`), copiados sem alteração |
| `scripts/build.mjs` | Build estático para `dist/` e a cópia na raiz |
| `scripts/validate-template.mjs` | Contrato do template, usado pelo build e pelos testes |
| `scripts/serve.mjs` | Servidor local de `dist/` (`npm run dev`) |
| `scripts/audit-translations.mjs` | Lista textos candidatos sem tradução em `.cache/untranslated.json` |
| `scripts/project-diagrams.mjs` | Gera os diagramas SVG dos projetos em `public/assets/projects/` |
| `scripts/*-resumes.*`, `scripts/resume_privacy.py` | Preparo, exportação e verificação dos currículos |
| `tests/` | Testes automatizados com `node:test` |
| `docs/` | [Índice da documentação](README.md) |

Os scripts descartáveis da migração foram removidos. A cópia original e os resultados temporários de revisão em `.cache/` são ignorados pelo Git.

## Regras para editar

- **Edite `src/` e `public/`.** `index.html`, `assets/`, `vendor/`, `resume/` e `dist/` são gerados pelo build.
- **Textos:** toda interface nova precisa de linha em um `src/translations*.tsv` com português, inglês e japonês, separados por tabulação (uma quarta coluna opcional substitui o próprio português). A mesma frase com traduções diferentes em dois arquivos interrompe o build.
- **Template:** antes do runtime, o navegador lê o conteúdo de `<x-dc>` como HTML comum. Atributos com `{{…}}` que o navegador carrega ou valida (`src`, `data`, `d`, `transform`, `x`, `y`, `fill`, `stroke` e semelhantes) usam o prefixo `sc-camel-` (por exemplo, `sc-camel-src="{{imagem}}"`). Um teste impede a regressão.
- **Módulo novo:** crie o arquivo em `src/`, inclua-o na lista de `scripts/build.mjs`, no `<script defer>` do template (antes de `enhancements.js`), na lista `modules` de `src/enhancements.js` (na posição certa da ordem de instalação) e no harness `controller()` de `tests/portfolio.test.mjs`.
- **Movimento:** animações grandes seguem `calm()`, ou seja, o item Movimento do menu de pausa, salvo em `okaru-motion`.
- **Armazenamento:** todo acesso a `localStorage` fica em `try/catch`; o site precisa funcionar sem ele.

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` gera o site, executa os testes e publica `dist/`.

1. Abra **Hikaru-0gasawara/Portifolio** no GitHub. Para Pages no plano gratuito, use um repositório público.
2. Envie os arquivos, incluindo `src/`, `scripts/`, `tests/`, `public/`, `package.json` e `.github/workflows/pages.yml`.
3. Entre em **Settings → Pages**.
4. Em **Build and deployment → Source**, escolha **GitHub Actions**. Não tente selecionar `dist` na publicação por branch: essa modalidade aceita apenas raiz ou `docs`.
5. Faça push de um commit para `main`. Se ele já estiver no GitHub, vá a **Actions → Publish portfolio → Run workflow → main → Run workflow**.
6. Aguarde os jobs **build** e **deploy** ficarem verdes. Se houver regra de aprovação no ambiente `github-pages`, aprove pela interface do GitHub.
7. Abra o endereço em **Settings → Pages** ou no resultado do deploy. A URL esperada deste repositório é **https://hikaru-0gasawara.github.io/Portifolio/**.
8. Atualizações futuras são publicadas a cada push para `main`.

Exemplo no terminal, após revisar `git status`:

```powershell
git add README.md package.json .gitignore .github/workflows src scripts tests public docs
git commit -m "Refatora portfolio e prepara GitHub Pages"
git push origin main
```

Não precisa criar token pessoal. O workflow usa `GITHUB_TOKEN`, com `pages: write` e `id-token: write` somente no job de deploy. A configuração segue a [documentação oficial de workflows do Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Resolver problemas de publicação

- **404 inicial:** confira o deploy, a grafia de `Portifolio` e a URL com `/Portifolio/`. O arquivo inicial é `index.html` em minúsculas.
- **Assets ou PDFs com 404:** confira maiúsculas e extensões. Use `./assets/...` e `./resume/...`, sem `/` no início. Faça novo build após adicionar arquivos.
- **Workflow não executa:** confira **Settings → Actions → General**, se o YAML foi enviado e se a branch é `main`.
- **Deploy negado:** confirme **GitHub Actions** em Pages e as regras do ambiente `github-pages`. Consulte o erro antes de mudar permissões.
- **Versão antiga:** espere o deploy e recarregue com `Ctrl+Shift+R`.
- **Domínio próprio:** configure apenas se possuir um domínio. O endereço `github.io` já usa HTTPS.

Referências: [fonte de publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [erros 404](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites), [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

## Adicionar imagens aos projetos

Coloque fotos, capturas ou diagramas em `public/assets/projects/`. No array `gallery` do respectivo projeto em `src/projects.json`, adicione:

```json
{
  "src": "./assets/projects/aquasense-hardware.jpg",
  "alt": "ESP32 conectado ao LCD e aos sensores do AquaSense",
  "caption": "Protótipo AquaSense — hardware real"
}
```

As setas percorrem as imagens. **Ampliar** abre o visualizador; `Esc` fecha. Use descrições acessíveis e identifique diagramas ilustrativos. Mantenha `repositoryUrl: null` quando não houver repositório. Evite dados privados em capturas.

## Currículos e idiomas

PDFs públicos: `public/resume/hikaru-pt.pdf`, `hikaru-en.pdf` e `hikaru-ja.pdf`. Os DOCX originais não precisam ser enviados ao GitHub. Ao substituir os PDFs, confira que o telefone removido não reapareceu no texto ou nos links.

Toda entrada/recarregamento começa com uma **televisão 3D de verdade**, desenhada em WebGL pelo próprio site (sem bibliotecas externas): gabinete de madeira com veios, painel de latão com seletores, botão de energia e botão **Entrar**, alto-falante, pés, antena e uma traseira afunilada com ventilação e etiqueta. A TV fica parada no seu eixo e **só a câmera se move**: arraste para girar 360°, ver por trás, por cima e por baixo; a roda do mouse aproxima e afasta. Pelo teclado, setas giram a câmera. A TV já começa **ligada**, passando um jogo de luta enquanto ninguém mexe. Os seletores trocam entre cinco canais com arte e sons originais: **Luta**, **Monstros de bolso** (batalha no estilo Pokémon), **Show ao vivo**, **RPG** (no estilo Persona) e **Faroeste** (no estilo Red Dead). A troca passa por estática com o número do canal na tela. O volume funciona de verdade e mostra uma barra subindo ou descendo; o botão de energia desliga a TV com o colapso do tubo em linha e ponto, e liga de novo com aquecimento, ponto, linha, chuva de estática e “blup”. Clique na metade esquerda de um seletor para voltar e na direita para avançar. O mesmo comando fica no painel abaixo da TV, acessível por teclado (PageUp/PageDown ou [ ] trocam canal, + e − mudam o volume, P liga e desliga, Enter entra).

**Entrar no portfólio** (botão vermelho na TV ou no painel): se a TV estiver desligada, ela liga primeiro; a tela sintoniza o cartão OKARU, a câmera dá a volta até ficar de frente e mergulha na tela até o vidro ocupar tudo, e a TV esmaece sobre o mesmo cartão em tela cheia. Só então começam a seleção de idioma (primeira visita) ou o boot. Com Movimento reduzido no menu, não há voo de câmera: a imagem aparece e esmaece. Sem WebGL, a TV em CSS continua como reserva, com os mesmos canais na tela e o zoom antigo.

O primeiro toque ou clique na página libera o áudio do navegador; antes disso nada toca. Os sons da TV saem por um canal próprio, controlado pelo volume dela: estalo do botão, degauss, chiado, “blup”, golpes do jogo de luta, bipes da batalha, a melodia do show, o baixo do RPG e os cascos do faroeste, sem apitos agudos. Os cliques mecânicos dos seletores não dependem do volume. A preferência de som desligado do portfólio é respeitada. Na primeira visita, a TV revela a seleção de idioma; nas seguintes, inicia o boot no idioma salvo **somente ao terminar toda a animação**. Navegação, troca de idioma e reboot interno não repetem a entrada. A troca posterior de idioma fica no pause, acima do debug no console e no computador do quarto. Comandos de terminal, tecnologias, títulos de jogos e nomes próprios mantêm seus identificadores.

Ao abrir a seleção, a pergunta principal usa o idioma atual; as duas outras versões aparecem menores abaixo. As opções mantêm os nomes nativos **Português**, **English** e **日本語**, também nas configurações do computador do quarto.

Os currículos abrem em nova aba, sem download automático. Os três PDFs têm uma página e foram conferidos quanto à remoção do telefone e dos links `tel:`. O build falha se algum deles estiver ausente.

Os decks do quarto usam a [pasta do Archidekt](https://archidekt.com/folders/1717569) e a [lista pública do Moxfield](https://moxfield.com/lists/Jb445-paper-decks). Os endereços ficam em `src/scene.js`; a animação de pegar as cartas termina antes da navegação.

### Regenerar os currículos

Esta etapa é opcional e separada do build do site. No Windows, com Python (`lxml`, `pypdf`), Word e Poppler disponíveis:

```powershell
python scripts/prepare-resumes.py "C:\pasta\dos\docx"
powershell -File scripts/export-resumes.ps1
python scripts/check-resumes.py
npm run build
```

O preparador espera os três nomes originais descritos em `scripts/prepare-resumes.py`, produz cópias em `.cache/resumes/` e remove números de telefone e links telefônicos. O exportador usa Word em segundo plano. O verificador confere uma página, conteúdo, e-mail e ausência de telefone no texto, metadados e hyperlinks; também renderiza PNGs para inspeção. Seu caminho de Poppler corresponde ao runtime local usado nesta revisão: ajuste-o se usar outra instalação. Confira os renders após qualquer edição. Não publique `.cache/` nem os DOCX de origem.

## Explorar o portfólio

| Área | Controles e comportamento |
| --- | --- |
| Navegação | `WASD`/setas movem Hikaru; `E` ou espaço interagem; um clique indica o destino e executa a ação após a animação |
| Quarto | Máquinas e estante exigem aproximação frontal; clique cuida do caminho e da direção |
| TV do quarto | Um único botão de imagem alterna **TV antiga → tubo CRT → alta definição**; a caixa permanece aberta para comparar os estilos |
| Portais | Clique para caminhar e atravessar, ou fique sobre o pedestal e aperte `E`; apenas caminhar sobre ele não dispara a viagem |
| Menu | `Esc` abre o pause; `Ctrl+K` abre a paleta/console; idioma e movimento reduzido ficam nos menus |
| Projetos | Setas trocam imagens; **Ampliar** abre a galeria; `Esc` fecha o visualizador |
| D20 | Selecione um desafio e role o dado; o número acompanha sua face, com pouso na face sorteada |
| Computador | Sente, escolha um aplicativo e use a janela; `Esc` volta ao desktop e, na tela principal, levanta da cadeira |

O boot dura aproximadamente 20 segundos e não tem botão nem atalho para pular. **A primeira visita recebe um pânico fictício logo após escolher o idioma.** Nas visitas seguintes, cada boot tem **10% de chance** de falhar; isso não significa que toda décima entrada falha. São 96 linhas com diagnósticos variados (arquivo não encontrado, índice fora dos limites, falha de memória e kernel panic), em PT/EN/JA. Após os logs, há uma pausa de 3,5 s e a tela é limpa, incluindo os pop-ups. Restam apenas **“Problema corrigido.”**, **“Ambiente restaurado. Pronto para reiniciar.”** e **“Pressione Enter para reiniciar”** no console. Se não houver reinício, **“Clique aqui para reiniciar” aparece abaixo desse texto após 8 segundos**. Enter cancela esse botão pendente. O reboot de recuperação sempre passa pelo boot normal; Novo jogo/Continuar só ficam disponíveis ao final dele.

A imagem padrão tem granulação suave, linhas analógicas e vinheta. O estilo CRT usa linhas mais finas e menos ruído; alta definição remove esses efeitos. São estilos de imagem: preservam a resolução dos canvases, a escala, a arte e as áreas clicáveis. A preferência fica em `okaru-display`, separada do save e do idioma. Sem armazenamento disponível, vale durante a visita. Movimento reduzido mantém a granulação estática; o modo econômico remove o ruído para poupar processamento.

`okaru-boot-seen` registra somente que o boot já começou, separado do save. **Continuar** só fica disponível com um save válido de progresso, carregado ou gravado com sucesso neste navegador. Idioma salvo, boot concluído e a conquista de recuperação do boot não liberam o botão. Sem save, **Novo jogo** inicia com um clique, com ou sem som; substituir um save existente exige o segundo clique de confirmação. Novo jogo não apaga a marca de boot nem o idioma. Visitantes que já tinham idioma/progresso salvo são reconhecidos como recorrentes. Sem armazenamento disponível, a marca dura apenas durante a sessão da página e Continuar permanece desativado; limpar os dados do site também reinicia essa identificação. Saves, idioma, conquistas e recordes ficam somente no navegador.

### Som da tela de título

O som 8-bit segue a preferência salva desde o primeiro menu (ligado para quem chega pela primeira vez), então seleção de idioma, **Novo jogo/Continuar**, o vidro do modo recrutador e as páginas abertas por ele têm hover, cliques e efeitos. Enquanto a tela de título está aberta (também com o modo recrutador por cima), toca uma trilha própria em Lá menor, entre Mi4 e Sol5, sem apitos agudos; ela para ao entrar no quarto ou numa página. O botão **Som 8-bit** no topo da tela e a tecla `M` ligam e desligam. Atrás da TV de entrada o portfólio continua em silêncio, nenhum contexto de áudio é criado antes do primeiro gesto e, na falha fictícia do boot, o alarme toca no máximo uma vez a cada 0,9 s. **Novo jogo sem som** e **Continuar sem som** continuam desligando tudo.

### Passagens secretas

Cada página comum e o quarto se ligam a todas as outras por uma passagem escondida, sem abrir nenhuma missão ou janela: são 20 pontas, e cada uma volta pela mesma passagem. A lista completa fica em `portals` de `src/scene.js`.

| De ↔ para | Ponta de um lado | Ponta do outro |
| --- | --- | --- |
| Início ↔ Quarto | alçapão acima da caixa de kanji | círculo atrás da planta |
| Início ↔ Contato | pedestal à direita de “Ver sobre” | pedestal à direita do GitHub |
| Início ↔ Projetos | “Ver projetos” (alçapão que se abre) | pedestal ao lado do título |
| Início ↔ Sobre | “Ver sobre” (escada secreta) | pedestal ao lado do título |
| Projetos ↔ Sobre | porta na parede esquerda do esquemático | porta na parede esquerda de “Jogando agora” |
| Projetos ↔ Contato | porta na parede direita do esquemático | porta na moldura do plástico-bolha |
| Projetos ↔ Quarto | alçapão na linha de baixo do esquemático | alçapão sob o pinball |
| Sobre ↔ Contato | porta na parede direita de “Jogando agora” | fenda sob o contador de fichas |
| Sobre ↔ Quarto | alçapão na linha de baixo do retrato | passagem atrás da estante |
| Contato ↔ Quarto | o ponto do “?” de CONTINUE? | túnel debaixo da cama |

- **Portas e alçapões nas linhas:** são símbolos de planta desenhados sobre a borda de 1 px dos painéis, posicionados fora do fluxo. Fechados, a folha cobre exatamente a borda e só dois batentes pequenos denunciam a porta; o painel mantém tamanho e formatação. No hover, a folha fica dourada e entreabre; durante a viagem, abre com o arco tracejado e a abertura escura. Em telas de até 860 px, onde o esquemático fica oculto, as três passagens dele esperam em alçapões na última linha da lista de missões, e o código usa a ponta que estiver na tela.
- **Atrás da letra:** o “?” de CONTINUE? desliza para o lado e mostra a passagem que estava sob o ponto. O título mantém o nome acessível “Continue?”.
- **No quarto:** o pinball desliza para trás e revela um alçapão, onde Hikaru pula; a estante sobe pela parede e mostra uma escada, por onde ele sobe até sumir; e ele se agacha e se arrasta para baixo da cama, que é redesenhada por cima dele. Na chegada, a mesma passagem se abre, ele sai e ela se fecha. Cada uma tem sons próprios e um detalhe discreto que aparece mesmo fechada (brilho sob o pinball, luz na fresta da estante, brilho sob a cama). Para usar, clique no ladrilho ou fique sobre ele e aperte `E`; ir até um objeto vizinho continua abrindo o objeto. Os quatro ladrilhos contam como objetos do quarto.
- **Contato ↔ Início:** o pedestal fica imediatamente à direita do link do GitHub. Sua outra ponta fica à direita de “Ver sobre”, na mesma linha dos botões “Ver projetos” e “Ver sobre”. o pedestal fica imediatamente à direita do link do GitHub. Sua outra ponta fica à direita de “Ver sobre”, na mesma linha dos botões “Ver projetos” e “Ver sobre”.
- **Quarto ↔ Início:** há um círculo escondido atrás da planta, abaixo do gaveteiro. Ele leva ao alçapão acima da caixa de kanji, com a mesma largura da caixa e a altura original; o alçapão também faz a volta. A caixa continua mostrando furigana.
- **Ver projetos** abre um alçapão no meio do chão sob Hikaru: as duas folhas se separam, ele fica um instante no ar com um “!” e cai girando para dentro. Em Projetos, ele despenca do alto da tela girando e aterrissa no pedestal, com sombra crescendo, impacto e poeira (cerca de 1 s de saída e 1,15 s de chegada).
- **Ver sobre** abre do nada uma escada secreta: duas lajes de pedra deslizam para os lados, Hikaru vira e desce os degraus até sumir atrás da borda, e as lajes se fecham. Em Sobre, a mesma escada se abre no pedestal e ele sobe por ela (1,5 s em cada lado). As duas passagens têm sons próprios (rachadura, porta, queda e impacto; pedra arrastando, passos e fechamento) e, com Movimento reduzido, a troca de página é direta.
- Os portais de Projetos e Sobre continuam retornando aos respectivos botões da home. As portas preservam seus caminhos originais. As passagens usam giro de saída/entrada; movimento reduzido mantém o mesmo destino sem o giro.
- Ao escolher outra página pela navegação, Hikaru pode decidir caminhar até a passagem escondida que liga as duas páginas e atravessá-la: **10%** para uma página de distância, **12,5%** para duas, **16,7%** para três e **25%** para quatro. O quarto conta como a página antes do Início (a ordem é Quarto, Início, Projetos, Sobre, Contato), então a regra vale também para sair ou chegar ao quarto: lá, em vez de seguir até a porta, ele pode ir até o pinball, a estante, a cama ou a planta. Saindo do Início para Projetos ou Sobre, a passagem é a dos próprios botões (alçapão ou escada). A escolha acontece uma vez por viagem; acelerar, pular ou mudar o destino continuam disponíveis. Clicar diretamente em uma porta, a ação **Ir pro site comum** da porta do quarto, os objetos do quarto e o Movimento reduzido mantêm o caminho pela porta.
- A primeira chegada ao quarto inicia o mesmo tutorial de cinco passos, entrando pela porta ou pelo alçapão. Ele espera a animação de chegada terminar e é registrado em `roomIntro` no save. Novo jogo reinicia o tutorial; saves antigos com mais de dois objetos do quarto explorados são reconhecidos como visitas anteriores.

### Limpar Hikaru depois de uma queda

A queda deixa poeira no rosto e na roupa, sem impedir a caminhada. Na mesma página, **clique no Hikaru** para uma animação de limpar o rosto ou bater a poeira da roupa. Alternar **A–D–A–D–A–D** (ou começar por D) faz ele se chacoalhar; use seis toques separados, com até 0,8 s entre eles. Segurar uma tecla não conta.

Também aparecem os botões **Limpar o rosto** e **Sacudir a roupa**, úteis no celular e com navegação por teclado. São três animações curtas, com movimento reduzido respeitado, disponíveis no quarto e nas páginas comuns. Depois da limpeza, a caminhada continua no mesmo lugar. A/D em campos de texto ou controles de jogos não ativa o gesto. A poeira é apenas visual e não entra no save.

### Hitbox e jogos dos controles

Há 51 conquistas com condições implementadas. A hitbox é o controle inicial em **Sobre**, com quatro direções, seis ataques e duas assistências. Selecione um dos 22 lutadores para consultar os 42 golpes adaptados: Street Fighter (Ryu, Ken, Chun-Li, Guile, Cammy e Falke), Mortal Kombat (Scorpion, Sub-Zero, Raiden e Liu Kang), Skullgirls (Filia, Robo-Fortune, Squigly, Cerebella, Big Band, Annie e Ms. Fortune), Guilty Gear (Venom e Dizzy), Avatar (Toph e Iroh) e os golpes de tecnologia do Okaru. Com foco na hitbox: WASD/setas para direções, J K L para socos, U I O para chutes e 1/2 para assistências.

O golpe só sai com a **sequência exata**: tudo o que foi digitado desde a última limpeza precisa ser a sequência inteira. Um botão a mais, antes ou no meio, deixa o visor em vermelho com “Sequência inválida” e nada é executado até `SELECT` (ou `Esc`) limpar a entrada; depois de um golpe executado, a entrada recomeça vazia. A sequência também expira após 20 segundos de espera livre; a caminhada e as animações dos cliques não consomem esse prazo.

Cada golpe acerta um **boneco de treino** que cai na frente de Hikaru, do lado em que houver espaço (perto da borda direita, ele se vira). As reações seguem o tipo do golpe: projéteis (Hadouken, Kikoken, Sonic Boom, Crescent Cut) acertam e empurram; Shoryuken e outros golpes de subida lançam o boneco, que cai tonto com estrelinhas; o Spear do Scorpion o puxa até ele com “GET OVER HERE!”; Ice Ball e Ice Field congelam e estilhaçam; Raiden e o relâmpago de Iroh dão choque; o sopro de Iroh queima; Diamond Drop agarra e arremessa; Daisy Pusher enterra o boneco numa cova que dá flor; Giant Step o achata. Há faísca de impacto, congelamento curto no acerto, contador “HITS” nos golpes de vários acertos e escurecimento do fundo nos supers. Em telas de toque, onde Hikaru fica oculto, e com movimento reduzido, o boneco não aparece; o visor continua indicando o golpe. Os comandos são adaptações acessíveis por clique: não reproduzem janelas de frames, cargas ou todas as diagonais dos jogos originais. Veja [referências e adaptações](REFERENCIAS.md).

| Controle | Jogo |
| --- | --- |
| Hitbox | Golpes e easter eggs; os combos ficam aqui |
| Game Boy | Blocos de bolso; `SELECT` alterna para o cartucho extra de Cobrinha |
| Atari | Travessia entre obstáculos, inspirada nos jogos clássicos de estrada |
| Master System | Quebra-cabeça de empurrar caixas |
| N64 | Melodia 64: ouvir e repetir uma sequência de direções |
| Modern Pad | Estrada: corrida acessível de três pistas |

Os minijogos são implementações locais, sem ROMs ou emuladores. O fliperama Packet Invaders e o jogo do computador permanecem separados desses cartuchos.

### Operação Circuito: fliperama de tiro

- **Andar:** `A`/`D` ou setas esquerda/direita.
- **Mirar:** mouse; as setas também permitem mirar em oito direções.
- **Pular:** `W` ou `K`. **Atirar:** clique, espaço ou `J`.
- **Tanque:** `T`, uma vez por partida, durante oito segundos.
- **Pausar/continuar:** `P`. **Jogar/reiniciar:** Enter; se pausado, Enter continua. **Sair:** `Esc`.
- Na tela de toque, use os botões exibidos. A missão termina em 2.400 pontos; a cada 600, recupera-se uma vida, até o limite de cinco.

### Rebote CRT: jogo da TV

No quarto, interaja com o **puff**, escolha **Sentar no puff** e depois **Jogar na TV**. Hikaru permanece sentado durante a partida; **Voltar ao puff** fecha o jogo e permite jogar novamente ou levantar.

- Quebre todos os blocos das três fases. Você começa com três vidas e recupera uma ao concluir cada fase, até três. A velocidade aumenta gradualmente.
- **Raquete:** mouse, arrastar o dedo sobre a tela, `A`/`D` ou `←`/`→`. As pontas da raquete mudam o ângulo do rebote.
- **Lançar:** clique na tela, Espaço, Enter ou o botão. **Pausar/continuar:** `P`. **Reiniciar:** `R`. **Voltar ao puff:** `Esc`.
- O jogo pausa ao perder foco ou trocar de aba. Os controles do jogo não movimentam Hikaru.
- O recorde usa o save local existente (`mini.tv-breakout`) e é apagado ao começar um Novo jogo do portfólio. Reiniciar só a partida mantém o recorde. Se o navegador impedir o armazenamento, ele vale apenas na sessão atual.
- Título, instruções, botões e estados estão disponíveis em PT/EN/JA. Não exige downloads, ROMs ou rede.

### Fliperamas

Packet Invaders e Operação Circuito compartilham a ordem **Jogar → interação da máquina → Fechar**. Ambos usam cabeçalho com X à direita, jogo à esquerda, controles logo abaixo e instruções à direita; em telas estreitas, as instruções ficam abaixo. O tiro mantém a proporção original, a mira livre e os comandos de tanque, salto e pausa. Os botões também aceitam teclado.

### Desktop do quarto

O desktop inspirado no Arch ocupa quase toda a tela do quarto. Ao iniciar a animação de sentar, o monitor já mostra a própria área de trabalho. Essa mesma interface cresce de dentro da tela durante 2,3 segundos, sem ser substituída por um fade, com um beat curto sintetizado localmente e respeitando o som desligado. A câmera avança pelo quarto até o monitor e entra no vidro: o zoom é calculado em escala logarítmica, então a aproximação tem ritmo constante, e o desktop acompanha o vidro em todos os quadros até ocupar a tela. A página ao redor escurece nos primeiros 0,5 s. Quem decide é o item **Movimento** do menu de pausa (`Esc`): em **Completo**, o padrão, o zoom sempre acontece, mesmo que o sistema operacional peça menos animação; em **Reduzido**, não há zoom e a área de trabalho aparece com um esmaecimento de 0,16 s. A escolha fica salva no navegador (`okaru-motion`), separada do save, e não é apagada por Novo jogo. O botão de energia **dentro do desktop** encerra essa sessão e faz Hikaru levantar; o botão principal de energia do portfólio mantém seu comportamento.

A barra inferior reúne terminal, perfil, jogo, habilidades, currículo, Lab, idioma e relógio. Cada aplicativo tem uma janela independente: é possível manter duas, três ou quatro visíveis, arrastar pela barra de título e redimensionar pelo canto inferior direito. Clicar numa janela a traz para a frente; **X** fecha apenas aquela janela e revela a anterior. Clicar no ícone do aplicativo ativo o minimiza; clicar novamente o restaura com a mesma posição e conteúdo. A barra de título também aceita setas para mover e Shift + setas para redimensionar. As janelas ficam limitadas à área do desktop, inclusive ao mudar o tamanho da tela. `Esc` fecha o aplicativo ativo e, quando todas as janelas estão minimizadas ou fechadas, sai do computador.

A tela de habilidades traz a árvore interativa, quatro áreas e 16 habilidades com descrições. A prévia do currículo fica na janela; se o navegador não exibir PDF embutido, há um link para abri-lo. O Lab usa a mesma interface e lógica da página Lab. **Sem Conexão** roda dentro de sua janela: Espaço/↑ pula, ↓ abaixa, P pausa e os botões permitem jogar por toque. Trocar de aplicativo suspende a partida; sair da aba pausa o jogo. Fechar a janela termina a partida atual, preservando o recorde existente.

O terminal interno aceita `help`, `neofetch`, `whoami`, `htop`, `date` e `clear`. Hardware, uso de memória e processos são fictícios; o relógio usa a hora do navegador. Não há execução de comandos do computador do visitante.

## Privacidade e manutenção

- Os canais publicados são e-mail, LinkedIn, GitHub e os três currículos. Os documentos originais não fazem parte dos assets públicos.
- O site não envia progresso a um servidor e não contém analytics, autenticação ou formulário que armazene mensagens.
- Recursos de inicialização são locais. Links de projetos/decks saem para os respectivos serviços quando acionados.
- O build e o workflow não precisam de credenciais pessoais no código. Nunca coloque `.env`, chaves privadas, documentos internos ou dumps em `public/`.
- `tests/privacy.test.mjs` verifica o conjunto publicável e os caminhos de contato; `scripts/check-resumes.py` verifica os PDFs. A análise textual não substitui a conferência do material que será publicado.

## Verificação

**Estado atual: 173 testes passam** (`npm test`). Eles cobrem o contrato do template e do build, controller, idioma e catálogo, boot e pânico, árvore, caminhos e portais, a rede de passagens secretas (ida e volta de cada par, portas nas linhas, passagens do quarto e a regra de chance), passagens da home, som da tela de título, quarto, desktop, TV 3D (estado, câmera, seleção dos controles e entrada), hitbox e boneco de treino, minijogos, privacidade dos currículos e links de contato.

Além dos testes, a TV 3D, os canais, as passagens, o boneco de treino e o zoom do desktop foram conferidos quadro a quadro no navegador, no desktop e no celular, sem erros no console. O ritmo das animações e o som ainda merecem uma conferência em tempo real numa aba visível. A auditoria completa está em [AUDITORIA.md](AUDITORIA.md).

Antes de publicar, confira desktop e celular, navegação por teclado, os três idiomas, galerias, PDFs, som e movimento reduzido. A implementação prepara o deploy; não envia commits nem ativa Pages automaticamente na sua conta.

