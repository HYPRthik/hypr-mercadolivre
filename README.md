# Mercado Livre × HYPR — Consolidado de Campanhas

Dashboard single-file. Todo o conteúdo (HTML + CSS + JS + dados + criativos)
vive em **`index.html`**. Não há build, bundler, framework nem backend — editar
é abrir o arquivo, mexer no objeto `DATA`, salvar e commitar.

## Estado — V1

Estrutura completa, **sem dados**. Todas as seções existem e mostram um estado
vazio explícito até serem preenchidas. Nada foi inventado: nenhum número
aparece no dashboard sem estar no `DATA`.

| Seção | Rota | Estado |
|---|---|---|
| Consolidado Geral | `consolidado` | pronta · aguardando flights |
| Campanhas Ativadas | `campanhas` | pronta · aguardando flights |
| Audiências | `audiencias` | pronta · aguardando segmentos |
| Central de Criativos | `criativos` | pronta · aguardando peças |
| Brand-Lift | `brandlift` | pronta · aguardando surveys |
| Hub de Materiais | `materiais` | pronta · aguardando pós-vendas |

Sem gate de e-mail e sem telemetria nesta versão (decisão do cliente). Para
religar, reintroduzir `#email-gate` + `initGate/submitGate` e um Apps Script
**próprio do Mercado Livre** — nunca reaproveitar o de outro cliente.

## Como preencher

Tudo sai de um lugar só: `const DATA = {...}` no `<script>` do `index.html`.

```js
DATA.flights    // 1 objeto por entrega de campanha num período
DATA.features   // capabilities HYPR ativadas em cada flight
DATA.audiences  // segmentos/categorias entregues (seção própria)
DATA.creatives  // peças veiculadas
DATA.brandlift  // ondas de survey
DATA.materiais  // pós-vendas, estudos, audience discovery (Google Slides)
DATA.totals     // sobrescreve o consolidado calculado (deixe {} para derivar)
DATA.inconsistencias // notas de transparência
```

O template de coleta (`TEMPLATEnovacampanha.xlsx`) mapeia 1:1 nos campos de
`flights[]` e `features[]`.

### Contadores são derivados

Os "big numbers" da capa, o `TOTAL — Portfólio (N flights)`, os subtítulos das
seções e os contadores de criativos/features são **calculados a partir do
`DATA`** — não existe número fixo no HTML. Adicionar um flight não exige
atualizar texto em lugar nenhum.

### Consolidação

`computeTotals()` soma direto dos flights enquanto `DATA.totals` estiver vazio —
correto porque a base parte do zero. Assim que houver ajuste histórico
(bonificadas, reconciliação), grave os valores em `DATA.totals` e eles passam a
vencer o cálculo.

As taxas nunca são média de médias: o CPM efetivo, o CPC e a rentabilidade
derivam do **custo efetivo ponderado pela entrega**
(`Σ cpm_ef × impr / 1000`). O CPCV consolidado é ponderado por views completos.

### Configuração pendente

Em `CFG`, no topo do `<script>`:

```js
cpmNegPadrao: null,        // CPM negociado contratado → habilita a rentabilidade agregada
cpcvNegPadrao: null,       // CPCV negociado contratado
videoBudgetSeparado: false // true se o budget de vídeo é separado do display
```

Com `cpmNegPadrao: null` o dashboard simplesmente **não exibe** rentabilidade
agregada, em vez de mostrar um número derivado de premissa não confirmada.

### Marca

`BRAND.logo` está `null` e o topo usa um wordmark tipográfico provisório.
Assim que o arquivo oficial da logo chegar, basta preencher `BRAND.logo` com um
`data:` URI — topbar e capa passam a usá-lo automaticamente.

## Criativos

| Tipo | Como entra |
|---|---|
| Imagem (JPG/PNG/GIF) | `data:` URI base64 no `DATA` |
| Vídeo (MP4, H.264/AAC) | arquivo em `videos/` + caminho `/videos/x.mp4` |
| Interativo | URL de **embed** em `<iframe>` |

Acima de ~1 MB, hospede em vez de embutir. O card de preview só baixa o vídeo
quando o usuário clica.

⚠️ **A ordem das rotas do `vercel.json` importa.** O catch-all
`/(.*) → /index.html` engole qualquer asset; toda pasta nova de assets precisa
de rota **antes** dele.

## Validação

```bash
node validate.js   # Playwright + Chromium headless
```

Sempre conferir: big numbers da capa · contagens dos filtros · capa de cada
campanha nova · nº de criativos no detalhe · "N flights" no consolidado ·
ausência de `pageerror` novo.

Ruído esperado no ambiente headless (não é bug): `ERR_TUNNEL_CONNECTION_FAILED`
nas fontes e no Chart.js (CDN bloqueado pelo proxy) e ausência de codec H.264
para `<video>` — validar que o `.mp4` responde 200 e confiar no navegador real.
