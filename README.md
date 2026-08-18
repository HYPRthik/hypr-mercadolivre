# Mercado Livre × HYPR — Consolidado de Campanhas

Dashboard single-file. Todo o conteúdo (HTML + CSS + JS + dados + criativos)
vive em **`index.html`**. Não há build, bundler, framework nem backend — editar
é abrir o arquivo, mexer no objeto `DATA`, salvar e commitar.

## Estado

Nada é inventado: nenhum número aparece no dashboard sem estar no `DATA`.

| Seção | Rota | Estado |
|---|---|---|
| Consolidado Geral | `consolidado` | 1 flight (Dia do Consumidor) |
| Campanhas Ativadas | `campanhas` | 1 flight |
| Audiências | `audiencias` | 7 segmentos |
| Central de Criativos | `criativos` | pronta · aguardando peças |
| Brand-Lift | `brandlift` | pronta · aguardando surveys |
| Hub de Materiais | `materiais` | pronta · aguardando pós-vendas |

Sem gate de e-mail e sem telemetria nesta versão (decisão do cliente). Para
religar, reintroduzir `#email-gate` + `initGate/submitGate` e um Apps Script
**próprio do Mercado Livre** — nunca reaproveitar o de outro cliente.

## Como ler o resumo de campanha do ML

O resumo é um export de Google Sheets. Mapeamento verificado contra
`Dia do Consumidor` — todos os campos abaixo fecham na conferência.

| Bloco do resumo | Campo no `DATA` |
|---|---|
| Cabeçalho · `PI` | `code` (é a chave única do flight; `CFG.codeLabel = "PI"`) |
| Cabeçalho · `Campanha` | `camp` |
| Cabeçalho · `Total Investido` | confere com `budget + v_budget` |
| DISPLAY · `Data de Início` / `Data Final` | `periodo` |
| DISPLAY · `Budget Contratado` | `budget` |
| DISPLAY · `CPM Negociado` | `cpm_neg` (14,40 fixo) |
| DISPLAY · `Impressões Visíveis Negociadas` | `impr_neg` |
| MAIN RESULTS · `Custo Efetivo` | `custo_ef` |
| MAIN RESULTS · `CPM Efetivo` | `cpm_ef` |
| MAIN RESULTS · `Impressões Visíveis Entregues` | `impr` — **sempre viewable** |
| MAIN RESULTS · `Clicks` / `CTR` / `CPC` | `clicks` / `ctr` / `cpc` |
| OTHER METRICS · `Custo Efetivo + Over` | `custo_over` |
| OTHER METRICS · `Rentabilidade do CPM` | `rentab` |
| OTHER METRICS · `Pacing` / `Alcance (D-1)` / `Frequência (D-1)` | `pacing` / `alcance` / `frequencia` |
| VIDEO PERFORMANCE | campos `v_*`, só se houver entrega real |
| AUDIENCES | `audiences[]` (`aud`, `vi`, `clicks`, `ctr`, `custo_ef`) |
| PDOOH | `features[]` tipo PDOOH, campo `plays` |
| AD SIZE · DAILY · RMN · GOOGLE ANALYTICS | não exibidos nesta versão |

### Identidades que devem fechar sempre

Use como conferência ao incluir um flight novo:

```
custo_over        = impr × cpm_neg / 1000     ← não é gasto do cliente
cpm_ef            = custo_ef / impr × 1000
rentab            = (cpm_neg − cpm_ef) / cpm_neg   ← com cpm_ef SEM arredondar
ctr               = clicks / impr             ← sobre viewable, não impressions
pacing            = impr / impr_neg
Σ audiences.vi    = impr                      ← os segmentos particionam a entrega
Σ audiences.custo_ef = custo_ef
```

### Armadilhas observadas

- **Bloco de vídeo zerado.** Quando `Formatos Ativados` não inclui vídeo, o
  bloco VIDEO PERFORMANCE ainda vem preenchido com zeros e produz lixo:
  `VTR = #DIV/0!` e `Rentabilidade do CPCV = 100,00%`. Marque `video: false` e
  ignore o bloco inteiro.
- **RMN com período herdado do template**, que não corresponde à campanha.
- **Segmento que também é capability** (Downloaded Apps, Attention Ad): vem
  dentro do bloco AUDIENCES. Mantenha em `audiences[]` para a partição fechar
  e repita em `features[]` — features são recorte e não somam ao portfólio,
  então não há dupla contagem.
- **Arredondamento.** Derivar a rentabilidade do CPM já arredondado em 2 casas
  dá 22,99% onde o resumo diz 22,97%. Guarde `custo_ef` e deixe o cálculo em
  precisão cheia; só a exibição arredonda.

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
derivam do **custo efetivo do portfólio** — `Σ custo_ef`, usando o valor do
resumo quando existe e caindo para `cpm_ef × impr / 1000` só quando não existe.
O CPCV consolidado é ponderado por views completos.

O cálculo roda em precisão cheia; só a exibição arredonda.

### Configuração

Em `CFG`, no topo do `<script>`:

```js
cpmNegPadrao: 14.40,       // CPM negociado contratado (display)
cpcvNegPadrao: 0.36,       // CPCV negociado contratado (vídeo)
videoBudgetSeparado: true  // display e vídeo têm budgets separados no PI;
                           // a soma dos dois é o "Total Investido" do resumo
```

Se `cpmNegPadrao` for `null`, o dashboard **não exibe** rentabilidade agregada
em vez de mostrar número derivado de premissa não confirmada.

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
