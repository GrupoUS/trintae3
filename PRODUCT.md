# Product

## Register

product — site institucional Grupo US (`https://grupous.com.br`).

## Users

Profissionais da saúde estética avançada — enfermeiras, biomédicas, farmacêuticas, fisioterapeutas — chegando ao site via tráfego pago, orgânico ou indicação. Dois perfis predominantes:

1. **Entrada** — pesquisa um curso técnico (Aurículo) ou comunidade de educação contínua (Comunidade US). Quer entender quem é o Grupo US antes de comprar o primeiro produto.
2. **Escala** — já é especialista, busca rota de crescimento (TRINTAE3 → Black NEON → OTB). Avalia autoridade institucional, mentoras e prova social antes de entrar em funil de mentoria.

Em ambos os casos, o site não vende sozinho. Vende a marca, captura sinal de intenção e despacha o lead para o funil correto (`drasacha.com.br`, subdomínios de produto, WhatsApp da SDR Laura). Comportamento: leitura rápida em mobile (mais comum), aprofundamento em desktop quando há decisão de compra próxima.

## Product Purpose

`grupous.com.br` é a **vitrine institucional** do ecossistema Grupo US. Substitui um conjunto disperso de LPs por uma porta de entrada única, em PT-BR, com hierarquia clara: identidade da marca → grade de produtos → jornada → autoridade da Dra. Sacha Gualberto e do time → CTAs alinhados aos canais oficiais.

Sucesso operacional: a aluna potencial sai do home sabendo (a) o que o Grupo US faz, (b) qual produto encaixa na fase dela, (c) por onde continuar (LP específica, WhatsApp ou comunidade). O site **não roda** funil de checkout próprio; ele empurra para os hubs externos (`drasacha.com.br`, `namesa.gpus.com.br`, `neondash.com.br`, `trintae3.drasacha.com.br`).

Mapa de produtos e rotas — fonte da verdade em [`astro.config.mjs`](astro.config.mjs) (redirects) + [`src/content/products/`](src/content/products) (JSON com `externalSiteUrl` e `cta.url`). Detalhe institucional, IDs e jornada → `.claude/skills/grupo-us/references/manual-resumo.md`.

## Brand Personality

Tom de voz **acolhedor, claro, consultivo**. Fala em "nós" — convite à comunidade, não pitch de vendedor. Três frases-âncora do manual Grupo US: "Nós iluminamos", "Clareza é a nova gentileza", "Olhar de dono". Identidade visual obedece o sistema **Azul Petróleo + Sovereign Gold** canonizado em `.claude/skills/gpus-theme`. Acolhedor não é pastel; é hierarquia legível, copy que respeita a leitora, e ouro raro marcando momento de decisão.

Definições detalhadas (missão, visão, valores inegociáveis, fundadora, equipe) ficam em `.claude/skills/grupo-us/references/manual-resumo.md` — este PRODUCT.md não duplica.

## Anti-references

Quatro rejection gates herdados da doutrina GPUS. Se uma página cai em qualquer um, **redesenhar antes do merge**:

1. **Template SaaS genérico** (Vercel, Stripe, Linear boilerplate): hero 50/50, gradient text, glassmorphism decorativo, hero-metric template, grid de cards idênticos. Falha imediato no AI slop test.
2. **ERP médico ou clínico cinza+azul corporativo**: tabelas densas sem hierarquia, ícones Material padrão, ausência de identidade. Estilo RD Station / Conexa.
3. **Dashboard crypto ou fintech neon-on-black**: charts saturados, glows decorativos, escuro gratuito, categoria saturada.
4. **App consumer rosado ou lifestyle estético** (Glossier-lite, clinic-pink): pastel feminina genérica. Quebra autoridade GPUS e confunde o público (educação técnica, não tratamento).

Lista canônica + matriz Do/Don't completa em [`.claude/rules/DESIGN.md`](.claude/rules/DESIGN.md) e `gpus-theme/references/design-taste.md`.

## Design Principles

Cinco princípios, adaptados ao contexto de **landing institucional** (não dashboard operacional):

1. **Curadoria acima de impressão.** Cada seção serve a decisão da leitora, não a primeira foto do portfólio. Métricas e prova social mostram autoridade, não vaidade.
2. **Acolhedor sem ser brando.** Copy consultiva e cordial; estrutura visual firme. O tom respeita, a hierarquia comanda.
3. **Densidade com hierarquia.** Páginas de produto carregam informação (pilares, entregáveis, FAQ, bônus, depoimentos). Resolver com tipografia, ritmo de espaçamento e tonal layering — nunca com cards aninhados ou bordas coloridas.
4. **Mobile é mídia de descoberta.** A maioria do tráfego pago entra em mobile. Um único scroll owner por página, alvos 44px+, hero legível sob luz forte.
5. **Anti-template férreo.** Os quatro anti-refs acima são gates, não sugestões. Hero centrado padrão, three-up de cards equal-width, gradient text — banidos. Reescrever ou redesenhar.

## Accessibility & Inclusion

WCAG 2.2 AA em todos os pares de contraste. Em particular:

- **Ouro escuro `#AC9469` sobre branco** falha (2.97:1). Texto-em-ouro no light usa `#8B6914` (5.2:1). Botão em fundo dourado usa texto escuro (`#0D1C2D` ou `#1a1207`), nunca branco. Fonte canônica: `gpus-theme/references/design-foundation.md §2.5`.
- **`prefers-reduced-motion`** respeitado em toda animação. Animação decorativa é opcional, nunca estrutural.
- **Foco visível** sempre — ring 3px da cor de focus token, nunca `outline: none` sem replacement.
- **Alvos táteis** ≥ 44 × 44px em mobile (utilitário `touch-target`).
- **Sem texto crítico só em ícone**, sem cor como único portador de significado, sem áudio essencial.

Regras universais (skip link, semantic landmarks, FAQ via `<details>` ou grid `0fr↔1fr`) em [`.claude/rules/frontend.md`](.claude/rules/frontend.md) e [`.claude/rules/DESIGN.md`](.claude/rules/DESIGN.md).

---

## Onde aprofundar

| Pergunta | Fonte |
|---|---|
| Voz de marca, missão, valores, jornada do aluno, IDs de produto | `.claude/skills/grupo-us/references/manual-resumo.md` |
| Tokens HSL Navy/Gold, contrast safety, depth model, typography hierarchy | `.claude/skills/gpus-theme/SKILL.md` + `references/design-foundation.md` |
| Regras universais de design (cor, tipo, motion, depth, focus) | `.claude/rules/DESIGN.md` |
| Slugs, rotas e redirects do site institucional | `.claude/skills/grupo-us/references/produtos-e-rotas.md` + [`astro.config.mjs`](astro.config.mjs) |
| WhatsApp SDR Laura (E.164 SSOT) | `.claude/skills/grupo-us/references/whatsapp-ssot.md` |
| Resumo design + matriz Do/Don't específica deste repo | [`DESIGN.md`](DESIGN.md) |
| Stack, comandos, estrutura de pastas, deploy | [`README.md`](README.md) |
