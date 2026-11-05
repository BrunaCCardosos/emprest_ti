# Fluxo de specs

## Nova funcionalidade ou mudança de comportamento

1. Crie ou atualize a pasta `docs/specs/<NNN-nome>/` da funcionalidade. Use o próximo número disponível para uma spec nova e preserve o identificador das specs existentes.
2. Em `spec.md`, descreva objetivo, escopo e critérios de aceite testáveis com IDs `CA-01`, `CA-02` e assim por diante. Resolva dúvidas de comportamento que afetem a implementação.
3. Em `plan.md`, registre como implementar e verificar a spec dentro das decisões dos ADRs.
4. Em `tasks.md`, divida o plano em etapas verificáveis, associe cada etapa aos critérios relevantes e registre o progresso. Implemente e confira uma etapa por vez.

## Antes de declarar uma spec pronta

1. Delegue ao `verificador-spec` em contexto separado. Informe o caminho `docs/specs/<NNN-nome>/spec.md` e o intervalo de commits, os arquivos alterados ou toda a implementação da spec quando não houver um recorte menor. Inclua as alterações locais pertinentes no escopo.
2. Aguarde o relatório. Declare a spec pronta somente com `Veredito: PRONTA`.
3. Se o veredito for `NÃO PRONTA`, devolva os pontos pendentes às tarefas. O agente principal coordena as correções e solicita nova verificação em contexto separado. O verificador atua somente na conferência.
