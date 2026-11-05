# EmpresTI

Antes de alterar o projeto, leia `restrictions.md`, `rules/operacao.md` e `docs/PRD.md`. Consulte `docs/adr/001-stack.md` para decisões de arquitetura. O catálogo atual é um protótipo em HTML, CSS e JavaScript.

## Quando consultar cada regra

- Nova funcionalidade ou mudança de comportamento: `rules/spec-flow.md`.
- Variáveis de ambiente, autenticação ou configuração do cliente: `rules/secrets.md`.
- Schema, migrations ou scripts de banco: `rules/migration.md`.
- Escrita ou execução de testes: `rules/tests.md`.
- Antes de concluir uma tarefa: `rules/checks.md`.
- Ao encerrar ou passar trabalho para outra sessão: `rules/handoff.md`.

## Subagentes

- As definições ficam em `agents/<nome>.md`. O Codex carrega a versão TOML em `.codex/agents/`.
- Antes de declarar uma spec pronta ou responder a um pedido de verificação de critérios de aceite, siga `rules/spec-flow.md` e delegue ao `verificador-spec` em contexto separado. Passe o caminho da spec e o escopo da verificação no pedido.
- Se o ambiente não oferecer subagentes, abra uma sessão nova e comece com “Aja conforme `agents/verificador-spec.md`”, seguido do caminho da spec e do escopo da verificação.

## Skills

- `revisar-design-empresti` em `.agents/skills/revisar-design-empresti/SKILL.md` para revisar interfaces contra o design system do projeto.

## Ambiente

- O MCP `openaiDeveloperDocs` em `.codex/config.toml` dá acesso de leitura à documentação pública da OpenAI. Use-o para dúvidas sobre Codex e suas integrações.
