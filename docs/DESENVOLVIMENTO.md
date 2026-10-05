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
| `src/display.js` | Fluxo da entrada (idioma primeiro, explorar, quebrar o vidro, entrar, zoom, revelar), TV em CSS como reserva e estilos de imagem da TV do quarto |
| `src/boot.js`, `src/boot-flow.js` | Linhas do boot, pânico fictício e recuperação |
| `src/skill-tree.js` | Layout da árvore de habilidades |
| `src/character.js`, `src/character-care.js` | Quedas, tropeços e limpeza da poeira de Hikaru |
| `src/scene.js` | Caminhada entre páginas, rede de passagens secretas (páginas e quarto), passagens dos botões da home, ajuste de Movimento e fichas |
| `src/gamepad.js` | Controle de toque (joystick, A e B) para celulares e tablets, traduzido nas mesmas teclas do teclado |
| `src/title-sound.js` | Som antes do jogo: trilha da escolha de idioma em três estilos e seu equalizador, tela de título (preferência desde o menu, trilha própria, tecla M) e silêncio atrás da TV de entrada |
| `src/room-props.js` | Objetos extras do quarto, pelúcias, estante e diálogos |
| `src/desktop.js` | okwm, o desktop do computador do quarto: zoom no monitor, tela de bloqueio, mosaico de janelas, áreas de trabalho, lançador e aplicativos |
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

**A primeira visita começa pela escolha de idioma** (veja abaixo). Escolhido o idioma, e em toda entrada ou recarregamento de quem já tem idioma salvo, aparece uma **televisão 3D de verdade**, desenhada em WebGL pelo próprio site (sem bibliotecas externas): gabinete de madeira com veios, painel de latão com seletores, botão de energia e botão **Entrar**, alto-falante, pés, antena e uma traseira afunilada com ventilação e etiqueta. A TV fica parada no seu eixo e **só a câmera se move**: arraste para girar 360°, ver por trás, por cima e por baixo; a roda do mouse aproxima e afasta. Pelo teclado, setas giram a câmera. A TV fala o idioma escolhido (tela, painel e botões) e já começa **ligada**, no canal **Modo recrutador** (veja o vidro abaixo). Os seletores trocam entre ele e cinco canais com arte e sons originais: **Luta**, **Monstros de bolso** (batalha no estilo Pokémon), **Show ao vivo**, **RPG** (no estilo Persona) e **Faroeste** (no estilo Red Dead). A troca passa por estática com o número do canal na tela. O volume funciona de verdade e mostra uma barra subindo ou descendo; o botão de energia desliga a TV com o colapso do tubo em linha e ponto, e liga de novo com aquecimento, ponto, linha, chuva de estática e “blup”. Clique na metade esquerda de um seletor para voltar e na direita para avançar. O mesmo comando fica no painel abaixo da TV, acessível por teclado (PageUp/PageDown ou [ ] trocam canal, + e − mudam o volume, P liga e desliga, Enter entra).

**Entrar no portfólio** (botão vermelho na TV ou no painel): se a TV estiver desligada, ela liga primeiro; a tela sintoniza o cartão OKARU, a câmera dá a volta até ficar de frente e mergulha na tela até o vidro ocupar tudo, e a TV esmaece sobre o mesmo cartão em tela cheia. Só então começa o boot (na primeira visita, com o pânico fictício). Com Movimento reduzido no menu, não há voo de câmera: a imagem aparece e esmaece. Sem WebGL, a TV em CSS continua como reserva, com os mesmos canais na tela e o zoom antigo.

**Botão de energia do portfólio:** segurar o botão de energia no topo da tela desliga tudo (o mesmo apagão de tubo, que fecha a imagem numa linha e num ponto) e sai pela TV de entrada, no caminho inverso da entrada: a câmera começa dentro do vidro, com o ponto se apagando, recua para fora da tela até mostrar a TV inteira e gira de volta à vista inicial, com um sopro de ar; ao girar, a TV liga de novo (estalo, degauss, ponto, linha, estática e “blup”) no canal do modo recrutador. São cerca de 2,6 s de câmera; enquanto isso, o painel e os controles esperam. As rachaduras de um vidro já quebrado reaparecem conforme a câmera sai. Sem WebGL, a TV em CSS faz o mesmo recuo com uma animação de zoom ao contrário. Com Movimento reduzido no menu, não há voo: a TV reaparece saindo do escuro, já ligada. **Entrar** leva de novo ao boot, já no idioma salvo. **Voltar ao Press Start**, no pause, e os comandos de terminal continuam reiniciando direto pelo boot.

O primeiro toque ou clique na página libera o áudio do navegador; antes disso nada toca. Os sons da TV saem por um canal próprio, controlado pelo volume dela: estalo do botão, degauss, chiado, “blup”, golpes do jogo de luta, bipes da batalha, a melodia do show, o baixo do RPG e os cascos do faroeste, sem apitos agudos. A TV tem também uma **trilha própria**, um groove lento em Fá maior (Fmaj7, Em7, Dm7, G7, com volta em A7), com a melodia entre Sol4 e Sol5: ela sai pelo mesmo canal, então segue o volume e para quando a TV é desligada; recomeça do início ao religar, silencia nos canais que já têm música (Show ao vivo e RPG) e para ao entrar no portfólio. Os botões do painel também liberam o áudio. Os cliques mecânicos dos seletores não dependem do volume. A preferência de som desligado do portfólio é respeitada. O boot começa **somente ao terminar toda a animação** de entrada. Navegação, troca de idioma e os reboots do pause e do terminal não repetem a entrada; só o botão de energia volta à TV. A troca posterior de idioma fica no pause, acima do debug no console e no computador do quarto. Comandos de terminal, tecnologias, títulos de jogos e nomes próprios mantêm seus identificadores.

**Escolha de idioma:** é um menu de cartucho em 8 bits sob um céu de pixels, com um equalizador na parte de baixo. Na primeira visita ela recebe o visitante no idioma do navegador (mostrado, mas só salvo ao escolher): o cursor começa nele, e a pergunta principal, em destaque, fala o idioma sob o cursor: ela muda ao passar o mouse, ao focar ou ao usar as setas, “digitando-se” em 8 bits, enquanto as outras duas versões ficam menores abaixo. As três versões grandes ocupam o mesmo espaço, então a troca nunca empurra as opções. As opções mantêm os nomes nativos **Português**, **English** e **日本語**, também nas configurações do computador do quarto. Um cursor ▶ segue o mouse, o foco e as setas (↑/↓, Home/End), com um blip diferente por opção; a opção sob o cursor mostra uma saudação no próprio idioma, e o botão de som e o deck “tocando agora” falam esse idioma. Enter ou clique escolhem; ao escolher, a TV liga como um tubo, com uma linha que se abre na imagem.

**Música da escolha de idioma:** um loop próprio sobre Dó, Lá menor, Fá e Sol, a 120 bpm, em três estilos que compartilham a mesma grade: **samba 8-bit** (surdo no segundo tempo, tamborim e ganzá) para o português, **8-bit rock** (colcheias e caixa no contratempo) para o inglês e **8ビット祭り** (matsuri: taiko, sino e melodia pentatônica) para o japonês. Mover o cursor troca o estilo na semicolcheia seguinte, sem perder o compasso; a melodia fica entre Fá4 e Sol5. O equalizador e as notas ♪ seguem o que está soando (bumbo nas barras graves, cada nota na barra da sua altura) e o deck mostra o compasso tocado. Como o navegador só libera áudio depois de um gesto, a música começa no primeiro clique ou tecla na tela (ou no botão de som); `M` liga e desliga. Ela para quando a TV liga. Com Movimento reduzido, o equalizador fica parado. Trocas de idioma posteriores (pause, console, computador) usam o mesmo menu, sem música, deck nem botão de som.

**Vidro do modo recrutador:** é o **primeiro canal da TV** de entrada, onde ela liga: uma caixa de emergência entre faixas de alerta, com luzes piscando e um martelo pendurado, e os textos **“Está com pressa?”**, **“Quebre aqui”** e “Quebre a tela para abrir o modo recrutador” no idioma escolhido. Cada clique ou toque no vidro é uma batida: a imagem treme, o vidro racha do ponto atingido e o texto vira **“De novo!”** e **“Mais uma!”**; a terceira quebra a tela, os estilhaços voam pela página e o modo recrutador abre por cima da TV. As batidas têm som próprio (pancada, rachadura e estilhaço), que não depende do volume da TV. Fechar (`Esc`, X ou clique fora) volta à TV com o vidro quebrado, e um clique nele reabre o modo recrutador; as rachaduras ficam no vidro em todos os canais e esmaecem quando a câmera mergulha na tela. Seguir por um dos links do modo recrutador sai da TV direto para a página, sem boot. No painel abaixo da TV, o botão vermelho **Quebrar a tela** (só nesse canal) faz o mesmo pelo teclado e no celular; a TV em CSS de reserva também aceita batidas no vidro. O Press Start não tem vidro; o do menu de pausa continua, e os dois compartilham o estado de quebrado.

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
| Celular e tablet | Um controle de toque ocupa uma faixa própria acima da barra de baixo (a página encolhe, nada fica por baixo dele): o joystick anda (8 direções), **A** usa o que está sob Hikaru (depois de uma queda, limpa a poeira primeiro) e **B** corre enquanto segurado (no quarto, fecha os diálogos). No quarto ele já começa aberto; nas páginas comuns começa fechado, e o botão de controle na barra de baixo o abre. O **×** esconde; cada lugar guarda a própria escolha |
| Quarto | Máquinas e estante exigem aproximação frontal; clique cuida do caminho e da direção |
| TV do quarto | Um único botão de imagem alterna **TV antiga → tubo CRT → alta definição**; a caixa permanece aberta para comparar os estilos |
| Portais | Clique para caminhar e atravessar, ou fique sobre a ponta (pedestal, porta ou orelhão) e aperte `E`; apenas caminhar sobre ela não dispara a viagem |
| Barra superior no celular | Até 860 px de largura, as seções (Início, Projetos, Sobre, Contato) ficam guardadas dentro da logo, que mostra ao lado a seção atual com uma setinha. Tocar na logo faz o painel crescer de dentro do chip, com as seções aparecendo uma depois da outra; escolher uma seção, tocar fora ou apertar `Esc` recolhe tudo de volta para a logo. No quarto e no laboratório a logo continua como antes |
| Menu | `Esc` abre o pause; `Ctrl+K` abre a paleta/console; idioma e movimento reduzido ficam nos menus |
| Projetos | Setas trocam imagens; **Ampliar** abre a galeria; `Esc` fecha o visualizador |
| D20 | Selecione um desafio e role o dado; o número acompanha sua face, com pouso na face sorteada |
| Computador | Sente e entre; `Alt+Enter` terminal, `Alt+P` lançador, `Alt+1`–`4` áreas, `Alt+H/J/K/L` foco, `Alt+M` tela cheia; `Esc` fecha o bloco focado e, com a área vazia, levanta da cadeira |

O boot dura aproximadamente 20 segundos e não tem botão nem atalho para pular. **A primeira visita recebe um pânico fictício logo após escolher o idioma.** Nas visitas seguintes, cada boot tem **10% de chance** de falhar; isso não significa que toda décima entrada falha. São 96 linhas com diagnósticos variados (arquivo não encontrado, índice fora dos limites, falha de memória e kernel panic), em PT/EN/JA. Enquanto o log corre, a cada duas linhas surge um pop-up de erro por cima, até 48 empilhados uns sobre os outros, cada um de um tipo com visual próprio: navegador com alerta de vírus, antivírus fictício (PixelGuard), alerta do “OkaruOS”, erro clássico que deixa um rastro de cópias, notificação de adware, terminal com *segfault*, caixa de RPG (“Um BUG selvagem apareceu!”), “ligue para o suporte” com número de mentira, tela azul e janela “não está respondendo”. Marcas, endereços (`.fake`) e números são inventados, e cada pop-up tem a etiqueta “simulação”. A posição muda a cada falha: a tela é dividida numa grade 4×4 e cada rodada passa por todas as células (as quatro do meio duas vezes), então a pilha cobre a tela inteira e fica mais densa no centro; nenhum fica mais que um pouco para fora. Após os logs, há uma pausa de 3,5 s e a tela é limpa, incluindo os pop-ups. Restam apenas **“Problema corrigido.”**, **“Ambiente restaurado. Pronto para reiniciar.”** e **“Pressione Enter ou clique na tela para reiniciar”** no console (no celular, **“Toque na tela para reiniciar”**): um toque ou clique em qualquer lugar do console reinicia. Se não houver reinício, **“Clique aqui para reiniciar” aparece abaixo desse texto após 8 segundos**. Enter cancela esse botão pendente. O reboot de recuperação sempre passa pelo boot normal; Novo jogo/Continuar só ficam disponíveis ao final dele.

A imagem padrão tem granulação suave, linhas analógicas e vinheta. O estilo CRT usa linhas mais finas e menos ruído; alta definição remove esses efeitos. São estilos de imagem: preservam a resolução dos canvases, a escala, a arte e as áreas clicáveis. A preferência fica em `okaru-display`, separada do save e do idioma. Sem armazenamento disponível, vale durante a visita. Movimento reduzido mantém a granulação estática; o modo econômico remove o ruído para poupar processamento.

`okaru-boot-seen` registra somente que o boot já começou, separado do save. **Continuar** só fica disponível com um save válido de progresso, carregado ou gravado com sucesso neste navegador. Idioma salvo, boot concluído e a conquista de recuperação do boot não liberam o botão. Sem save, **Novo jogo** inicia com um clique, com ou sem som; substituir um save existente exige o segundo clique de confirmação. Novo jogo não apaga a marca de boot nem o idioma. Visitantes que já tinham idioma/progresso salvo são reconhecidos como recorrentes. Sem armazenamento disponível, a marca dura apenas durante a sessão da página e Continuar permanece desativado; limpar os dados do site também reinicia essa identificação. Saves, idioma, conquistas e recordes ficam somente no navegador.

### Som da tela de título

O som 8-bit segue a preferência salva desde o primeiro menu (ligado para quem chega pela primeira vez), então a escolha de idioma (com sua trilha), o modo recrutador, **Novo jogo/Continuar** e as páginas abertas pelo modo recrutador têm hover, cliques e efeitos. Enquanto a tela de título está aberta, toca uma trilha própria em Lá menor, entre Mi4 e Sol5, sem apitos agudos; ela para ao entrar no quarto ou numa página. O botão **Som 8-bit** no topo da tela e a tecla `M` ligam e desligam. Com a TV de entrada ligada, o portfólio fica em silêncio (exceto o modo recrutador aberto por cima dela), nenhum contexto de áudio é criado antes do primeiro gesto e, na falha fictícia do boot, o alarme toca no máximo uma vez a cada 0,9 s. **Novo jogo sem som** e **Continuar sem som** continuam desligando tudo.

### Passagens secretas

Cada página comum e o quarto se ligam a todas as outras por uma passagem escondida, sem abrir nenhuma missão ou janela: são 20 pontas, e cada uma volta pela mesma passagem. A lista completa fica em `portals` de `src/scene.js`.

| De ↔ para | Ponta de um lado | Ponta do outro |
| --- | --- | --- |
| Início ↔ Quarto | alçapão acima da caixa de kanji | círculo atrás da planta |
| Início ↔ Contato | orelhão à direita de “Ver sobre” | orelhão à direita do GitHub |
| Início ↔ Projetos | “Ver projetos” (o botão é o alçapão) | pedestal ao lado do título |
| Início ↔ Sobre | “Ver sobre” (o botão desliza e mostra a escada) | porta ao lado do título |
| Projetos ↔ Sobre | porta na parede esquerda do esquemático | porta na parede esquerda de “Jogando agora” |
| Projetos ↔ Contato | porta na parede direita do esquemático | porta na moldura do plástico-bolha |
| Projetos ↔ Quarto | alçapão na linha de baixo do esquemático | alçapão sob o pinball |
| Sobre ↔ Contato | porta na parede direita de “Jogando agora” | fenda sob o contador de fichas |
| Sobre ↔ Quarto | alçapão na linha de baixo do retrato | passagem atrás da estante |
| Contato ↔ Quarto | o ponto do “?” de CONTINUE? | túnel debaixo da cama |

- **Portas e alçapões nas linhas:** são símbolos de planta desenhados sobre a borda de 1 px dos painéis, posicionados fora do fluxo. Fechados, a folha cobre exatamente a borda e só dois batentes pequenos denunciam a porta; o painel mantém tamanho e formatação. No hover, a folha fica dourada e entreabre; durante a viagem, abre com o arco tracejado e a abertura escura. Em telas de até 860 px, onde o esquemático fica oculto, as três passagens dele esperam em alçapões na última linha da lista de missões, e o código usa a ponta que estiver na tela.
- **Atravessar de verdade:** nas portas escondidas, a porta abre, Hikaru recua um passo, atravessa e some na linha da parede; na outra ponta, a porta de destino abre, ele sai de dentro da parede, fica do lado de fora e ela se fecha. Nos alçapões, na fenda das fichas e no “?”, ele pula para dentro e, na chegada, sai de dentro. A saída usa o tipo da ponta de origem e a chegada o da ponta de destino (porta, alçapão, orelhão ou pedestal); o pedestal de Projetos e o alçapão do kanji continuam com o giro. Cada passagem tem sons de porta, passos e fechamento.
- **Atrás da letra:** o “?” de CONTINUE? desliza para o lado e mostra a passagem que estava sob o ponto. O título mantém o nome acessível “Continue?”.
- **No quarto:** o pinball desliza para trás e revela um alçapão, onde Hikaru pula; a estante sobe pela parede e mostra uma escada, por onde ele sobe até sumir; e ele se agacha e se arrasta para baixo da cama, que é redesenhada por cima dele. Na chegada, a mesma passagem se abre, ele sai e ela se fecha. Cada uma tem sons próprios e um detalhe discreto que aparece mesmo fechada (brilho sob o pinball, luz na fresta da estante, brilho sob a cama). Para usar, clique no ladrilho ou fique sobre ele e aperte `E`; ir até um objeto vizinho continua abrindo o objeto. Os quatro ladrilhos contam como objetos do quarto.
- **Contato ↔ Início (orelhões):** dois orelhões em pixel art, um à direita de “Ver sobre” (na linha dos botões da home) e outro, mais discreto, à direita do link do GitHub. No hover, o fone levanta e aparecem as marcas de toque. Na viagem, o orelhão toca (campainha) e balança, Hikaru atende de costas, a linha o puxa fino e alto, piscando, e ele some subindo em bits dourados (com os bipes de discagem); no outro orelhão, a ligação o remonta e ele se vira para a frente.
- **Sobre (porta):** ao lado do título fica uma porta vista de frente. No hover ela entreabre com luz por trás; na viagem, abre, Hikaru entra de costas e some no escuro, ou sai dele caminhando para a frente, e ela se fecha.
- **Quarto ↔ Início:** há um círculo escondido atrás da planta, abaixo do gaveteiro. Ele leva ao alçapão acima da caixa de kanji, com a mesma largura da caixa e a altura original; o alçapão também faz a volta. A caixa continua mostrando furigana.
- **Ver projetos** é o próprio alçapão: Hikaru anda até o botão (com clique, Enter ou o controle; num toque ele já aparece em cima), o botão racha ao meio e as duas metades, com o texto partido, caem para dentro do buraco escuro que fica no lugar dele. Hikaru fica um instante no ar com um “!” e cai encolhendo e escurecendo para o fundo; as metades voltam e o botão se refaz. Ao voltar do pedestal de Projetos, o alçapão se abre e ele salta de dentro dele, já fechado quando ele pousa. Em Projetos, ele despenca do alto da tela girando e aterrissa no pedestal, com sombra crescendo, impacto e poeira (cerca de 1 s de saída e 1,15 s de chegada).
- **Ver sobre** é a laje de uma escada secreta: o próprio botão desliza para o lado, arrastando (cobre o orelhão por um instante), e mostra os degraus que estavam embaixo dele. Hikaru vira e desce, menor e mais escuro a cada degrau, até a ponta escura levá-lo, e o botão desliza de volta. Em Sobre, ele sai pela porta ao lado do título; ao voltar por essa porta, ele sobe a escada no “Ver sobre” (1,5 s na escada, 0,9 s na porta). As duas passagens têm sons próprios (rachadura, porta, queda e impacto; pedra arrastando, passos e fechamento) e, com Movimento reduzido, a troca de página é direta.
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

### Desktop do quarto (okwm)

O computador do quarto roda o **okwm**, um gerenciador de janelas em mosaico no estilo i3/sway, com a paleta do portfólio (fundo `#0A0F0B`, blocos `#0D130F`/`#131B15`, ouro, jade, céu e vermelho) e um papel de parede em pixel art desenhado em canvas: o skyline noturno de São Paulo (Edifício Altino Arantes, Edifício Itália, Copan e as torres da Paulista, com luzes de aviação piscando). Ao iniciar a animação de sentar, o monitor já mostra a tela de bloqueio. Essa mesma interface cresce de dentro da tela durante 2,3 segundos, sem ser substituída por um fade, com um beat curto sintetizado localmente e respeitando o som desligado. A câmera avança pelo quarto até o monitor e entra no vidro: o zoom é calculado em escala logarítmica, então a aproximação tem ritmo constante, e o desktop acompanha o vidro em todos os quadros até ocupar a tela. A página ao redor escurece nos primeiros 0,5 s. Quem decide é o item **Movimento** do menu de pausa (`Esc`): em **Completo**, o padrão, o zoom sempre acontece, mesmo que o sistema operacional peça menos animação; em **Reduzido**, não há zoom e a área de trabalho aparece com um esmaecimento de 0,16 s. A escolha fica salva no navegador (`okaru-motion`), separada do save, e não é apagada por Novo jogo. O botão de energia **dentro do desktop** encerra essa sessão e faz Hikaru levantar; o botão principal de energia do portfólio mantém seu comportamento.

**Tela de bloqueio:** relógio grande, data, o sprite do Hikaru e a senha que se digita sozinha (clique, Enter ou qualquer tecla entra na hora; `Esc` levanta da cadeira). Ao entrar, a área 1 se monta bloco a bloco.

**Mosaico:** cada aplicativo aberto divide o bloco focado ao meio, pelo lado mais comprido; o novo bloco entra pela linha de divisão. Nada se sobrepõe. Arrastar a calha entre dois blocos redimensiona (setas também, com a calha focada); arrastar a barra de título sobre outro bloco troca os dois de lugar (setas na barra de título trocam com o vizinho). O botão de tela cheia, Enter na barra de título ou duplo clique deixam um bloco sozinho na área. Minimizar tira o bloco do mosaico sem perder o conteúdo; a barra inferior o traz de volta. **X** fecha e devolve o espaço ao vizinho. Abaixo de 640 px de largura, os blocos viram abas (layout em abas do i3).

**Quatro áreas de trabalho**, cada uma com seu conjunto, aberto na primeira visita: **1 dev** (terminal com neofetch, Arquivos, Monitor e Música), **2 sobre** (Habilidades, Perfil e Notas), **3 lab** (Lab e Sem Conexão) e **4 cv** (Currículo, Relógio e Ajustes). Abrir um aplicativo que está em outra área leva até ela.

**Atalhos (Alt, para não disputar a tecla Super com o sistema do visitante):** `Alt+Enter` terminal, `Alt+P` lançador, `Alt+1`–`4` áreas, `Alt+H/J/K/L` foco, `Alt+Shift+H/J/K/L` mover, `Alt+M` tela cheia, `Alt+Shift+Q` fechar. O lançador (também no logo 光 e no clique direito sobre o papel de parede) filtra aplicativos e ações no idioma ativo. `Esc` fecha o lançador, sai da tela cheia, fecha o bloco focado e, com a área vazia, levanta da cadeira.

**Aplicativos (12):**

- **Terminal:** `help`, `neofetch` (com o 光 em pixel art e dados reais do navegador: resolução, tempo ligado e núcleos), `whoami`, `ls`, `cat`, `projects`/`projetos`, `contact`/`contato`, `open`/`abrir`, `btop`, `date`, `lang`, `echo`, `history`, `clear`, `exit`. Mantém o histórico de saída, ↑/↓ percorrem os comandos e Tab completa. Tudo é uma lista fechada; nada é executado no computador do visitante.
- **Arquivos:** `~/projects` com as quatro pastas (README, stack, diagramas e capturas, link do repositório quando existe) e `~/resumes` com os três PDFs, que abrem no Currículo no idioma escolhido.
- **Monitor:** só o que a página mede: quadros por segundo e tempo de quadro, memória do JavaScript quando o navegador informa, tempo na página, janela, densidade de pixels, núcleos, rede, conquistas e os processos do próprio okwm.
- **Música:** as três faixas do quarto, o tema da tela de título e os três estilos da tela de idioma, com equalizador ligado à nota que está tocando.
- **Notas:** quatro notas com fatos do portfólio e uma nota livre do visitante, salva só no navegador (`okaru-os-note`).
- **Perfil, Habilidades, Currículo** (com seletor PT/EN/JA), **Lab**, **Sem Conexão**, **Relógio** (sua hora, São Paulo e Tóquio) e **Ajustes** (idioma, som e Movimento).

A tela de habilidades traz a árvore interativa, quatro áreas e 16 habilidades com descrições. O Lab usa a mesma interface e lógica da página Lab. **Sem Conexão** só roda com o bloco focado: Espaço/↑ pula, ↓ abaixa, P pausa e os botões permitem jogar por toque; fora de foco ele mostra "Suspenso". Fechar o bloco termina a partida atual, preservando o recorde existente.

## Privacidade e manutenção

- Os canais publicados são e-mail, LinkedIn, GitHub e os três currículos. Os documentos originais não fazem parte dos assets públicos.
- O site não envia progresso a um servidor e não contém analytics, autenticação ou formulário que armazene mensagens.
- Recursos de inicialização são locais. Links de projetos/decks saem para os respectivos serviços quando acionados.
- O build e o workflow não precisam de credenciais pessoais no código. Nunca coloque `.env`, chaves privadas, documentos internos ou dumps em `public/`.
- `tests/privacy.test.mjs` verifica o conjunto publicável e os caminhos de contato; `scripts/check-resumes.py` verifica os PDFs. A análise textual não substitui a conferência do material que será publicado.

## Verificação

**Estado atual: 192 testes passam** (`npm test`). Eles cobrem o contrato do template e do build, controller, idioma e catálogo, escolha de idioma antes da TV e sua trilha, controle de toque, ajuste de tamanho em celulares e tablets, porta do Sobre e orelhões, vidro do recrutador no primeiro canal da TV, boot e pânico, botão de energia de volta à TV (saída pelo vidro, ao contrário da entrada), trilha da TV, árvore, caminhos e portais, a rede de passagens secretas (ida e volta de cada par, portas nas linhas, passagens do quarto e a regra de chance), passagens da home, som da tela de título, quarto, desktop, TV 3D (estado, câmera, seleção dos controles e entrada), hitbox e boneco de treino, minijogos, privacidade dos currículos e links de contato.

Além dos testes, a TV 3D, os canais, as passagens, o boneco de treino e o zoom do desktop foram conferidos quadro a quadro no navegador, no desktop e no celular, sem erros no console. O ritmo das animações e o som ainda merecem uma conferência em tempo real numa aba visível. A auditoria completa está em [AUDITORIA.md](AUDITORIA.md).

Antes de publicar, confira desktop e celular, navegação por teclado, os três idiomas, galerias, PDFs, som e movimento reduzido. A implementação prepara o deploy; não envia commits nem ativa Pages automaticamente na sua conta.

