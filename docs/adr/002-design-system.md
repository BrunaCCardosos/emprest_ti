# 002 — Design system

## 1. Tema e documentos

| Item | Escolha |
|---|---|
| Modo | Escuro único; sem alternador de tema |
| `color-scheme` | `dark` em `:root` |
| Base visual | Design system Nocturne adaptado à primária `#001449` |
| Fonte da verdade de estilo | `docs/design-system.md` |
| Especificação de tela | `docs/layout.md` (as seis telas e os fluxos) |
| Idioma e tom | pt-BR; copy seco e operacional |

- **Escuro único** — a especificação nasce escura e a primária `#001449` só funciona como fundo nesse contexto; manter dois modos dobraria a rampa de cores e daria a cada componente dois pares de valores para testar, sem ninguém ter pedido o modo claro.
- **`color-scheme: dark`** — sem ele o navegador pinta scrollbars, date pickers e demais controles nativos no claro dentro de uma tela escura.
- **Documentos separados** — `layout.md` descreve *como as telas se compõem*; `design-system.md` descreve *do que elas são feitas*. Juntos obrigariam a reler a especificação inteira para achar um token, e o ADR ficaria repetindo tabela em vez de justificar decisão.
- **Nocturne como base** — o visual já foi desenhado sobre esse sistema; recomeçar do zero só reescreveria as mesmas decisões com outros nomes.

---

## 2. Cores

| Item | Escolha |
|---|---|
| Primária de marca | `#001449` (`--accent-900`), **somente como fundo profundo**: logo, hero do login, avatares, chips ativos |
| Cor de ação visível | `#5B7FE0` (`--accent-500`) |
| Rampa da primária | `--accent-100` … `--accent-900`, derivada de `#001449`, cada passo com papel declarado |
| Superfícies | `--page` `#05070F`, `--color-bg` `#080C1A`, `--sidebar-bg` `#060A16`, `--color-surface` `#0E1530`, `--surface-sunken` `#0B1128` |
| Texto | Cinco níveis: `--color-text` → `--text-muted` → `--text-dim` → `--text-faint` → `--text-ghost` |
| Bordas | Cinco níveis: `--border-frame`, `--border-card`, `--border-soft`, `--border-row`, `--border-strong` |
| Estados | Trio texto/fundo/borda para Disponível, Emprestado, Manutenção e Atraso |
| Elevação | Anel de 1px + sombra ambiente (`--shadow-sm/md/lg`); nunca sombra pesada sozinha |
| Gradientes | Três, e só três, listados no design system §2.7 |

- **Primária só como fundo** — `#001449` sobre o fundo da aplicação (`#080C1A`) dá ≈1,1:1 de contraste: como texto ela desaparece, e como botão o rótulo dentro dela falha do mesmo jeito. Ela continua onde funciona — marca, hero do login, avatar, chip ativo.
- **Ação em `#5B7FE0`** — mesma família, mais clara: a borda do botão, a barra de progresso e o item ativo da sidebar continuam legíveis sobre qualquer superfície da tela.
- **Rampa `accent-100…900`** — hover de botão, link, borda de chip e fundo de avatar pedem luminâncias diferentes; um único "azul" não cobre essa variação, e inventar tom na hora é o que produz contraste quebrado.
- **Estados em trio** — o pill de estado aparece sobre card, linha de tabela e cabeçalho; fundo e borda em `rgba` deixam o mesmo trio legível em todas as superfícies sem criar novos hex por contexto.
- **Elevação por anel** — em fundo quase preto sombra preta não se vê; o que separa superfícies é o contorno de 1px e o fundo levemente mais claro. Sombra só entra somada ao anel, nunca no lugar dele.
- **Gradientes fechados em três** — gradiente livre em fundo escuro vira mancha; a lista curta cobre os três momentos que pedem profundidade (hero do login, faixa de aviso, prévia de imagem).

---

## 3. Tipografia

| Item | Escolha |
|---|---|
| Família | Open Sans, única para títulos e corpo |
| Pesos carregados | 400, 500, 600, 700 |
| Pesos usados | **400** (corpo) e **600** (títulos, rótulos, valores); 700 nunca em título |
| Escala | Tabela de papéis do design system §3 |
| Tracking | `-0.01em` títulos; `0.02em` marca; `0.08em`–`0.12em` rótulos uppercase |
| Mínimo absoluto | 10px, só em rótulo uppercase de agrupamento |

- **Família única** — título e corpo na mesma métrica mantêm a densidade previsível; duas famílias dobram a escala, porque cada uma tem altura de linha própria.
- **600 em vez de 700** — em fundo escuro o peso 700 "acende" o título e passa a competir com o número de destaque; 600 já separa título de corpo sem gritar.
- **Escala por papel** — cada tipo de elemento tem tamanho, peso e cor fixos; a variação vem do layout da tela, não de um `h1` reinventado a cada página.

---

## 4. Ícones e imagens

| Item | Escolha |
|---|---|
| Biblioteca | Phosphor Icons |
| Pesos | *regular* como padrão; *fill* apenas no item ativo da sidebar |
| Tamanhos | 12px a 64px conforme o papel (design system §5.11) |
| Fotografia | Nenhuma; a área de imagem é gradiente radial + ícone do item |

- **Phosphor** — o traço regular tem a mesma leveza das bordas de 1px; um ícone mais "gordo" pesaria mais que o card onde ele cabe.
- **`fill` só como seleção** — o peso cheio marca o item ativo da sidebar; usado em outro lugar ele passaria a significar "importante" e a sinalização perde valor.
- **Sem fotografia** — o produto lida com patrimônio, não com vitrine; foto de banco introduziria cor e luz fora da paleta.
- **Mesma biblioteca no protótipo e no app** — dois desenhos de ícone para a mesma ação é divergência garantida entre `docs/` e o código.

---

## 5. Estilização e componentes

| Item | Escolha |
|---|---|
| Estilização | Tailwind CSS (decisão do ADR 001), com os tokens como variáveis CSS |
| Componentes | shadcn/ui copiados para o repositório e remapeados para os tokens |
| Botão primário | Contornado: `1px solid #5B7FE0`, fundo transparente, texto `#B4C6F6` 600 |
| Variantes de botão | Primário, confirmação, secundário, linha, linha em atraso (design system §5.1) |
| Layout | `flex`/`grid` + `gap` em todos os grupos de irmãos; nunca margem por elemento |
| Foco | `outline:2px solid #5B7FE0; outline-offset:2px`, sem transição |
| Movimento | 80–240ms, `ease-out`; `prefers-reduced-motion` desliga `transform` e `opacity` |
| Raios | Escala 7–14px; `99px` para pills, avatares e barras (design system §4.2) |

- **Contornado como padrão** — preencher o botão com `#5B7FE0` transforma a cor de ação em área grande de brilho e quebra a assinatura do Nocturne; a borda de 1px com fundo transparente sinaliza a mesma ação com muito menos massa visual.
- **shadcn/ui copiado** — já é a decisão do ADR 001; aqui se fixa o efeito: as cinco variantes da tabela do design system §5.1 viram variantes do componente `Button`, não classes soltas no JSX.
- **`gap`, não margem** — margem por elemento obriga a manter dois valores de espaçamento (o do layout e o do componente); com a escala densa 0.7× isso vira divergência visual em poucas telas.
- **Foco idêntico em todo controle** — mesmo ring no botão, no chip, no input e no link; controle sem foco visível é inalcançável por teclado.
- **Movimento curto** — a animação confirma a ação do usuário, não decora a tela; acima de 240ms a interface começa a parecer lenta.

---

## 6. Contrato entre documentos

| Documento | Papel |
|---|---|
| `docs/design-system.md` | Fonte única de tokens, componentes e regras de estilo |
| `docs/layout.md` | Composição das seis telas, fluxos e regras visíveis |
| `docs/adr/001-stack.md` | Stack que implementa o design system (Next.js, Tailwind, shadcn/ui) |
| `docs/adr/002-design-system.md` | Este ADR: o que se decidiu e o que ficou de fora |
| `docs/index.html` + `docs/style.css` | Protótipo estático que valida os mesmos tokens |

- **Design system manda em token** — quando protótipo, ADR e componentes divergirem, vale o valor escrito em `docs/design-system.md`.
- **Layout manda em composição** — a dúvida "onde esse bloco entra" não se resolve neste ADR; a resposta está em `docs/layout.md`.
- **Protótipo como prova** — ele consome os mesmos tokens; divergência entre `style.css` e o design system é bug de documento, não decisão nova.

---

## Alternativas descartadas

| Alternativa | Motivo do descarte |
|---|---|
| Modo claro ou alternador de tema | Dobraria a rampa de cores e daria a cada componente dois pares de valores; a especificação nasce escura e ninguém pediu o claro |
| `#001449` como texto, borda de ação ou fundo de botão | Cerca de 1,1:1 contra `#080C1A` — praticamente invisível; ela só funciona como fundo profundo |
| Botão primário preenchido com cor sólida | Quebra o princípio da ação contornada e vira área grande de brilho em tela escura |
| Sombra pesada como única elevação | Sombra preta não aparece sobre fundo quase preto; a separação de superfícies depende do anel de 1px |
| Gradientes além dos três permitidos | Em fundo escuro qualquer banding aparece; a lista fechada cobre os três usos reais |
| Biblioteca de componentes pronta (MUI, Mantine) | O visual Nocturne teria que ser imposto por cima do padrão da biblioteca — mesmo motivo do ADR 001, pelo lado visual |
| Família do sistema ou mais de uma família | A escala foi calibrada na métrica da Open Sans; trocar muda alturas de linha e quebra a densidade 0.7× |
| Ícones emoji ou SVG avulso | Emoji é proibido pela especificação; desenhar SVG à mão duplica uma biblioteca que já cobre o mapeamento |
| Cores escritas direto no componente | Sem token não há troca de tom nem revisão de contraste em um lugar só |

---

## Consequências

### Fica mais fácil

- Trocar o tom da aplicação inteira em um arquivo de variáveis, sem vasculhar componentes.
- Revisar contraste: cada cor tem papel declarado — se o uso não está na tabela, o uso está errado.
- Onboarding: componente novo nasce correto seguindo a tabela de variantes, sem decisão estética por PR.
- Evolução do shadcn/ui: a base pode ser atualizada porque o visual mora nos tokens, não dentro do componente copiado.
- Comparação com o protótipo: `docs/` e app consomem os mesmos nomes de token, então divergência é detectável comparando valores.

### Fica mais difícil

- Adicionar modo claro depois: exige uma segunda rampa completa e revisão componente a componente — não é um toggle.
- Escala densa 0.7× e raios quebrados (7, 9, 10, 11, 12, 14px): improviso de espaçamento ou raio destoa imediatamente; a tabela é obrigatória.
- Estados fora da tabela (hover de um botão novo, foco exótico) viram decisão local — precisam ser levados de volta ao design system.
- Movimento restrito a 240ms e gradientes fechados em três: feedback mais chamativo precisa ser negociado, não implementado por conta.

### O que isso impede de fazer depois sem custo

- Modo claro, rebranding ou troca de paleta sem refazer a rampa `accent` inteira.
- Trocar a tipografia: a escala de tamanhos foi calibrada na métrica da Open Sans.
- Usar fotografia de equipamento, emoji ou gradiente livre sem quebrar a assinatura visual.
- Página impressa ou relatório em claro: todo o sistema é desenhado para fundo escuro e não tem variante de impressão.

### Limites do protótipo

- `docs/index.html` é HTML estático com âncoras (`#s1`…`#s6`); ele prova tokens e componentes, mas não é o app — o app é o Next.js do ADR 001.
- O protótipo carrega fonte e ícones por CDN; o app depende das mesmas bibliotecas instaladas no repositório.

---

## O que este ADR não decide

- Composição das telas, dimensões de moldura e fluxos (`docs/layout.md`).
- Regras de negócio — limite de 3 itens, prazo de 14 dias, bloqueio por atraso (`docs/PRD.md`).
- Mapeamento exato dos tokens no Tailwind (v3 ou v4) e a estrutura de pastas de componentes.
- Responsividade abaixo de 1440px — só existem molduras desktop na especificação.
- Auditoria formal de acessibilidade (WCAG) e teste automatizado de contraste.
- Textos definitivos da interface além do tom definido na seção 9 do design system.
- Desenho do símbolo da marca.
- Componentes ainda não desenhados (toast, tooltip, menu suspenso, confirmação de exclusão).