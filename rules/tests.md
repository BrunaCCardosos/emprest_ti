# Testes

## Quando

Ao escrever ou executar testes ou ao reunir evidências para uma spec.

- Inclua o ID do critério de aceite no nome do teste, como `CA-02 — manutenção fica fora da disponibilidade`. Confira o resultado observável descrito na spec.
- Use dados de demonstração no protótipo. Testes que precisam de banco usam uma instância local ou descartável com destino confirmado.
- Antes de executar uma suíte que usa serviços externos, confira o ambiente efetivo. Se ele estiver ligado à produção ou o destino for incerto, registre o bloqueio e pule os comandos afetados.
- Para novos procedimentos que acessam dados por tenant, teste o acesso permitido e a tentativa de acessar dados de outro tenant.
- Registre o comando executado, o resultado e os limites da evidência. Consulte `rules/checks.md` para os comandos do projeto.
