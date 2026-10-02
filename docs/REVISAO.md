# Revisão técnica

## Diagnóstico inicial

O portfólio contém uma identidade visual forte e interações extensas. O maior risco era a manutenção: um exportador havia colocado código, React, fontes e imagens em um único HTML comprimido. O navegador precisava reconstruir esses arquivos antes de exibir a interface.

Problemas encontrados:

- Currículos apontavam para URLs internas do exportador, ausentes do pacote.
- Projetos exibiam um link genérico de GitHub com texto provisório.
- A árvore de habilidades usava quatro colunas com a mesma altura; seus controles SVG não aceitavam foco pelo teclado.
- Não havia escolha real de idioma.
- O boot era curto, com poucas mensagens e sem área de rolagem; qualquer tecla, inclusive Tab, o encerrava.
- O controle de combos descartava a sequência após 1,2 segundo entre entradas. Cliques podiam aguardar a caminhada do personagem.
- A camada do personagem ficava abaixo da ficha de projeto.
- O layout exigia altura mínima de 620 px, prejudicando telas baixas.

## Decisões sob a perspectiva de liderança técnica

1. **Preservar o motor atual.** Uma migração completa de framework teria alto custo e risco para os jogos existentes. As funcionalidades novas entram em módulos separados, com testes de lógica.
2. **Ter fontes legíveis e build determinístico.** HTML, CSS, controller, traduções e dados dos projetos passam a ter arquivos próprios. React, fontes e imagens são locais. Não há necessidade de backend ou pacote de dependências de produção para hospedar este site.
3. **Priorizar recrutamento e exploração.** O acesso direto a projetos, currículos e contato deve continuar disponível, junto da experiência de jogo.
4. **Evitar informação inventada.** Os textos profissionais existentes são preservados. As galerias devem distinguir esquemas ilustrativos de fotografias e capturas reais.
5. **Interações não podem perder comandos.** Cliques encenados pelo personagem são enfileirados. O prazo do combo conta apenas a espera livre: caminhar e apertar botões não gastam os 20 segundos. Há uma opção explícita de movimento reduzido no pause.
6. **Melhorar progressivamente o legado.** Separar agora os módulos novos; extrair os minijogos restantes em etapas futuras, se houver manutenção frequente. Não adicionar autenticação, banco de dados, analytics ou um novo roteador sem uma necessidade concreta.

## Estrutura adotada

- `src/app.js`: controller e jogos preservados do exportador.
- `src/template.html` e `src/styles.css`: interface original editável.
- `src/enhancements.js`: integração, idioma, boot, foco e galerias.
- `src/display.js` e `src/display.css`: TV vintage em CSS 3D, câmera de entrada, apresentação do seletor de idioma e três estilos de imagem com preferência local.
- `src/character.js` e `src/room-props.js`: comportamento e desenhos das novas interações.
- `src/projects.json`: repositórios e imagens por projeto.
- `src/translations*.tsv`, `src/project-translations.json`, `src/localized-data.json`: conteúdo traduzido.
- `public/`: arquivos publicados sem transformação.
- `scripts/build.mjs`: geração da raiz e de `dist/`, com caminhos relativos compatíveis com GitHub Pages.

## Limites da revisão

A revisão de código e os testes automatizados são registrados no README. A validação visual no navegador não deve ser considerada concluída sem execução real. O runtime do exportador continua sendo uma dependência legada, mantida localmente; alterá-lo diretamente dificultaria futuras comparações com o original.

## Segunda revisão — correções encontradas

- URLs das fontes usavam um prefixo duplicado. Foram corrigidas e todos os arquivos passaram a ser verificados.
- Um efeito de blocos reutilizava seu horário após o relógio do quarto reiniciar. O valor negativo ampliava os blocos além da máquina. Agora o efeito expira e seu desenho é recortado à tela do fliperama.
- A galeria ampliada podia perder o foco para outra caixa de diálogo. A seleção do modal ativo agora respeita sua prioridade visual.
- Traduções curtas como “Jogar” e dicas de conquistas formatadas depois da tradução foram cobertas.
- Os passos de cada animação são isolados no loop, evitando que uma falha em um efeito paralise todos os demais.
- Removidos scripts descartáveis de importação, catálogo vazio, dados duplicados de projetos/boot e rotas antigas de PDF.
- A revisão automática cobre acesso frontal às máquinas, destinos das portas, links de decks, rotação dos modelos, carrossel, faces do dado e controles do jogo de tiro.

O HTML usa o runtime local do exportador e ainda concentra jogos antigos em um controller grande. Os módulos novos têm responsabilidades separadas; extrair todos os jogos antigos de uma vez aumentaria o risco de regressão. Esse é o principal débito de manutenção que permanece.

## Revisão final — atualizada em 30/09/2026

### Resultado por área

| Área | Diagnóstico e correção |
| --- | --- |
| Portais | Projetos/Sobre usam botões no grid do cabeçalho; caminhada, entrada, clique e E usam o retângulo do mesmo elemento, incluindo o scroll. Contato tem pedestal à direita do GitHub, ligado ao pedestal à direita de “Ver sobre” na home. Um segundo par liga a passagem atrás da planta ao alçapão acima do kanji. A interação de furigana permanece separada. A navegação pode escolher o portal, com probabilidade crescente pela distância; cliques explícitos nas portas preservam seus caminhos. |
| Japonês | Os títulos herdavam uma escala desenhada para letras latinas condensadas. Projetos/Sobre usam 24–52 px conforme a coluna; Contato usa 32–72 px. Os cabeçalhos não quebram a palavra. Metadados dos projetos ocupam uma segunda linha, preservando espaço para o título. |
| Animação | Modelos e ticker continuam ativos na visão sísmica; os cliques nos modelos são distinguidos de arrastos. A caminhada mais próxima de um botão pode usar uma cambalhota curta, inclusive quando já está centralizada. Um valor negativo de aceleração após desvios longos foi corrigido. |
| Quarto | Pelúcia Toph pequena, com coque e olhos claros, centralizada no tapete restaurado. Coleção agrupada em estante, ícones ampliados e diálogo com direção LTR explícita. Máquinas exigem acesso frontal; o personagem é centralizado na tela. |
| Defeito da captura | O relógio do quarto reiniciava, mas o início do efeito de blocos permanecia antigo. A diferença negativa gerava retângulos excessivos. O efeito agora expira nesses casos e tem recorte de desenho. |
| Hitbox | Controle inicial com quatro direções, seis ataques e duas assistências. 28 homenagens a golpes, com animações próprias: 10 Street Fighter, 6 Mortal Kombat, 5 Skullgirls, 4 Guilty Gear e 3 Toph. Comandos deliberadamente simplificados e identificados como adaptações. |
| Cartuchos | Blocos no Game Boy, Travessia no joystick clássico, caixas no pad 8-bit, Melodia 64 no N64 e corrida de três pistas no controle moderno. Cobrinha permanece como cartucho extra do Game Boy. Jogos novos aguardam a caminhada até o botão. |
| Computador | Desktop ampliado, zoom na geometria real do monitor e beat local cancelável. Oito aplicativos na barra inferior, janelas móveis e redimensionáveis, pilha e minimizar pela taskbar; jogo suspenso em segundo plano. Árvore e lista de habilidades, PDF localizado e Lab interno. Terminal por lista fechada de comandos; hardware/processos simulados. Energia interna sai da sessão sem acionar o desligamento global. |
| Boot | 96 entradas com ritmos variados e duração entre 16 e 22 segundos. Botão, atalhos e código de pular removidos. Primeira visita em pânico após escolher idioma; depois, chance de 10% por boot. Diagnósticos variados em PT/EN/JA. Após 3,5 s, logs e pop-ups são limpos; restam duas mensagens de recuperação e a instrução de Enter, acessíveis a leitores de tela. O botão clicável aparece abaixo delas após 8 s e é cancelado se Enter iniciar a recuperação. O menu inicial fica indisponível durante o boot. Recuperação força uma inicialização normal. |
| Persistência | Idioma separado do progresso. Continuar exige save válido carregado ou gravado, com progresso reconhecido; a ação também verifica essa condição. Sem save, Novo jogo funciona com um clique. Coleção parcial e galerias vistas são salvas e apagadas ao começar novo jogo. |
| Currículos | URLs relativas para os três PDFs, abertura em nova aba e área clicável completa. Telefone e hyperlinks telefônicos removidos. Preview interno no computador usa o idioma atual. |
| Publicação | `dist/` é reconstruída limpa após validação do caminho. CSS e JavaScript recebem versão por hash para evitar mistura de arquivos antigos com o HTML novo. Links de projetos e decks são explícitos. |

### Arquitetura e manutenção

O site é estático e não precisa de servidor de aplicação. O fluxo é: fontes e catálogos → build Node → HTML, bibliotecas e assets locais → runtime React/DC → controller com módulos de comportamento. A renderização mistura DOM/CSS, Canvas 2D e modelos CSS 3D. Estado de navegação e modais fica no controller; simulações de jogos e animações têm estados próprios.

Os módulos novos isolam responsabilidades: boot, cena, personagem, objetos, dado, shooter, computador, cartuchos, hitbox e conquistas. As funções de geometria do dado, sorteio de rotas e jogos novos são exercitáveis sem DOM. A ordem de instalação dos módulos é explícita e importante, pois alguns decoram métodos anteriores. Alterá-la requer executar os testes de integração.

O principal débito permanece o tamanho de `src/app.js` e a composição por decorators de protótipo. A decisão foi preservar os jogos e a aparência originais enquanto se extraem as funcionalidades novas. Uma migração completa para componentes independentes merece uma tarefa própria; fazê-la junto dessas mudanças adicionaria risco sem benefício visual imediato. Não há necessidade atual de banco, autenticação, analytics, roteador adicional ou dependências de produção via npm.

O runtime DC compila o template e o controller local com `new Function`. Esse código é estático e confiável; entradas do visitante não são enviadas a esse compilador. Ainda assim, a estrutura atual não é compatível com uma CSP que proíba totalmente avaliação dinâmica. Para adotar essa CSP, seria preciso substituir a compilação em execução por uma etapa de build.

### Limpeza realizada

- Removidos importador descartável, script de adaptação já concluída, catálogo vazio e dados duplicados de boot/projetos.
- Removidos motores antigos de Reflexo/Sequência substituídos pelos novos cartuchos, incluindo seus desenhos e chamadas.
- Removidas definições antigas de artes sobrescritas, a pelúcia verde substituída e o registro da lâmpada retirada do quarto.
- Eliminadas rotas de currículos do exportador e o número pessoal que ainda aparecia literalmente nos scripts auxiliares.
- Arquivos gerados, caches, logs e bytecode Python ficam fora do Git; somente `dist/` é enviada pelo workflow.
- Os subconjuntos WOFF2 foram preservados: são arquivos utilizados pelos intervalos Unicode das fontes, especialmente japonês.

### Segurança e privacidade

A revisão incluiu fontes, dados de projetos, traduções, assets publicáveis, scripts de documentos, servidor local, workflow e PDFs. Os testes não encontraram telefone literal nem chave privada no código editável. Os PDFs foram verificados também por extração de texto, metadados e anotações de links. Os canais públicos são e-mail, LinkedIn, GitHub e currículos; links de decks são as referências expressamente fornecidas pelo proprietário.

Não há coleta de mensagens, credenciais ou progresso remoto. `localStorage` guarda progresso, recordes, idioma e a marca booleana de boot já iniciado (`okaru-boot-seen`). Essa marca não habilita Continuar e não é apagada por Novo jogo. Sem armazenamento, ela dura somente a sessão da página. Terminais são simulados, com dispatch explícito, sem execução de shell. A interface usa texto/React para mostrar entradas; SVGs dos props vêm de desenhos locais. Links em nova aba usam isolamento do opener. O servidor de desenvolvimento valida o caminho canônico, incluindo links simbólicos, antes de servir arquivos e escuta apenas em localhost.

O workflow não inclui segredo pessoal; usa permissões de leitura no build e Pages/OIDC no deploy. A varredura é uma revisão de código e artefatos, não um teste de intrusão nem uma garantia contra toda vulnerabilidade futura. Qualquer novo arquivo colocado em `public/` será publicado e precisa de conferência.

### Avaliação dos currículos

**Adequação:** os três documentos apresentam uma base forte para estágio em infraestrutura, segurança e sistemas embarcados. Há evidências concretas de firmware, rede, APIs, testes, dashboard e trabalho voluntário. O recorte profissional combina com os projetos do portfólio, e as tecnologias são encontradas no texto extraído dos PDFs.

**Melhorias editoriais recomendadas:**

1. Reduzir densidade ao adaptar cada candidatura: priorizar os dois ou três projetos mais relevantes à vaga e resumir o restante.
2. Trocar a métrica de “887 linhas de código” por resultado técnico mensurável, quando houver evidência real. Quantidade de linhas por si só não indica impacto.
3. Esclarecer se as entregas com Invivio/CPTM foram projetos acadêmicos com parceiros. O texto não deve sugerir vínculo de emprego se ele não existiu.
4. Harmonizar a educação no Instituto Sidarta: EN indica “High School Diploma, 2010–2022”; JP descreve educação básica completa. O intervalo de 12 anos merece essa mesma clareza nas três versões.
5. Revisar idade/datas periodicamente; a versão japonesa traz 21 anos. O currículo japonês é um resumo técnico internacional, não o formulário tradicional de 履歴書 que algumas empresas exigem.

Não foram inventados resultados, métricas ou vínculos para resolver esses pontos. A revisão preservou o conteúdo profissional fornecido, retirou o telefone e ajustou a paginação. PT: 5.098 caracteres extraídos; EN: 4.895; JA: 2.524. Os três têm uma página e foram inspecionados em imagem. Japonês é mais denso, porém sem conteúdo cortado nos renders conferidos.

### Evidências e limites

- Build concluído com os assets locais e PDFs presentes.
- **147 testes automatizados passaram**, cobrindo dados, traduções, save, boot normal/falha, comandos da hitbox, regras dos cartuchos, tiro, dado, caminhos, cliques próximos, drag, moedas, portais, privacidade e links. Os testes novos distinguem os dois portais da home, verificam as viagens de ida/volta sem usar a porta e exercitam o pânico inicial e a chance de 10% posterior. Também verificam a ausência de pulo do boot, a limpeza dos erros, as mensagens finais acessíveis e o cancelamento do botão atrasado ao pressionar Enter. O contato mantém e-mail à esquerda e currículos à direita; o rodapé foi aproximado dos links sociais.
- A entrada começa com uma TV vintage desligada, construída com faces em CSS 3D. Canal e volume são controles cenográficos; energia é o único comando de entrada. Após o clique, as fases são alinhar, aproximar da tela e acender, totalizando cerca de 6,2 s. O zoom usa o retângulo real do vidro e cobre viewports largos ou verticais. Eventos de transição/animação avançam uma única vez, com timers de segurança e limpeza no unmount. Nenhum timer ou registro de boot roda antes do fim. Novos visitantes veem a seleção; os recorrentes seguem para o boot com idioma salvo. Reboots internos e navegação não repetem a entrada; movimento reduzido usa fades curtos.
- O “blup” usa tons senoidais/triangulares descendentes e ruído filtrado, reaproveitando o mixer existente e o efeito da TV no quarto. O AudioContext é iniciado no gesto de energia; respeita som desligado e não agenda sons enquanto suspenso. Se o áudio falhar, a animação continua. Testes cobrem áudio suspenso, som não duplicado/atrasado, sequência, seletores por ponteiro/teclado e timers interrompidos. A síntese foi conferida por parâmetros; escuta e inspeção real no navegador continuam abrangidas pela limitação abaixo.
- Os três estilos de imagem compartilham overlays sem captura de ponteiro; não alteram transformações, coordenadas ou resolução dos canvases. A TV mantém um único botão de alternância, com texto PT/EN/JA e preferência em `okaru-display`. Os testes cobrem sequência, armazenamento indisponível/inválido, novo jogo e cancelamento de timers. O CSS da seleção de idioma ficou concentrado em `display.css`, removendo as regras anteriores duplicadas.
- A seleção promove a pergunta do idioma ativo e mostra as outras duas versões abaixo. Textos intencionalmente multilíngues usam elementos React com `lang` e `translate="no"`, criados antes do tradutor; isso evita retraduzir os nomes nativos. A entrada e o computador compartilham as opções. Testes cobrem as três combinações, a troca, a reabertura e a preservação da tradução normal fora do seletor.
- Rebote CRT usa um módulo próprio de física/renderização e o loop de animação existente. As colisões avançam em intervalos de até 5 ms, com limite de tempo por frame; há três fases, três vidas, pausa de foco e recorde no save `mini.tv-breakout`. Os handlers mantêm Hikaru sentado e são removidos no unmount. Doze testes cobrem física, sessão, comandos, foco/visibilidade, recorde e traduções. A arte foi renderizada nativamente; isso não certifica o layout do diálogo no navegador.
- O módulo de limpeza compartilha as coordenadas e transformações dos sprites existentes. A poeira começa no impacto e não bloqueia caminhar. Clique, gesto A/D ou botões acessíveis acionam três animações; menus/jogos impedem disparos acidentais. A área clicável acompanha o scroll a cada frame, sem renderizações React contínuas. Oito testes adicionais cobrem os gatilhos e os limites; a pose/arte foi inspecionada em render nativo. Poeira não é persistida nem habilita Continuar.
- A entrada pelo alçapão chama o mesmo tutorial da porta ao concluir o giro, ou imediatamente com movimento reduzido. `roomIntro` registra a exibição no save; Novo jogo reinicia a marca. Saves antigos preservam a inferência por objetos explorados. O sorteio de portal ocorre uma vez por solicitação de navegação: 10%, 12,5% e 16,7% para uma, duas e três páginas. A viagem reaproveita o estado existente de aceleração/pulo; ausência do pedestal retorna ao trajeto pelas portas. Testes exercitam as 12 rotas, callbacks, interrupção, migração de save e tutorial nos três idiomas. O layout novo foi conferido estruturalmente, ainda sem certificação visual em navegador.
- Renders nativos de quarto, props, D20, shooter e cartuchos foram inspecionados. Para a inspeção multilíngue dos cartuchos, foi usado Meiryo local no render de QA porque o renderizador nativo não reproduz o fallback CSS de fontes do navegador; o código publicado mantém as fontes originais.
- O script de auditoria de tradução lista candidatos, incluindo nomes próprios, comandos, seletores CSS e texto legado sobrescrito. Sua contagem não equivale a erros visíveis nem comprova por si só cobertura completa.
- A tentativa anterior de automação do navegador foi rejeitada pela ferramenta. Não foi contornada. Portanto, **layout, foco e interação real de DOM em diferentes navegadores ainda precisam de conferência visual**. Os testes de geometria não substituem essa etapa.
- As galerias atuais contêm esquemas ilustrativos localizados. Fotos/capturas reais dos projetos não foram fornecidas.
- Nenhum commit, push ou deploy foi executado. O procedimento de publicação está no README.

### Parecer final

A revisão do desktop de 01/10 separou o CSS em `desktop.css` e manteve uma única sessão no controller. O zoom usa uma cópia do canvas já renderizado, sem capturas da tela do sistema, downloads ou bibliotecas adicionais. O beat utiliza um canal próprio de áudio, cancelado ao sair, silenciar ou perder foco. A área de trabalho já está montada sobre o monitor durante a animação de sentar e é a mesma superfície usada no zoom. Os aplicativos usam posições, tamanhos, pilha e minimização independentes; as janelas ao fundo continuam visíveis e o jogo só avança quando sua janela está ativa. Slots estáveis preservam o DOM das outras janelas ao fechar um aplicativo. Os testes cobrem a geometria contínua, estado da pilha, arraste, redimensionamento, limites da tela, foco, áudio, conteúdo e traduções. A inspeção de layout foi estrutural; não houve validação visual em navegador nem escuta do beat nesta sessão.

O pacote está organizado para manutenção e publicação, com as funcionalidades solicitadas implementadas e regressões de lógica cobertas. A recomendação técnica é validar o DOM real antes de publicar e, nas próximas mudanças, extrair gradualmente o controller legado. O foco agora deve ser estabilidade, evidências reais dos projetos e adaptação dos currículos às vagas, evitando acrescentar complexidade sem necessidade.
