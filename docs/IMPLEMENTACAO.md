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
- [x] Rodapé logo abaixo dos links sociais; pedestal abaixo e à esquerda, ligado ao pedestal acima do seletor da home.
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

## Verificação visual ainda pendente

- [ ] Conferir o DOM em navegador desktop e celular nas três línguas. A recusa anterior da ferramenta impede certificar essa etapa nesta sessão.

## Limite de validação

Inspeção no navegador não foi autorizada pela ferramenta na tentativa anterior. Não contornar com outro navegador/servidor. Usar análise de código, testes de lógica e renderização nativa de canvas/PDF; registrar a ausência de validação visual de DOM no relatório final.
