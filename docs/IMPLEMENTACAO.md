# Acompanhamento da revisão

## Etapa anterior — fechar antes de novas funcionalidades

- [x] Link público do Moxfield: `https://moxfield.com/lists/Jb445-paper-decks`.
- [x] Fontes originais, layout e animações recuperados; PDFs locais sem telefone.
- [x] Quarto com estante, coleção, puff, drone e ações direcionais.
- [x] D20 geométrico, tiro com mira livre e combos com espera ampliada.
- [x] Encerrar testes de regressão, cobertura de traduções e limpeza de arquivos obsoletos.

## Novo pedido — 29/09/2026

- [x] Portais ancorados no layout, à esquerda dos esquemáticos e de “jogando agora”, sem sobreposição em PT/EN/JA. Retorno interativo à home; portal discreto no contato.
- [x] Japonês sem quebras em palavras de navegação/títulos; animação de reconstrução de texto em todos os idiomas.
- [x] Currículos com botões preenchendo o espaço disponível; somente abrir em nova aba, exceto preview interno do computador.
- [x] Instruções claras do jogo de tiro: mouse, teclado, pulo, tiro, tanque, pausa e reinício.
- [x] Estante: ícones maiores junto ao nome e à descrição; traduções completas.
- [x] Pelúcia pequena de menina cega de coque inspirada na Toph, centralizada no tapete; remover resíduos do desenho antigo.
- [x] Corrigir o efeito do fliperama que extravasa a tela; centralizar o personagem nas máquinas.
- [x] Hitbox como controle inicial: quatro direções, seis ataques e duas assistências. Combos somente nela.
- [x] Golpes clássicos com animações: Street Fighter, Mortal Kombat, Skullgirls, Venom e Dizzy de Guilty Gear, Toph de Avatar. Documentar referências e adaptações.
- [x] Um minijogo característico por controle clássico, incluindo blocos no Game Boy.
- [x] Caminhos variáveis desde o começo e durante o percurso, com desvios longos raros.
- [x] Botões próximos sempre recebem deslocamento e animação; preservar drag dos modelos 3D e animar cliques.
- [x] Computador: sentar, aproximar da tela e abrir desktop inspirado no Arch. Aplicativos: jogo, idiomas, relógio, habilidades, currículo, Lab e terminal fictício (neofetch/htop).
- [x] Boot mais longo, falha fictícia, avisos, encerramento dos avisos, Enter para reiniciar e botão posterior. Regra atual: primeira visita sempre em pânico; 10% de chance nas seguintes. Reboot de recuperação não falha novamente. Botão e atalhos de pular removidos; tela limpa após os erros, resumo da recuperação com Enter na última linha e botão abaixo do texto somente 8 segundos depois.
- [x] Idioma persistente pula seleção em próximas visitas; continuar desativado até existir progresso salvo.
- [x] Exatamente 51 conquistas com condições reais e traduções.
- [x] Revisão final de arquitetura, código, funcionalidades e segurança; conferir currículos e ausência de telefone.
- [x] README e relatório final com resultados e limitações reais da validação.

## Ajuste de contato — 30/09/2026

- [x] Ajuste de 30/09: “Insira ficha / copiar e-mail” à esquerda e currículos compactos à direita, com quebra responsiva apenas quando faltar espaço.
- [x] Rodapé logo abaixo dos links sociais; localização dos pedestais refinada em 01/10 conforme a seção abaixo.
- [x] Portal escondido atrás da planta ↔ alçapão acima do kanji, com giro de entrada/saída e furigana preservado.
- [x] Pânico na primeira visita após escolher idioma, diagnóstico variado nos três idiomas, marca local independente do progresso e recuperação normal garantida.

## Abertura e imagem de TV — 30/09/2026

- [x] TV vintage em CSS 3D sobre fundo simples a cada carregamento; botão físico de energia inicia a entrada.
- [x] Seletores cenográficos de canal e volume, incluindo clique/arraste e teclado; não alteram o áudio nem iniciam o boot.
- [x] Câmera alinha e aproxima da tela; acendimento do centro para cima/baixo mais lento, com sequência total de cerca de 6,2 s antes do boot.
- [x] Som local de “blup” no acendimento, respeitando mudo; falha de áudio não bloqueia nem produz reprodução tardia.
- [x] Seleção de idioma decorada com identificação, indicador de sinal e faixa de calibração; controles liberados ao fim da abertura.
- [x] Depois de ligar a TV, visitantes com idioma salvo seguem ao boot; navegação e reboot interno não repetem a entrada.
- [x] TV do quarto com um botão para alternar TV antiga, tubo CRT e alta definição; preferência independente do progresso, salva localmente.
- [x] Efeitos discretos sem capturar cliques; movimento reduzido, modo econômico, traduções e testes de regressão.
- [x] Seleção com pergunta principal no idioma ativo e duas perguntas secundárias nos demais idiomas; nomes nativos nas opções da entrada e do computador, preservados pela tradução.
- [x] Continuar exige save válido carregado ou gravado; preferências, boot e progresso não salvo não habilitam a ação. Primeiro Novo jogo usa um clique; substituição de save mantém confirmação.

## Minijogo no puff — 30/09/2026

- [x] Sentar no puff oferece Rebote CRT; fechar a partida mantém Hikaru sentado e permite levantar pelo diálogo.
- [x] Quebra-blocos com três fases, três vidas, recuperação de vida e recorde no save existente.
- [x] Mouse, toque, teclado e botões para lançar, pausar e reiniciar; pausa ao perder foco ou esconder a aba.
- [x] Textos PT/EN/JA, foco no jogo, contenção de teclado no diálogo e efeitos reduzidos.
- [x] Testes de física, integração, persistência, ciclo de vida e traduções; render nativo da arte inspecionado.

## Limpeza após quedas — 30/09/2026

- [x] Poeira no rosto e na roupa a partir do impacto; caminhar continua permitido.
- [x] Clique no Hikaru e botões discretos para limpar o rosto ou sacudir a roupa, no quarto e nas páginas comuns.
- [x] Seis toques alternados A/D acionam a terceira animação; repetição automática e controles de jogos não contam.
- [x] Animações curtas, partículas, movimento reduzido e textos em PT/EN/JA; sem troca de página ou progresso artificial.
- [x] Oito testes adicionais de impacto, interação, geometria, teclado, pausa, traduções e persistência; sprite renderizado e inspecionado.

## Tutorial e viagens por portal — 01/10/2026

- [x] Primeira visita ao quarto mostra o tutorial após a chegada pela porta ou pelo alçapão; estado explícito no save e compatibilidade com visitas antigas.
- [x] Navegação entre páginas usa portais ocasionalmente: 10%, 12,5% ou 16,7%, conforme a distância. Sorteio único por viagem; portas continuam majoritárias.
- [x] Caminhada até o pedestal, giro de saída/chegada, callbacks, movimento reduzido, aceleração, pulo e troca de destino integrados.
- [x] Portal da Home à direita de “Ver sobre”, na linha dos botões; portal de Contato à direita do GitHub, mantendo os grupos de e-mail/currículos e o rodapé.
- [x] Testes de tutorial, persistência, traduções, probabilidades, todas as rotas e interrupções da viagem.

## Desktop com janelas — 01/10/2026

- [x] Desktop ampliado, barra inferior com oito ícones, rótulos sem sobreposição e rolagem em telas estreitas.
- [x] Aproximação de 2,3 segundos usando a imagem e a geometria real do monitor; beat local, mudo, cancelamento e movimento reduzido.
- [x] Janelas independentes e simultâneas, arraste e redimensionamento, ordem de sobreposição, minimizar pela taskbar, estado preservado ao alternar e foco por teclado.
- [x] Landing page no monitor desde a animação de sentar; a mesma superfície cresce no zoom, sem fade de troca.
- [x] Avisos de demonstração e dados fictícios removidos da interface do desktop em PT/EN/JA.
- [x] Árvore de habilidades completa, lista de quatro áreas, prévia de currículo e Lab em janelas internas.
- [x] Jogo dentro do desktop, suspenso em segundo plano; controles por teclado/toque e pausa ao perder foco.
- [x] Botão interno de desligar volta ao quarto; botão global de energia preservado. Boot segue sem botão de pular.
- [x] Traduções PT/EN/JA, build e testes de regressão; revisão visual de DOM continua pendente.

## Padronização dos fliperamas — 01/10/2026

- [x] Invaders e tiro: Jogar, interação especial, Fechar; rótulos PT/EN/JA.
- [x] Cabeçalho, X à direita, tela e controles à esquerda, instruções à direita; adaptação em uma coluna no celular.
- [x] Falas sem linha vazia de ilustração, botões uniformes e posicionamento que preserva a visão do personagem.
- [x] Mira, proporção do jogo, teclado, toque e foco preservados; três testes de regressão adicionais.

## Hitbox: sequência exata e boneco de treino — 01/10/2026

- [x] Combo só executa quando toda a entrada desde a última limpeza é a sequência exata; botão extra deixa o visor em “Sequência inválida” até SELECT/Esc.
- [x] Peacock removida; Squigly, Big Band, Annie e Ms. Fortune (Skullgirls), Falke (Street Fighter) e Iroh (Avatar) adicionados. 22 lutadores e 42 golpes, sem sequência que bloqueie outra.
- [x] Boneco de treino com reação por tipo de golpe: projéteis, lançamento com tontura, puxão do Spear com “GET OVER HERE!”, congelamento, choque, queimadura, agarrão, cova com flor e pisão.
- [x] Faísca de impacto, hit-stop, contador de HITS, escurecimento nos supers, lado escolhido conforme o espaço e retorno de Hikaru ao ponto de partida.
- [x] Traduções PT/EN/JA, sons de impacto locais e testes de sequência, elenco e reações. Quadros inspecionados no navegador.

## Entrada no monitor — 01/10/2026

- [x] Zoom do quarto para dentro do monitor com quadros WAAPI amostrados em escala logarítmica; câmera e desktop calculados juntos, sem tempo parado no início.
- [x] Página ao redor escurece gradualmente em vez de sumir num corte.
- [x] Movimento reduzido decidido em um só lugar (desktop.js) e trocado por esmaecimento curto; testes de alinhamento quadro a quadro e quadros conferidos no navegador.

## Abertura: a TV liga antes do zoom — 01/10/2026

- [x] A TV liga na própria tela antes de qualquer zoom: brilho de aquecimento, ponto, linha, tela cheia, estática, faixa de sincronismo, imagem e número do canal.
- [x] Sons sincronizados (estalo, degauss, crepitar, chiado e blup), sem tons agudos e sem reprodução atrasada com áudio suspenso.
- [x] Zoom só depois do acendimento; o vidro esmaece sobre a mesma imagem em tela cheia e o boot só começa no fim.
- [x] Movimento reduzido da TV decidido pelo menu do portfólio, como no desktop; testes reescritos para a nova ordem.

## Passagens dos botões da home — 01/10/2026

- [x] Ver projetos: alçapão que se parte ao meio, pausa no ar e queda; chegada caindo e girando sobre o pedestal de Projetos, com impacto e poeira.
- [x] Ver sobre: escada secreta com lajes deslizantes, descida recortada pela borda e chegada subindo a escada no pedestal de Sobre.
- [x] Sons por etapa, movimento reduzido, troca de destino no meio da passagem e portais existentes preservados (continuam com o giro); testes e quadros conferidos no navegador.

## Televisão 3D da entrada — 01/10/2026

- [x] Modelo 3D próprio em WebGL (sem bibliotecas): gabinete, painel, seletores, botões, alto-falante, pés, antena, traseira e etiquetas; a TV fica fixa e a câmera orbita 360°, por cima e por baixo, com inércia e zoom.
- [x] TV ligada desde o início com o canal de luta; cinco canais originais (luta, monstros de bolso, show, RPG, faroeste) com estática de sintonia e número do canal na tela.
- [x] Volume funcional com barra na tela e som próprio por canal; liga/desliga com colapso e aquecimento do tubo.
- [x] Botão Entrar no modelo e no painel: liga se necessário, sintoniza o cartão, alinha e mergulha a câmera, esmaece e só então começa o boot.
- [x] Painel acessível por teclado, Movimento reduzido, reserva em CSS sem WebGL, traduções PT/EN/JA e testes de estado, câmera, seleção dos controles e fluxo de entrada; quadros conferidos no navegador, inclusive no celular.

## Auditoria completa — 01/10/2026

- [x] README reescrito só com o portfólio e o autor; notas técnicas movidas para `docs/DESENVOLVIMENTO.md`.
- [x] Template sem requisições 404 nem erros de SVG antes do runtime (prefixo `sc-camel-`).
- [x] Conflitos de tradução removidos e bloqueados no build; nomes dos jogos dos controles traduzidos.
- [x] Módulos ausentes avisados no console; `npm test` gera o build antes; listeners da TV 3D removidos; referência do desktop memorizada; configurações locais ignoradas.
- [x] Documentação: índice, arquitetura, auditoria e componentes de terceiros. Detalhes e recomendações em [AUDITORIA.md](AUDITORIA.md).

## Idioma antes da TV e modo recrutador dentro dela — 02/10/2026

- [x] A escolha de idioma vem antes da TV; quem já tem idioma salvo começa direto na TV. A TV liga como um tubo (linha que se abre) ao escolher.
- [x] Tela de idioma decorada: céu de pixels, equalizador com picos, notas que sobem, cursor de menu, saudação e deck de passos; teclado (setas, Enter, M) e foco seguindo o cursor.
- [x] Trilha própria da tela de idioma em três estilos que o cursor troca sem perder o compasso (samba, rock e matsuri pentatônico), com blips por opção.
- [x] Primeiro canal da TV é o do modo recrutador: “Está com pressa?” e “Quebre aqui” no idioma escolhido; três batidas racham e quebram o vidro, os estilhaços voam e o modo recrutador abre por cima da TV. Os outros cinco canais seguem iguais.
- [x] Esc volta à TV com o vidro quebrado; os links do modo recrutador saem da TV direto para a página, sem boot. Botão no painel para teclado e toque; reserva em CSS também aceita batidas.
- [x] Traduções PT/EN/JA, testes do novo fluxo, das batidas e da trilha; quadros conferidos no navegador, no desktop e no celular.

## Saída pela TV ao contrário da entrada — 02/10/2026

- [x] Segurar o botão de energia apaga o portfólio num ponto e a câmera recua de dentro do vidro até a TV inteira, gira de volta à vista inicial e a TV religa no canal do modo recrutador.
- [x] Controles e painel esperam a câmera; sopro de ar e sons de religar; rachaduras reaparecem com a saída; reserva em CSS com zoom ao contrário; Movimento reduzido mantém o esmaecimento.
- [x] Testes do estado de saída e do fluxo do botão de energia; quadros conferidos no navegador, com e sem WebGL.

## Pergunta principal segue o cursor — 02/10/2026

- [x] “Qual idioma você fala?” em destaque no idioma sob o cursor (mouse, foco ou setas), com as outras duas versões menores abaixo e entrada “digitada”; as opções não se movem com a troca, no desktop e no celular.

## Telas de vários tamanhos, controle de toque e novas passagens — 02/10/2026

- [x] Até 860 px, o nome, as portas laterais e Hikaru param de crescer em tablets e a margem lateral acompanha a porta: os títulos não ficam mais sob as portas; Hikaru para sobre o capacho ao sair; reposicionado ao redimensionar a janela.
- [x] Controle de toque em celulares e tablets: joystick de 8 direções, A (usar) e B (correr ou fechar), nas páginas e no quarto, com botão para esconder; usa as mesmas teclas do teclado.
- [x] Sobre: o pedestal virou uma porta vista de frente que se abre; Início ↔ Contato: os pedestais viraram dois orelhões que tocam e levam Hikaru pela linha.
- [x] Testes do controle, das passagens e de um contrato de tamanhos de 320 a 860 px; quadros conferidos no navegador.
- [x] Em celulares e tablets, “Hikaru Ogasawara” ocupa toda a largura da coluna (até ~190 px a 860 px), sem fazer as portas e o Hikaru crescerem junto.

## Controle de toque em faixa própria — 02/10/2026

- [x] O controle virou uma faixa própria entre a página e a barra de baixo; a dica de poeira, avisos e o chip da caminhada ficam acima dela. Classes renomeadas para `tpad-*`, sem conflito com o `.pad` do controle do Game Boy.
- [x] **A** limpa a poeira depois de uma queda (rótulo “limpar”); a dica passa a dizer “Aperte A ou toque em Hikaru”.
- [x] Fechado por padrão nas páginas comuns e aberto no quarto, com escolhas guardadas separadamente; o botão para abrir fica num espaço da barra de baixo; o × virou um desenho centralizado.

## Chuva de pop-ups na falha do boot — 02/10/2026

- [x] A falha fictícia empilha até 48 pop-ups de erro (um a cada duas linhas, numa grade 4×4 que cobre a tela inteira e é mais densa no meio), de dez tipos com visual próprio (navegador, antivírus fictício, alerta de sistema, erro clássico em cascata, adware, terminal, RPG, suporte falso, tela azul, não está respondendo), com marcas e números inventados e a etiqueta “simulação”.
- [x] Na recuperação, tocar ou clicar em qualquer lugar do console reinicia, sem esperar o botão; o texto diz “Toque na tela” no celular.
- [x] Traduções PT/EN/JA e teste dos tipos, da pilha e do toque; conferido no navegador em tamanho de celular.

## Os botões da home são as passagens — 03/10/2026

- [x] “Ver projetos” vira o alçapão: o botão racha ao meio e as duas metades (cópias dele, com o texto partido) caem em perspectiva para dentro do buraco que fica no seu lugar; Hikaru cai recortado pelas bordas do botão, encolhendo e escurecendo.
- [x] “Ver sobre” vira a laje: o botão desliza para o lado e revela os degraus embaixo; Hikaru desce em direção à ponta escura, recortado pelo botão; na volta pela porta de Sobre, sobe por ela e a laje se fecha.
- [x] A volta do pedestal de Projetos sai do alçapão do botão (ele abre, Hikaru salta e pousa com ele fechado), em vez do giro.
- [x] Clique, Enter e controle levam Hikaru até o botão antes de abrir; num toque, com ele escondido, ele aparece em cima do botão. Movimento reduzido continua trocando de página direto.
- [x] As cópias têm a posição e o visual exatos do botão naquele momento (inclusive hover e frações de pixel), ficam fora da navegação e da leitura de tela e somem ao fim da passagem ou se ela for interrompida.
- [x] Testes do caminho até o botão, das cópias, das classes e da limpeza; conferido quadro a quadro no navegador no desktop e no celular.

## Seções dentro da logo no celular — 03/10/2026

- [x] Até 860 px, as quatro seções saem da barra e ficam dentro da logo; ao lado dela aparece a seção atual com uma setinha (antes, Sobre e Contato ficavam escondidos numa rolagem lateral).
- [x] Tocar na logo abre um painel que cresce a partir do centro do chip, com as seções em sequência; escolher uma, tocar fora ou `Esc` recolhe tudo de volta para dentro da logo (a última sai primeiro).
- [x] O menu pertence à página em que foi aberto: qualquer troca de página ou de largura o fecha. No desktop, no quarto e no laboratório a logo continua indo para o Início ou para o quarto.
- [x] Rótulo e estado acessíveis (“Seções: abrir/fechar o menu”, `aria-expanded`, `aria-controls`) em PT/EN/JA; fechado, o painel some do Tab e do leitor de tela.

## Capturas do painel na galeria do AquaSense — 03/10/2026

- [x] Nove capturas do dashboard abrem a galeria do AquaSense, antes dos dois esquemas: visão geral, histórico, alertas, dosagem, tendências e log, skill da Alexa, hardware e equipe, e os temas verde e claro.
- [x] Recortadas (sem a borda da janela e a barra de rolagem), reduzidas a 1600 px e salvas em JPEG: cerca de 90–130 KB cada, em vez de 1,3 MB.
- [x] O endereço do broker público e o namespace MQTT foram pixelados nas três telas que os mostravam, para não expor os tópicos de comando do dispositivo; os originais ficam fora do repositório.
- [x] A captura da planilha CSV no Excel ficou de fora; legendas traduzidas em PT/EN/JA.

## README em três idiomas — 03/10/2026

- [x] Os três idiomas num só `README.md`, cada um num bloco que abre e fecha com um clique (`<details>`), com o inglês aberto: o mais próximo de abas que o GitHub permite (as abas ao lado de README são só para License, Code of conduct, Contributing e Security).
- [x] A tabela de formação, idiomas, pontos fortes e objetivo virou lista, sem a linha vazia que o cabeçalho em branco criava.
- [x] Mesmo conteúdo nos três, com os termos já usados pelo site em cada idioma; atualizados os botões da home como passagens, os pop-ups da falha do boot e o menu dentro da logo no celular.

## okwm, o OS do computador do quarto — 05/10/2026

- [x] Desktop flutuante trocado por um gerenciador em mosaico (escolha do usuário entre três estruturas), com a paleta predominante do portfólio e o skyline noturno de São Paulo em pixel art desenhado em canvas.
- [x] Tela de bloqueio com relógio, sprite do Hikaru e senha que se digita sozinha; a área 1 se monta bloco a bloco ao entrar.
- [x] Árvore de blocos: divisão pelo lado mais comprido, calhas arrastáveis e por teclado, troca por arraste da barra de título, tela cheia, minimizar e abas abaixo de 640 px.
- [x] Quatro áreas de trabalho com conjuntos próprios, lançador com busca no idioma ativo e atalhos com Alt no estilo i3.
- [x] Apps novos: Arquivos (projetos e currículos), Monitor no estilo btop só com medições reais, Música com as trilhas existentes e Notas; terminal com histórico, ↑/↓, Tab e mais comandos.
- [x] Traduções PT/EN/JA em `translations-os.tsv`; 193 testes passam.
- [x] Área vazia: a camada dos blocos deixou de cobrir os botões; **Restaurar esta área** traz o conjunto da área (fechados, minimizados ou em outra área) e **Abrir o lançador** abre a busca, assim como o clique direito no fundo.

## Verificação

- [x] Telas, estados e console conferidos no navegador, no desktop e no celular, quadro a quadro.
- [ ] Ritmo das animações e som em tempo real numa aba visível: o painel usado na revisão fica oculto e não reproduz isso com fidelidade.
