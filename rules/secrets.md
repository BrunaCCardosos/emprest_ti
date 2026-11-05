# Segredos e configuração

> Leitor: agente.

## Quando

Ao trabalhar em arquivos `.env*`, autenticação, configuração ou código entregue ao navegador.

- No navegador, use somente valores projetados para acesso público, como a URL do projeto Supabase e a chave publicável. Credenciais de banco e a chave de serviço ficam no servidor.
- Mantenha valores sensíveis fora do Git, de logs e de exemplos. Ao documentar uma variável, registre seu nome e propósito, use um valor fictício no exemplo e valide a presença no ponto de uso.
- Antes de adicionar uma variável, verifique onde ela é lida e se o build a inclui no código do navegador. As restrições de arquitetura em `restrictions.md` também se aplicam.
