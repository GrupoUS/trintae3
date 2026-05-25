---
description: Review unificado de PR/branch — orquestra Superpowers (requesting + receiving code review), Claude Code code-review (codex:review + codex:adversarial-review), evaluator Mode 4 (PR adversarial deep review), `/debug audit pr` e leitura de comentários do GitHub via `gh`. Modos (positional): `<PR#>` · `--current` (já checked-out) · `--branch <name>` (review local sem PR). Flags: `--quick` (pula Caminho C/D e Phase 4) · `--fix` (opt-in — aplica P0/P1 com TDD) · `--no-debug` (pula `/debug audit pr`). Sempre roda os caminhos Iron-Law (`/codex:review` + `/codex:adversarial-review`). NUNCA aprova ou mergeia o PR — apenas gera corpo de comentário para `gh pr review`.
workflow_type: prompt-chaining
---

# /pr-review — PR Review unificado

**ARGUMENTS**: $ARGUMENTS

> Sequential pipeline de review. Une os 4 caminhos canônicos do projeto (Superpowers, Codex review, evaluator Mode 4, `/debug audit pr`) + comentários do PR. Saída em pt-BR no template solicitado.
>
> Uso típico:
> ```
> gh pr checkout <PR#>
> /pr-review <PR#>                 # full path
> /pr-review --current              # quando já está no branch do PR
> /pr-review --branch dev-test      # review local de branch (sem PR aberto)
> /pr-review <PR#> --quick          # pula Caminho C/D + Phase 4
> /pr-review <PR#> --fix            # aplica P0/P1 marcados "implement"
> ```

---

## Iron Law

```
PHASE 3A (/codex:review) NEVER SKIPPED — incluindo --quick.
PHASE 3B (/codex:adversarial-review) NEVER SKIPPED — incluindo --quick.
NUNCA executar `gh pr review --approve`, `gh pr merge`, ou `git push origin main`.
NUNCA aplicar findings de `/codex:adversarial-review` automaticamente.
NUNCA spawnear `codex:codex-rescue` (subagent) como fallback — usar direct-Bash via codex-companion.mjs.
PR comments + findings P0/P1 sempre passam por `superpowers:receiving-code-review` antes de decisão.
```

`/pr-review` é read-only por padrão. Mutações só com `--fix` explícito e ainda assim apenas via `Agent({subagent_type:"debugger"})` em foreground com gates per-fix.

---

## Stopping Conditions

- STOP se Phase 0 detecta branch mismatch (head do PR ≠ `git branch --show-current`) → pedir `gh pr checkout` ao usuário, não chamar automático.
- STOP se `gh auth status` falha em Phase 0 → instruir o usuário; não tentar `gh auth login`.
- STOP se algum campo do Phase 5.0 bundle não resolver (BASE_SHA, HEAD_SHA, DESCRIPTION, FOCUS) — placeholder dispatch é anti-pattern de `verify.md` § 7.5.
- STOP se diff `main..HEAD` excede 1000 linhas sem justificativa de escopo → propagar stopping condition de `evaluator.md:27` ao usuário antes de spawnar Mode 4.
- STOP se Phase 3A retorna P0/P1 → presentar via `codex:codex-result-handling`, perguntar; não auto-fix.
- STOP se Phase 3B retorna P0/P1 → presentar, perguntar; **NEVER** auto-fix de adversarial.
- STOP se Phase 5 `receiving-code-review` classifica comentário como "clarify" → surfacear pergunta ao usuário antes de decidir.
- STOP após 3 tentativas de fix falhas no mesmo arquivo (modo `--fix`) → escalar para `/debug recover`.

---

## 0. Mode dispatch + Pre-flight

Parse `$ARGUMENTS`:

| Token | Significado |
|---|---|
| `<inteiro>` | Número do PR — checkout deve ter sido feito |
| `--current` | Usa branch atual; resolve `gh pr view` no head |
| `--branch <name>` | Review local sem PR; sem leitura de comentários |
| `--quick` | Skip Caminho C (Mode 4) + Caminho D + Phase 4 |
| `--fix` | Opt-in fix loop (Phase 7) |
| `--no-debug` | Skip Phase 4 (`/debug audit pr`) |

### 0.1 Bootstrap (per `_shared.md` § 0.5 + § 12)

```typescript
Skill("superpowers:using-superpowers");                 // sempre primeiro
Skill("superpowers:requesting-code-review");            // bundle gate (5 campos)
Skill("superpowers:receiving-code-review");             // implement / clarify / pushback
Skill("superpowers:verification-before-completion");    // PASS rows precisam de stdout + exit code
Skill("superpowers:dispatching-parallel-agents");       // antes do batch paralelo de Phase 3
Skill("debugger");                                       // catálogo de anti-patterns NeonDash
```

### 0.2 Config + sanity

```bash
test -f .claude/config.json && cat .claude/config.json | head -50
gh auth status 2>&1 | head -10              # STOP se "not logged in"
gh --version | head -1
git status --short --branch | head -5
```

### 0.3 Branch consistency (skip se `--branch <name>`)

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ -n "$PR_NUMBER" ]; then
  PR_HEAD=$(gh pr view "$PR_NUMBER" --json headRefName --jq .headRefName)
  if [ "$CURRENT_BRANCH" != "$PR_HEAD" ]; then
    echo "STOP — branch atual ($CURRENT_BRANCH) não bate com head do PR ($PR_HEAD). Rode: gh pr checkout $PR_NUMBER"
    exit 1
  fi
fi
```

Branch protection (per root `AGENTS.md § Branch protection`): se `CURRENT_BRANCH = main`, parar imediatamente. Review de PR em `main` é sempre erro.

---

## 1. Phase 1 — Coleta de contexto dinâmico (PARALLEL Bash)

Roda todas as chamadas `gh` em paralelo no mesmo turn:

```bash
# Modo PR (PR# ou --current)
gh pr view "$PR_NUMBER" --json number,title,body,author,baseRefName,headRefName,changedFiles,additions,deletions,isDraft,mergeable,reviewDecision,statusCheckRollup
gh pr view "$PR_NUMBER" --comments
gh pr diff "$PR_NUMBER" --name-only
gh pr diff "$PR_NUMBER" --patch
gh pr checks "$PR_NUMBER" --json name,state,bucket,link,workflow || true
```

Quando `--branch <name>` (sem PR):

```bash
git log main.."$BRANCH" --oneline
git diff main..."$BRANCH" --stat
git diff main..."$BRANCH" --name-only
git diff main..."$BRANCH" --patch | head -2000   # cap para não explodir contexto
```

Comentários do PR ficam como `(N/A — review local sem PR aberto)`.

### 1.1 Risk signals (idêntico a `verify.md` § 3.3)

```bash
DIFF_NAMES=$(gh pr diff "$PR_NUMBER" --name-only 2>/dev/null || git diff main..."$BRANCH" --name-only)

TOUCHED_FRONTEND=$(echo "$DIFF_NAMES" | grep -c "^apps/web/src/" || echo 0)
TOUCHED_BACKEND=$(echo "$DIFF_NAMES" | grep -c "^apps/api/src/" || echo 0)
TOUCHED_SCHEMA=$(echo "$DIFF_NAMES" | grep -c "^apps/api/drizzle/" || echo 0)
TOUCHED_AUTH=$(echo "$DIFF_NAMES" | grep -E '(auth|session|webhook|rls|policy|clerk)' | wc -l)
TOUCHED_PAYMENT=$(echo "$DIFF_NAMES" | grep -E '(stripe|asaas|kiwify|hubla|billing|payment|pix)' | wc -l)
TOUCHED_PII=$(echo "$DIFF_NAMES" | grep -E '(users|customers|leads|patients|clientes).*\.(ts|tsx)$' | wc -l)
TOTAL_FILES=$(echo "$DIFF_NAMES" | wc -l)
TOTAL_LINES=$(gh pr diff "$PR_NUMBER" --patch 2>/dev/null | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' | wc -l)
```

`DRIFT_RISK` segue lógica idêntica a `verify.md` § 7 (`auth > payment > PII > schema > env > ci > none`).

Se `TOTAL_LINES > 1000` → surfacear stopping condition e perguntar se chunkar.

---

## 2. Phase 2 — Bundle Phase 5.0 (per `verify.md` § 7.5)

`superpowers:requesting-code-review` exige 5 campos antes de qualquer `/codex:*`. Resolver:

```bash
BASE_SHA=$(git merge-base main HEAD)
HEAD_SHA=$(git rev-parse HEAD)
PR_TITLE=$(gh pr view "$PR_NUMBER" --json title --jq .title 2>/dev/null || echo "(branch local)")
PR_BODY=$(gh pr view "$PR_NUMBER" --json body --jq .body 2>/dev/null | head -3)
DESCRIPTION="${PR_TITLE} — ${PR_BODY}"
PLAN_OR_REQUIREMENTS="(none — PR review)"           # ou caminho de docs/ se PR vincular
FOCUS="$DRIFT_RISK"                                  # auth | payment | PII | schema | env | ci | general
```

Surfacear inline:

```text
Code review bundle:
  BASE_SHA             = <40-char hex>
  HEAD_SHA             = <40-char hex>
  DESCRIPTION          = <text>
  PLAN_OR_REQUIREMENTS = <path|sentinel>
  FOCUS                = <token>
```

Campo vazio → STOP, perguntar ao usuário (não dispatchar com placeholder).

---

## 3. Phase 3 — Três (ou quatro) caminhos de review (PARALLEL)

Antes do batch, `superpowers:dispatching-parallel-agents` (já carregado em Phase 0.1) enforça: scope distinto, contract idêntico, single-message dispatch. Cap de 5 spawns/request (per `_shared.md § 7`).

### 3A. `/codex:review` (BACKGROUND — Iron Law)

```bash
/codex:review --base "$BASE_SHA" --head "$HEAD_SHA" --background \
  --focus "$FOCUS" --description "$DESCRIPTION" --plan "$PLAN_OR_REQUIREMENTS"
# Captura session ID para `/codex:result <id>` em Phase 5
```

**Direct-Bash fallback** (quando slash command indisponível):

```bash
PLUGIN_ROOT=$(ls -dt "$HOME/.claude/plugins/cache/openai-codex/codex/"*/ 2>/dev/null | head -1)
node "${PLUGIN_ROOT}scripts/codex-companion.mjs" review --base main --background
```

**Anti-pattern explícito**: NUNCA `Agent({ subagent_type: "codex:codex-rescue" })` como fallback — esse agent tem Bash+write e já foi observado rodando `split_router_patch.py` que reverte WIP do próprio arquivo sob revisão (per `verify.md § 16` + `MEMORY.md` entry `feedback_codex_rescue_destructive`). Direct-Bash via `codex-companion.mjs` é read-only.

### 3B. `/codex:adversarial-review` (BACKGROUND — Iron Law)

Focus text derivado de `DRIFT_RISK` (matriz idêntica a `verify.md` § 9):

| Signal | Focus text |
|---|---|
| `auth` ou `TOUCHED_AUTH > 0` | "security boundary, token lifecycle, session invalidation, data leakage paths" |
| `payment` ou `TOUCHED_PAYMENT > 0` | "idempotency, webhook replay, double-charge race, refund correctness" |
| `PII` | "data exposure, query scope, response shape leakage, log redaction" |
| `schema` ou `TOUCHED_SCHEMA > 0` | "data migration safety, FK invariants, soft-delete consistency, NOT NULL backfill" |
| `env` ou `ci` | "secret exposure, build determinism, deploy reproducibility" |
| `none` | "design tradeoffs, alternative approaches, failure modes, race conditions" |

```bash
/codex:adversarial-review --scope working-tree --background \
  "Focus: $FOCUS_TEXT. Question the chosen implementation. Surface failure modes, race conditions, alternative simpler approaches. Report findings only — do not apply fixes."
```

### 3C. `evaluator` Mode 4 (FOREGROUND — skip em `--quick`)

Per `evaluator.md` linhas 203-293 (Mode 4 Required Checks: OWASP, perf, SOLID, test coverage, maintainability) + linha 357 (escreve `docs/REVIEW-{pr|branch}-{slug}.md`):

```typescript
Agent({
  description: "PR Mode 4 deep review",
  subagent_type: "evaluator",
  prompt: `Mode 4: PR / Branch Diff Code Review.

PR: #${PR_NUMBER} (ou branch ${BRANCH} se --branch).
Diff: ${BASE_SHA}..${HEAD_SHA} (${TOTAL_FILES} files, ${TOTAL_LINES} lines).
Focus matrix from DRIFT_RISK=${DRIFT_RISK}: ${FOCUS_TEXT}.

Apply Mode 4 Required Checks per evaluator.md lines 225-293:
  - OWASP Top 10 (auth-aware se TOUCHED_AUTH > 0)
  - Performance regressions (N+1, missing index, bundle bloat)
  - SOLID + cohesion
  - Test coverage on changed paths
  - Maintainability (cyclomatic > 10, dead code, API contract drift)

Adversarial overlay (linhas 272-277): "what would make this diff a regression in 6mo?"

Output: write docs/REVIEW-pr-${PR_NUMBER}.md (ou REVIEW-branch-${slug}.md) per evaluator.md line 357. Mode 4 stopping (line 26): never apply fixes, recommendations only. Return < 800 tokens summary referencing the written file path + APPROVED|CHANGES_REQUESTED verdict.`
});
```

### 3D. `code-review:code-review` plugin (BEST-EFFORT — skip em `--quick`)

```typescript
Skill("code-review:code-review");
```

Plugin leve do Claude Code (PR-comment path). Coexiste com Mode 4 — paths diferentes (per `evaluator.md` linha 210). Se falhar ao carregar, marcar SKIPPED no verdict matrix e prosseguir (não-bloqueante).

---

## 4. Phase 4 — `/debug audit pr` (skip em `--quick` ou `--no-debug`)

Invocar subcomando existente (per `debug.md` § 2.8) — **não** reimplementar:

```
/debug audit pr
```

Comportamento já documentado:
- Roda `codex adversarial-review --scope branch` baseline.
- Spawn 4 agents paralelos (evaluator / debugger / debugger / frontend-specialist) restritos a arquivos do diff.
- Foco: D3 (code quality) + D8 (deps) + D9 (tech-debt) + segurança.
- Output: feedback inline por arquivo.

Capturar saída para consolidação em Phase 5.

---

## 5. Phase 5 — Consolidação + `receiving-code-review` (SEQUENTIAL)

### 5.1 Coletar resultados

```bash
# Caminho A
/codex:result "$CODEX_REVIEW_SESSION_ID"
# Caminho B
/codex:result "$CODEX_ADVERSARIAL_SESSION_ID"
```

Caminho C: ler arquivo escrito pelo evaluator:

```bash
REVIEW_FILE="docs/REVIEW-pr-${PR_NUMBER}.md"
# ou docs/REVIEW-branch-<slug>.md para --branch
```

Caminho D: resultado da skill (se carregou).

Phase 4: feedback inline coletado por arquivo.

### 5.2 Mesclar com comentários do PR

`PR_COMMENTS` capturados em Phase 1 (`gh pr view --comments`). Indexar por `path:line` quando disponível; caso contrário, agrupar por autor.

### 5.3 Avaliação técnica per item (`receiving-code-review`)

Para cada finding P0/P1 dos Caminhos A/B/C/D **+** cada comentário do PR não-resolvido, invocar a discipline da skill `superpowers:receiving-code-review`:

| Decisão | Quando | Ação |
|---|---|---|
| **implement** | Finding tecnicamente correto + fix in scope | Adicionar à lista de fix (Phase 7 se `--fix`) |
| **clarify** | Comentário/finding ambíguo | Formular pergunta específica; surfacear |
| **pushback** | Finding misread ou contradiz constraint documentada | Documentar contra-argumento com citação |

Anti-padrões (per skill): blind agreement **e** blind dismissal. Decisão precisa aparecer no output (Phase 6).

---

## 6. Phase 6 — Output (template em pt-BR)

Imprimir verbatim no chat:

````markdown
## /pr-review Report — PR #<N> · <YYYY-MM-DD HH:MM UTC>

### Resumo do PR
<≤5 linhas: o que muda + por quê + escopo>

### Riscos bloqueantes (request changes)
- **Arquivo/linha:** `path:line`
  **Problema:** <descrição>
  **Evidência:** <quote do diff ou log>
  **Impacto:** <runtime / segurança / dados / billing / regressão>
  **Correção recomendada:** <patch curto ou comando>
  **Decisão (receiving-code-review):** implement | clarify | pushback — <razão em 1 linha>

### Riscos não bloqueantes
- `path:line` — <P2/P3 finding>
- (nitpicks ignorados explicitamente listados aqui — sem repetir conteúdo)

### Testes e validações necessários
```bash
bun run type-check
bun run lint:oxlint:check
cd apps/api && bun run test       # se TOUCHED_BACKEND > 0
cd apps/web && bun run test       # se TOUCHED_FRONTEND > 0
# smoke específico se TOUCHED_SCHEMA > 0:
bun run db:check
# E2E na staging se TOUCHED_FRONTEND > 0:
bunx agent-browser open https://staging.neondash.com.br/<rota afetada>
```

### Comentários do PR (status)
| Autor | Comentário (snippet) | Decisão | Razão |
|---|---|---|---|
| @user | "..." | implement / clarify / pushback | <1 linha> |

(ou: `N/A — review local sem PR aberto`)

### CI checks
| Workflow | Estado | Bucket | Link |
|---|---|---|---|
| <name> | success / failure / pending | pass / fail / pending | <url> |

### Verdict matrix
| Sinal | Origem | Status | Notas |
|---|---|---|---|
| /codex:review (3A) | session `<id>` | PASS / WITH-NOTES / FAIL | P0=<n> P1=<n> P2=<n> P3=<n> |
| /codex:adversarial-review (3B) | session `<id>` | PASS / FAIL | P0/P1 design challenges: <n> |
| evaluator Mode 4 (3C) | `docs/REVIEW-pr-<n>.md` | APPROVED / CHANGES_REQUESTED / SKIPPED | <verdict 1-line> |
| code-review:code-review (3D) | plugin | PASS / SKIPPED | <if skipped: razão> |
| /debug audit pr (Phase 4) | inline | PASS / FINDINGS / SKIPPED | D3+D8+D9 findings: <n> |
| CI checks (gh) | `gh pr checks` | PASS / PENDING / FAIL | <failing names ou "all green"> |
| receiving-code-review | per-item | implement=<n> clarify=<n> pushback=<n> | comentários PR + findings |

### Decisão
**APROVAR** | **COMENTAR** | **SOLICITAR ALTERAÇÕES**

<≤3 linhas justificando — citar dimensões críticas (auth, payment, schema) se DRIFT_RISK ≠ none>

### Comentário pronto para `gh pr review`
```
<corpo em pt-BR, ≤15 linhas>
- Lista bloqueantes referenciando `path:line`
- Pushbacks explicados quando aplicável
- Tom: consultivo, direto, parceiro (per .claude/rules/PRODUCT.md Brand Personality)
```

### Comando sugerido (NÃO execute automático — usuário decide)
```bash
# Solicitar mudanças:
gh pr review <PR#> --request-changes --body-file <(cat <<'EOF'
<corpo do comentário acima>
EOF
)

# OU comentar:
gh pr review <PR#> --comment --body-file ...

# OU aprovar (apenas se Decisão = APROVAR e usuário NÃO é o autor do PR):
gh pr review <PR#> --approve --body "<resumo positivo>"
```

### Anti-pattern reminder
- `gh pr merge --auto` é PROIBIDO no projeto (root `AGENTS.md § Branch protection`). Merge é responsabilidade humana.
- `--approve` no próprio PR também é proibido. Use `--comment` se o PR é seu.
````

---

## 7. Phase 7 — Fix loop (OPT-IN — apenas com `--fix`)

Sem `--fix`: parar em Phase 6.

Com `--fix`:

### 7.1 Lista de fixes

Filtrar findings P0/P1 com decisão `implement` (de Phase 5). Comentários PR `implement` também entram.

### 7.2 Per fix

```typescript
Skill("superpowers:test-driven-development");
// Red test antes do patch — exceto L1-L2 trivial (typo, exact-pattern anti-padrão)
```

Spawn por arquivo (regras de paralelização per `debug.md § 1.6`):

```typescript
Agent({
  description: "PR fix <finding-id>",
  subagent_type: "debugger",
  prompt: `Fix finding <id> em <path:line>.
Problema: <descrição>.
Constraint: implementar SOURCE fix, não symptom. Adicionar test de regressão. NUNCA "while I'm here" (scope creep).
Após fix: rodar gates locais antes de retornar.
Return: file:line + diff + gate output.`
});
```

| Critério | Paralelo OK | Sequencial obrigatório |
|---|---|---|
| Arquivos distintos sem cross-import | ✅ | — |
| Mesmo router/component | — | ✅ |
| Schema + código que usa schema | — | ✅ (schema primeiro) |

### 7.3 Gates per-fix (per `verify-supplements.md`)

```bash
bun run type-check
bun run lint:oxlint:check
# Test do app afetado:
cd apps/api && bun run test       # se backend
cd apps/web && bun run test       # se frontend
```

`Skill("superpowers:verification-before-completion")` enforça stdout + exit code como evidência (não diff inspection).

### 7.4 Stopping

- 2+ fixes falhos no mesmo arquivo → escalar para `codex:rescue` (direct-Bash, não subagent).
- 3+ ainda falhando → `/debug recover`.

### 7.5 Pós-fix

NUNCA:
- `git push origin main`
- `gh pr merge`
- `gh pr review --approve` no PR
- `git commit --no-verify`

Pré-commit (per `.claude/rules/commit.md`): `bunx biome check --write <files>` antes de qualquer commit. 7-gate pre-commit protocol obrigatório.

Após gates verdes: surfacear ao usuário a lista de commits sugeridos (conventional commit format). **Usuário decide push.**

---

## 8. Phase 8 — Cleanup + handoff

- Surfacear caminho do `docs/REVIEW-pr-<n>.md` para reference futura.
- Listar sessions IDs Codex (review + adversarial) para `/codex:result` se usuário quiser re-consultar.
- Não rodar `/evolve` automaticamente — `/pr-review` é review, não implementação.

---

## 9. Anti-Patterns rejeitados (referência rápida)

| Anti-pattern | Onde está documentado | Mitigação aqui |
|---|---|---|
| `Agent({subagent_type:"codex:codex-rescue"})` para review | `verify.md § 16` + `MEMORY.md` `feedback_codex_rescue_destructive` | Phase 3A usa direct-Bash via `codex-companion.mjs` |
| Auto-fix de adversarial findings | `verify.md § 9` | Phase 3B sempre presenta → STOP → user decide |
| Aprovar/mergear próprio PR | root `AGENTS.md § Branch protection` | Phase 6 + 7 nunca executam `gh pr merge` / `--approve` |
| Skip Phase 3A ou 3B | `verify.md` Iron Law | `--quick` mantém 3A+3B; só pula 3C+3D+Phase 4 |
| Placeholder dispatch (BASE_SHA vazio etc) | `verify.md § 7.5` | Phase 2 STOP se algum campo vazio |
| `code-review:code-review` substituir Mode 4 | `evaluator.md:210` | Caminhos coexistem; nenhum substitui o outro |
| Blind agreement com PR comment | `superpowers:receiving-code-review` skill | Phase 5.3 enforça implement / clarify / pushback |
| `bun test` (bare) em vez de `bun run test` | root `AGENTS.md § Project Constraints` | Phase 7.3 usa `bun run test` explícito |

---

## 10. Agent / skill matrix

| Phase | Agent | Skill | Foreground / Background |
|---|---|---|---|
| 0 — Bootstrap | — | `superpowers:using-superpowers`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `dispatching-parallel-agents`, `debugger` | — |
| 1 — Contexto gh | — | — | direct Bash |
| 2 — Bundle | — | `superpowers:requesting-code-review` (gate) | — |
| 3A — codex:review | — (slash) | — | background |
| 3B — codex:adversarial | — (slash) | — | background |
| 3C — Mode 4 | `evaluator` | — | **foreground** (output gate Phase 6) |
| 3D — plugin | — | `code-review:code-review` | — (best-effort) |
| 4 — /debug audit pr | spawned por /debug | per `debug.md § 2.8` | foreground |
| 5 — Consolidação | — | `superpowers:receiving-code-review` | — |
| 6 — Output | — | — | — |
| 7 — Fix loop | `debugger` (por finding) | `superpowers:test-driven-development`, `verification-before-completion`, `debugger` | foreground |
| Escalation | `codex:rescue` direct-Bash (NÃO subagent) | `codex:rescue` | foreground |

---

## 11. Modos — matriz de comportamento

| Phase | full (default) | `--quick` | `--branch` (sem PR) | `--fix` add-on |
|---|---|---|---|---|
| 0 Bootstrap + pre-flight | YES | YES | YES (skip branch consistency) | YES |
| 1 gh PR context | YES | YES | git-only | YES |
| 2 Bundle Phase 5.0 | YES | YES | YES | YES |
| 3A `/codex:review` (Iron Law) | **YES** | **YES** | **YES** | YES |
| 3B `/codex:adversarial` (Iron Law) | **YES** | **YES** | **YES** | YES |
| 3C evaluator Mode 4 | YES | SKIP | YES | YES |
| 3D `code-review:code-review` | YES | SKIP | YES | YES |
| 4 `/debug audit pr` | YES (skip if `--no-debug`) | SKIP | YES (limited — no PR meta) | YES |
| 5 Consolidação | YES | YES | YES (sem PR comments) | YES |
| 6 Output | YES | YES | YES (seção comentários N/A) | YES |
| 7 Fix loop | NO | NO | NO | **YES** |
| 8 Cleanup | YES | YES | YES | YES |

---

## 12. Output guarantees

- Saída em pt-BR (per `.claude/config.json` `project.locale = pt-BR`).
- Tom per `.claude/rules/PRODUCT.md § Brand Personality`: consultivo, direto, parceiro.
- Nunca afirma APROVAR sem ter rodado 3A + 3B + (3C ou 4) com PASS.
- Nunca esconde drift: scope drift em auth/payment/PII/schema/env/ci é explicitado mesmo se decisão for APROVAR.
- Verdict matrix sempre completa — célula SKIPPED nunca vira PASS implícito.
- Comentário GitHub é proposta — comando `gh pr review` é mostrado mas **não executado**.
