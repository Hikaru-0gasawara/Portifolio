# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recrutadores e empresas que avaliam habilidades e projetos de Hikaru Ogasawara, com um caminho rápido (modo recrutador) para quem tem pouco tempo. Também visitantes curiosos que exploram o quarto e os minijogos. *Inferido do repositório (modo recrutador, currículos em PDF, repositórios dos projetos); o público exato não foi detalhado pelo usuário, que aprovou a hipótese.*

## Product Purpose

Portfólio pessoal em que o próprio site é a demonstração: um quarto em pixel art explorável, com projetos, laboratório, árvore de habilidades, minijogos e currículos. Sucesso: o visitante entende o que Hikaru sabe fazer, abre projetos ou currículos e entra em contato.

## Positioning

O portfólio é um quarto jogável, com TV, desktop local, estante, controles clássicos e minijogos. A identidade pessoal vem junto: coleção de decks no Moxfield, referências de jogos de luta e interface em português, inglês e japonês. Outro portfólio não poderia copiar isso com verdade.

## Operating Context

- Site estático publicado no GitHub Pages por workflow de Actions.
- Build com módulos nativos do Node (22+), sem `npm install`.
- Fontes editáveis em `src/`; `index.html`, `assets/` e `vendor/` são gerados.
- Traduções em arquivos `src/translations*.tsv`.

## Capabilities and Constraints

- Sem backend e sem CDN: React, fontes, imagens e PDFs são locais.
- Toda interface nova precisa de tradução em PT, EN e JA, sem quebras em palavras de navegação e títulos no japonês.
- O modo recrutador (caminho rápido) deve ser preservado.
- Currículos públicos não podem expor telefone.
- Os testes em `tests/` devem continuar passando (`npm test`).

## Brand Commitments

- Linguagem de pixel art mantida (confirmado pelo usuário).
- Nome: Hikaru Ogasawara.
- Link público do Moxfield: `https://moxfield.com/lists/Jb445-paper-decks`.

## Evidence on Hand

- Projetos, repositórios e galerias em `src/projects.json`.
- Currículos em PDF locais, em `public/` e `resume/`.
- Auditoria e referências em `docs/REVISAO.md` e `docs/REFERENCIAS.md`.
- Não há depoimentos, clientes ou métricas registrados. Não inventar nenhum.

## Product Principles

1. O site é a prova: o quarto jogável demonstra habilidade técnica em vez de apenas descrevê-la.
2. Nunca bloquear o recrutador: o caminho rápido para projetos e currículos sempre existe.
3. Três idiomas por padrão: nada novo é entregue sem PT, EN e JA.
4. Autonomia total: tudo local, estático e publicável sem serviços externos.
5. Personalidade verdadeira: referências e coleções refletem gostos reais, sem invenções.

## Accessibility & Inclusion

Nenhum padrão formal foi estabelecido. Requisitos conhecidos: suporte a três idiomas (incluindo japonês sem quebras indevidas) e instruções claras para os controles dos minijogos (mouse, teclado, pausa e reinício).
