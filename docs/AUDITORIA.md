# Auditoria do projeto — 01/10/2026

Revisão do portfólio inteiro: código-fonte, build, testes, publicação, execução no navegador, segurança, acessibilidade, internacionalização e documentação.

## Método

- Leitura do código, do template, dos estilos, dos scripts, do workflow e da documentação.
- Checagens automáticas: sintaxe de todos os scripts, resíduos de depuração, `eval`/`innerHTML`, listeners sem remoção, links externos sem `noopener`, imagens sem `alt`, IDs duplicados, arquivos públicos sem uso, conflitos e lacunas de tradução.
- Execução no navegador (desktop e celular): console, requisições de rede, custo de renderização, memória e as telas principais.
- `npm test`: **163 testes passam** depois das correções.

## Resultado geral

O projeto está saudável: não há segredos no código, `eval` ou `innerHTML` nos módulos, links externos inseguros, imagens sem texto alternativo, IDs duplicados nem arquivos públicos sem uso. O servidor local bloqueia acesso fora de `dist/`, o build recusa limpar links simbólicos, o JSON gerado escapa `<`, os currículos têm teste de privacidade e o workflow usa permissões mínimas. Uma renderização completa custa cerca de 0,3 ms, a página inicial tem cerca de 130 elementos e usa cerca de 15 MB de memória.

## Problemas corrigidos nesta auditoria

| # | Problema | Impacto | Correção |
| --- | --- | --- | --- |
| 1 | O navegador lia o template cru e tentava carregar `{{galleryImage}}` e `{{propImage}}`, e validava `d="{{…}}"` em SVG | 2 requisições 404 e cerca de 28 erros no console a cada carregamento | Atributos dinâmicos passaram a usar o prefixo `sc-camel-` do runtime; teste de regressão em `tests/bootstrap.test.mjs` |
| 2 | Seis frases tinham traduções diferentes em arquivos distintos; a última lida vencia em silêncio | Tradução imprevisível ao reorganizar arquivos | Duplicatas removidas (mantida a versão em uso); o build agora falha em conflitos; teste |
| 3 | “Blocos de bolso”, “Melodia 64” e “Estrada” não tinham tradução | Nomes dos jogos dos controles em português nos três idiomas | Traduções adicionadas; teste |
| 4 | Módulos instalados com `?.install`: um arquivo ausente sumia sem aviso | Funcionalidades desapareciam sem erro | Lista explícita `Portfolio.modules`, com erro no console para módulo ausente; teste |
| 5 | `npm test` dependia de arquivos gerados | Falhava num clone novo | Script `pretest` executa o build |
| 6 | A TV 3D não removia seus listeners ao ser destruída | Referências presas após a entrada | Remoção explícita em `destroy()` |
| 7 | A referência da cópia do quarto no desktop era recriada a cada render | Cópia do canvas a cada segundo durante o zoom | Referência memorizada |
| 8 | Configurações locais de ferramentas não ignoradas | Risco de enviar preferências locais ao Git | `.gitignore` atualizado |

Também foram corrigidos durante a sessão, antes da auditoria: a tela presa em “carregando o quarto…” quando a imagem do quarto falhava, e a máscara dos cantos da tela 3D que escondia o topo da imagem.

## Recomendações em aberto

Pontos que pedem uma decisão ou uma mudança maior; nada aqui quebra o site hoje.

| Prioridade | Ponto | Por quê | Sugestão |
| --- | --- | --- | --- |
| Média | O build grava uma cópia na raiz e o `index.html` da raiz é versionado, mas `assets/`, `vendor/` e `resume/` da raiz são ignorados | O `index.html` versionado aponta para arquivos que não estão no repositório e muda a cada build | Gerar só `dist/`, remover o `index.html` da raiz do Git (`git rm --cached index.html`) e visualizar com `npm run dev` |
| Média | O componente (cerca de 370 KB) vai embutido no `index.html` e é executado pelo runtime com `new Function` | Não é cacheado separadamente e impede uma Content-Security-Policy estrita; hoje não há CSP | Servir o componente como arquivo próprio quando o runtime permitir e adicionar uma CSP compatível |
| Média | Não há `.gitattributes` | No Windows, o Git converte LF em CRLF; arquivos gerados e hashes podem diferir do CI | Adicionar `* text=auto eol=lf` |
| Média | `src/app.js` tem cerca de 8 mil linhas e os módulos fazem cerca de 140 envoltórios de métodos | A ordem de instalação define o comportamento; é difícil prever efeitos colaterais | Extrair aos poucos partes do componente em módulos com ganchos explícitos |
| Baixa | A lista de módulos se repete no build, no template, em `enhancements.js` e no harness dos testes | Fácil esquecer um lugar ao criar um módulo | Um manifesto único lido por todos |
| Baixa | O build encontra a seção Lab por busca de texto no template | Frágil a mudanças de marcação | Marcar a seção com um comentário próprio |
| Baixa | As fontes (licença SIL OFL 1.1) não levam o texto da licença junto | A OFL pede que a licença acompanhe as fontes redistribuídas | Incluir o texto da OFL em `public/assets/fonts/` (ver [TERCEIROS.md](TERCEIROS.md)) |
| Baixa | A origem e a licença de `vendor/dc-runtime.js` não estão registradas | Arquivo de terceiros sem procedência documentada | Confirmar e registrar em [TERCEIROS.md](TERCEIROS.md) |
| Acessibilidade | O ajuste Movimento ignora a preferência do sistema (decisão de 01/10) | Quem pede menos movimento no sistema vê as animações até mudar o menu | Considerar usar a preferência do sistema só como padrão da primeira visita |
| Organização | `.agents/`, `.claude/`, `.codex/`, `.github/agents`, `.github/hooks`, `.github/skills` e `skills-lock.json` não estão versionados nem ignorados | Estado indefinido no Git | Decidir se entram no repositório ou no `.gitignore` |

## Limites desta auditoria

- O painel do navegador usado na revisão fica oculto e não anima em tempo real com fidelidade, nem toca áudio. Telas e estados foram conferidos quadro a quadro; o ritmo e o som precisam de uma conferência numa aba visível.
- Os testes de lógica não substituem testes em vários navegadores e aparelhos reais.
- A ferramenta `scripts/audit-translations.mjs` aponta 213 candidatos sem catálogo; os restantes são nomes próprios, termos técnicos, logs do boot e textos propositalmente nativos.
