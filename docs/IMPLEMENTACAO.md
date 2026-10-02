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

## Verificação

- [x] Telas, estados e console conferidos no navegador, no desktop e no celular, quadro a quadro.
- [ ] Ritmo das animações e som em tempo real numa aba visível: o painel usado na revisão fica oculto e não reproduz isso com fidelidade.
