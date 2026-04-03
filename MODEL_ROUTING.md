# Model Routing — Tristan Labs

## Principe
- Review en planning: altijd Opus (fouten hier kosten 10x meer)
- Executie: schaalt mee met complexiteit
- Simpele taken: goedkoopste model dat het kan

## Complexity Labels
Issues krijgen een `complexity` label van de CEO bij delegatie:
- `complexity:low` — Config changes, docs, simpele fixes
- `complexity:medium` — Feature implementatie, refactoring
- `complexity:high` — Architectuur, cross-repo changes, subtiele bugs

## Agent → Model Matrix

| Agent | Low | Medium | High |
|-------|-----|--------|------|
| CEO (Tristan) | — | — | claude-opus-4-6 (Max) |
| Atlas (CTO) | — | claude-sonnet-4-6 (Max) | claude-opus-4-6 (Max) |
| Engineer-1 | claude-haiku-4-5 (Max) | claude-sonnet-4-6 (Max) | claude-sonnet-4-6 (Max) |
| Engineer-2 | claude-haiku-4-5 (Max) | claude-sonnet-4-6 (Max) | claude-sonnet-4-6 (Max) |
| Guardian (QA) | claude-opus-4-6 (Max) | claude-opus-4-6 (Max) | claude-opus-4-6 (Max) |
| Scout | qwen/qwen3.5-flash (OR) | google/gemini-2.5-pro (OR) | google/gemini-2.5-pro (OR) |
| Strategist | qwen/qwen3.5-flash (OR) | claude-sonnet-4-6 (Max) | claude-sonnet-4-6 (Max) |

(Max) = via CLIProxyAPI, gratis
(OR) = via OpenRouter, betaald

## Guardrails
- MAX_ITERATIONS per run: 8
- Budget alert: 85% van maandbudget
- Guardian: read-only (mag code lezen, niet schrijven)
- Kill switch: alle agents pauzeren

## Maandbudget per Agent

| Agent | Budget/mnd |
|-------|----------:|
| CEO (Tristan) | $0 (human) |
| Atlas | $15 |
| Guardian | $20 |
| Engineer-1 | $15 |
| Engineer-2 | $15 |
| Scout | $10 |
| Strategist | $5 |
| Buffer | $20 |
| **Totaal** | **$100** |
