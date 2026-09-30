# Portfólio — Hikaru Ogasawara

Portfólio com quarto em pixel art, projetos, laboratório, árvore de habilidades, minijogos e modo recrutador. Interface em português, inglês e japonês.

## Executar localmente

Use Node.js 22 ou superior (o workflow usa Node 24). Não é necessário `npm install`: o build usa módulos nativos do Node.

```powershell
npm run build
npm test
npm run dev
```

Abra `http://127.0.0.1:4173`. Encerre com `Ctrl+C`. Após editar fontes, execute o build novamente; não há recarga automática.

O build reconstrói `dist/` e gera uma cópia publicável na raiz. CSS/JS recebem hashes de conteúdo na URL para atualizar o cache quando mudam. Edite os arquivos em `src/`, pois `index.html`, `assets/` e `vendor/` são gerados. React, fontes, imagens e PDFs são locais; o site não depende de CDN ou backend.

## Organização

| Caminho | Função |
| --- | --- |
| `src/template.html`, `src/styles.css` | Interface editável |
| `src/app.js` | Controller e jogos originais |
| `src/enhancements.js` | Integração, idioma, foco e galeria |
| `src/display.js`, `src/display.css` | TV vintage em CSS 3D, câmera de entrada, seleção de idioma e estilos de imagem |
| `src/boot.js`, `src/boot-flow.js`, `src/skill-tree.js` | Boot, recuperação fictícia e árvore assimétrica |
| `src/character.js`, `src/room-props.js`, `src/scene.js` | Movimento, quedas, quarto e transições |
| `src/dice.js`, `src/shooter.js`, `src/achievements.js` | D20, jogo de tiro e conquistas |
| `src/desktop.js` | Desktop local, terminal simulado e aplicativos do computador |
| `src/hitbox.js`, `src/pocket-games.js` | Golpes da hitbox e cartuchos dos controles clássicos |
| `src/projects.json` | Projetos, repositórios e galerias |
| `src/translations*.tsv` | Português, inglês e japonês separados por tabulação |
| `src/project-translations.json`, `src/localized-data.json` | Traduções complementares |
| `public/` | Assets, PDFs e bibliotecas publicadas |
| `scripts/build.mjs` | Build estático |
| `tests/` | Testes automatizados |
| `docs/REVISAO.md`, `docs/REFERENCIAS.md` | Auditoria, avaliação dos currículos e referências |

Os scripts descartáveis da migração foram removidos. A cópia original e os resultados temporários de revisão em `.cache/` são ignorados pelo Git.

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
git add README.md package.json .gitignore .github src scripts tests public docs index.html .nojekyll
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

Toda entrada/recarregamento começa com uma **TV vintage desligada em 3D**, centralizada num fundo da paleta do site. Clique no botão de energia da própria TV (ou use Tab/Enter). A sequência dura aproximadamente **6,2 segundos**: a TV vira de frente (0,6 s), a câmera entra na tela (1,4 s) e o tubo acende lentamente (4,2 s), passando de ponto a linha e depois à imagem completa. Canal e volume são cenográficos: clicar gira os seletores; o volume também aceita arraste, setas, Home e End. Só a energia inicia o portfólio.

O clique de energia libera o áudio do navegador. Um **“blup” grave com breve chiado** acompanha o acendimento, sintetizado localmente pelo mesmo sistema dos efeitos do quarto. A preferência de som desligado é respeitada; áudio indisponível não impede a entrada e não fica enfileirado para tocar atrasado. Na primeira visita, a TV revela a seleção de idioma; nas seguintes, inicia o boot no idioma salvo **somente ao terminar a animação**. Navegação, troca de idioma e reboot interno não repetem a entrada. Movimento reduzido substitui o zoom e a expansão por fades breves. A troca posterior de idioma fica no pause, acima do debug no console e no computador do quarto. Comandos de terminal, tecnologias, títulos de jogos e nomes próprios mantêm seus identificadores.

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

### Passagens secretas

- **Contato ↔ Início:** o pedestal fica abaixo do rodapé, à esquerda de Contato. Sua outra ponta fica centralizada acima do seletor de hardware/software, alinhada com o escudo e fora da caixa.
- **Quarto ↔ Início:** há um círculo escondido atrás da planta, abaixo do gaveteiro. Ele leva ao pequeno alçapão acima da caixa de kanji; o alçapão também faz a volta. A caixa continua mostrando furigana.
- Os portais de Projetos e Sobre continuam retornando aos respectivos botões da home. As portas preservam seus caminhos originais. As passagens usam giro de saída/entrada; movimento reduzido mantém o mesmo destino sem o giro.

### Hitbox e jogos dos controles

Há 51 conquistas com condições implementadas. A hitbox é o controle inicial em **Sobre**, com quatro direções, seis ataques e duas assistências. Selecione um lutador para consultar os 28 golpes adaptados. Com foco na hitbox: WASD/setas para direções, J K L para socos, U I O para chutes e 1/2 para assistências. A sequência expira após 20 segundos de espera livre; a caminhada e as animações dos cliques não consomem esse prazo. `SELECT` limpa a entrada. Os comandos são adaptações acessíveis por clique: não reproduzem janelas de frames, cargas ou todas as diagonais dos jogos originais. Veja [referências e adaptações](docs/REFERENCIAS.md).

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

### Desktop do quarto

O desktop inspirado no Arch reúne terminal, perfil, jogo, habilidades, currículo, Lab, idioma e relógio. A prévia do currículo fica na janela; se o navegador não exibir PDF embutido, há um link para abri-lo. O Lab usa a mesma interface e lógica da página Lab.

O terminal interno aceita `help`, `neofetch`, `whoami`, `htop`, `date` e `clear`. Hardware, uso de memória e processos são fictícios; o relógio usa a hora do navegador. Não há execução de comandos do computador do visitante.

## Privacidade e manutenção

- Os canais publicados são e-mail, LinkedIn, GitHub e os três currículos. Os documentos originais não fazem parte dos assets públicos.
- O site não envia progresso a um servidor e não contém analytics, autenticação ou formulário que armazene mensagens.
- Recursos de inicialização são locais. Links de projetos/decks saem para os respectivos serviços quando acionados.
- O build e o workflow não precisam de credenciais pessoais no código. Nunca coloque `.env`, chaves privadas, documentos internos ou dumps em `public/`.
- `tests/privacy.test.mjs` verifica o conjunto publicável e os caminhos de contato; `scripts/check-resumes.py` verifica os PDFs. A análise textual não substitui a conferência do material que será publicado.

## Verificação

**Resultado desta revisão: 98 testes passaram.** `npm test` verifica controller, idioma, boot, árvore, caminhos, privacidade e comportamentos adicionados. Inclui os pares de portais, preservação das portas/furigana, primeira visita em pânico, probabilidade de 10% nas seguintes, remoção dos atalhos de pular, limpeza da tela após o pânico e recuperação por Enter antes do botão atrasado. Também cobre a TV física antes da entrada, geometria do zoom, seletores por clique/arraste/teclado, sequência das transições, som sem reprodução atrasada, movimento reduzido, cancelamento dos timers, os três estilos de imagem e a persistência independente da preferência. `node scripts/audit-translations.mjs` gera candidatos a texto sem catálogo em `.cache/untranslated.json`; é uma ferramenta de revisão, não um tradutor nem uma prova automática de cobertura. Ela usa o parser interno do Node e não faz parte do build de produção.

Os testes de lógica não substituem inspeção visual. Foram usados também renders nativos de canvas e PDF. A tentativa de validação interativa no navegador foi bloqueada pela ferramenta, portanto esta revisão não certifica o layout em todos os navegadores ou tamanhos. O runtime legado permanece preservado localmente; sua substituição seria uma migração própria dos minijogos.

Antes de publicar, confira desktop e celular, navegação por teclado, os três idiomas, galerias, PDFs, som e movimento reduzido. A implementação prepara o deploy; não envia commits nem ativa Pages automaticamente na sua conta.
