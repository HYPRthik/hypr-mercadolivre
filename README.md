# Mercado Livre × HYPR — Consolidado de Campanhas

Dashboard single-file. Todo o conteúdo (HTML + CSS + JS + dados + criativos)
vive em **`index.html`**. Não há build, bundler, framework nem backend — editar
é abrir o arquivo, mexer no objeto `DATA`, salvar e commitar.

## Estado

Nada é inventado: nenhum número aparece no dashboard sem estar no `DATA`.

| Seção | Rota | Estado |
|---|---|---|
| Consolidado Geral | `consolidado` | 6 flights |
| Campanhas Ativadas | `campanhas` | 6 flights |
| Audiências | `audiencias` | 47 segmentos em 10 categorias |
| Central de Criativos | `criativos` | 21 peças (15 estáticas + 6 vídeos) |
| Brand-Lift | `brandlift` | 15 surveys |
| Hub de Materiais | `materiais` | 6 pós-vendas (PDF no Drive) |

Todas as campanhas carregadas: Dia do Consumidor (PI 001/2026), Same Day (002),
Copa do Mundo (003), 7.7 (004), DDP + 8.8 (005) e DDP Contextual (008).

Nada pendente: relatórios, pós-vendas, criativos e a logo oficial já estão no
dashboard.

## Consolidado: as três visões da tabela geral

O budget de display sozinho não é o que o cliente investiu — no PI o vídeo
tem budget próprio, e o `Total Investido` do resumo é a soma dos dois. Por
isso a tabela geral tem um alternador (`tabView`, em `consTable()`):

| Visão | Colunas | Para quê |
|---|---|---|
| **Total** (padrão) | Budget total · Display · Vídeo · Impressões · Views 100% · Cliques | Quanto entrou em cada campanha e o que saiu de entrega |
| Display | Budget display · Impressões · Cliques · CTR · CPC · CPM ef. · Rentab. | Performance de display |
| Vídeo | Budget vídeo · Views 100% · Cliques · VTR · CPCV ef. · Rentab. CPCV | Performance de vídeo |

Cada visão fecha em si mesma: as taxas de display derivam do budget de
display e as de vídeo do de vídeo. Um CPM calculado sobre budget somado não
reconcilia com nada — foi por isso que a coluna virou três visões em vez de
uma coluna só com a soma. O alternador só aparece se algum flight tiver
`video: true`; sem vídeo a tabela cai direto na visão Display.

O `budgetTotal(f)` respeita `CFG.videoBudgetSeparado`: se o vídeo não tiver
budget próprio no PI, a soma não acontece.

## Brand-Lift: como ler os pós-vendas

Os números de survey vêm dos PDFs de pós-venda, não dos resumos. O gráfico é de
barras horizontais, então a posição x de cada percentual reflete o tamanho da
barra, não a coluna — quem separa exposto de controle é a posição vertical.

⚠️ **A ordem vertical não é a mesma em todos os decks.** Em 7.7, Copa do Mundo e
Same Day a barra de cima é o exposto; em DDP + 8.8 e DDP Contextual é o
controle. Nunca deduza pela posição: use as duas conferências abaixo, que
juntas determinam a atribuição sem ambiguidade.

```
Σ exposto  ≈ 100%   e   Σ controle ≈ 100%
lift em p.p. e em % da resposta principal == valores impressos no pós-venda
```

A resposta que ancora o lift muda: normalmente é uma só ("Sim", "Mercado Livre",
"Muito provável"), mas na Intenção do DDP + 8.8 é a soma dos dois primeiros
níveis ("Muito provável + Provável"). O campo `head` de cada survey guarda qual
resposta ancora e os dois valores publicados, e é isso que o card exibe — o
dashboard mostra o número do pós-venda, não um recálculo.

**Survey também é feature.** Cada campanha com pesquisa tem um registro em
`features[]` com `feat: "Survey"`, sem `vi`/`clicks` (não há impressão de
survey) e com dois campos próprios: `surveys` (quantas ondas rodaram) e
`lift_max` (o maior lift em p.p. entre elas). O card agregado soma `surveys`,
tira o máximo de `lift_max` e leva para a seção Brand-Lift. Ao incluir uma
campanha nova, gere esses dois campos a partir de `DATA.brandlift` em vez de
digitá-los — assim eles não podem divergir dos cards de survey.

Também vale para a extração: `pdfplumber` quebra alguns rótulos em caracteres
soltos (o "6,9%" de "Pouco provável"), e nas páginas com duas pesquisas lado a
lado (DDP + 8.8, DDP Contextual) o texto das duas se entrelaça — nesses casos
separe pela coordenada x. No Dia do Consumidor os percentuais estão dentro de
uma imagem, sem camada de texto; foi preciso renderizar a página.

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
  precisão cheia; só a exibição arredonda. Vale igual para o vídeo: o CPCV
  efetivo publicado (R$ 0,25) leva a 30,56% onde o resumo diz 30,59% — derive
  de `v_budget / v_views`.
- **O bloco AUDIENCES muda de formato entre relatórios.** Três variações vistas:
  uma coluna extra de *Custo Efetivo* (Dia do Consumidor), uma de *VTR*
  (Same Day), ou uma coluna *Estratégia* à esquerda agrupando os segmentos em
  blocos com subtotais (DDP Contextual — Contextual / Downloaded Apps / O2O).
  No caso agrupado, o `Total geral` fica na coluna de Estratégia, não na de
  Audiência; um parser que só procure na coluna de Audiência atravessa a tabela
  e invade o bloco de performance diária.
- **Segunda tabela de audiências, só de vídeo**, à direita da de display, com
  views completos e VTR. Quatro capabilities aparecem nas duas (Downloaded Apps,
  OOH, Topics e CTV) — funda display e vídeo no mesmo registro de feature, senão
  os cliques de display entram duas vezes. CTV só existe na tabela de vídeo.
  Cuidado ao localizá-la: `viewable_100%_complete` também é coluna dos blocos
  Ad Size e Daily, então ancore a busca entre `AUDIENCES` e `DAILY`.
- **Tabelas extras não modeladas**, disponíveis se quiserem virar seção:
  *Praça* com share por região (Same Day), *Ad Size Performance* e
  *Daily Performance* (todas as campanhas).

## Audiências: categorias e ativação no tempo

O resumo do ML nomeia o mesmo público de um jeito diferente a cada campanha
— `Home Appliance` e `Eletrodomésticos`, `Tech` e `Tecnologia`, `Beauty` e
`Higiene & Beleza`. Lendo segmento por segmento não dá para ver que é o
mesmo tema voltando, e é isso que a agregação por categoria resolve.

O mapa fica em `AUD_CATS`, no `<script>`:

```js
{cat:"Casa & Eletrodomésticos", ic:"🏠", segs:["Home Appliance","Eletrodomésticos"]}
```

Duas regras:

- **Capability não entra no mapa.** Segmento cujo nome bate com um
  `features[].feat` cai automaticamente na categoria `Feature` — se o nome
  fosse repetido em `AUD_CATS`, as duas listas divergiriam na primeira
  campanha nova. É `audCatOf()` quem decide, nessa ordem.
- **Segmento sem categoria cai em `Outros`.** A categoria existe como rede
  de segurança e deve ficar vazia: se ela aparecer no dashboard, é um
  segmento novo que falta mapear em `AUD_CATS`.

Ao incluir uma campanha, confira que a agregação continua fechando — os
segmentos particionam a entrega, então:

```
Σ categorias.vi     = Σ audiences.vi     = impressões de display do portfólio
Σ categorias.clicks = Σ audiences.clicks
```

O card de cada categoria abre mostrando os segmentos que entram nela, com o
mesmo segmento fundido entre campanhas (`Perfumaria` aparece duas vezes só
no DDP Contextual, em Contextual e O2O). No card de `Feature` o que abre são
as capabilities.

A matriz **Ativação no tempo** cruza categoria × campanha na ordem
cronológica de início do flight, lida do campo `periodo` por `flightStart()`
— e não do campo `mes`, que agrupa Same Day, Copa do Mundo e 7.7 no mesmo
"Junho". A intensidade da barra é relativa à maior célula da matriz inteira,
não ao total da linha: o que interessa é comparar volume entre campanhas.

⚠️ `flightStart()` lê o ano só do fim do período (`23/02–15/03/2026`).
Nenhum flight atravessa a virada de ano até aqui; quando atravessar, o
início vai precisar do ano próprio.

A seção **Pontos de atenção & inconsistências** saiu do Consolidado a pedido
do cliente. O `DATA.inconsistencias` continua no arquivo — é a memória de
como cada resumo foi lido — e para religar basta um painel que percorra a
lista.

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
DATA.inconsistencias // notas de transparência (não exibidas nesta versão)
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

`BRAND.logo` carrega o lockup horizontal oficial como `data:` URI (o original
está em `brand/Mercado-Livre-logo.png`, junto das outras versões enviadas).
Topbar e capa consomem o mesmo campo; se ele for `null`, cai num wordmark
tipográfico.

O wordmark do ML é `#181878` sobre fundo transparente — ilegível no fundo
`#08080F` do dashboard. Por isso a logo vai dentro de `.ml-chip`, um bloco
branco arredondado. Trocar o arquivo por uma versão monocromática clara
resolveria sem o chip, mas descaracterizaria a marca; o chip é o padrão do
próprio ML em fundo escuro.

Reduza a imagem antes de embutir (1200 px de largura basta para o uso em tela e
mantém o `data:` URI em ~160 kB):

```bash
python3 -c "from PIL import Image; im=Image.open('brand/Mercado-Livre-logo.png'); \
im.resize((1200,334), Image.LANCZOS).save('/tmp/logo.png', optimize=True)"
```

## Criativos

| Tipo | Como entra |
|---|---|
| Imagem (JPG/PNG/GIF) | `data:` URI base64 no `DATA` |
| Vídeo (MP4, H.264/AAC) | arquivo em `videos/` + caminho `/videos/x.mp4` |
| Interativo | URL de **embed** em `<iframe>` |

### Capa da campanha

`firstCreativeFor()` escolhe a miniatura do card da campanha, e a caixa é
horizontal (~2,3:1): uma peça em pé entra cortada numa tira central e não dá
para reconhecer o criativo. A ordem de preferência é 970×250 → 728×90 →
qualquer estática com proporção ≥ 1,6 → o resto.

Campanha **só de vídeo** não tem estática nenhuma para oferecer. Para essas,
o criativo de vídeo ganha um campo `cover`: um quadro já recortado na
horizontal, separado do `poster` (que segue a proporção da peça e alimenta o
player). Foi o que resolveu o Same Day, cujo vídeo é vertical — o `poster`
entrava cortado no meio.

Escolha o quadro pelo conteúdo, não pelo brilho: o mais claro de um vídeo do
ML costuma ser o cartão final chapado, que tem 100% de amarelo e nenhuma
informação. Um quadro com a marca visível **e** conteúdo é o que funciona em
128 px de altura.

```bash
ffmpeg -ss 25 -i videos/ddp-8-8-3.mp4 -frames:v 1 \
  -vf "crop=iw:iw/2.3,scale='min(920,iw)':-2" -q:v 5 cover.jpg
```

Vídeo novo: remuxe com faststart antes de commitar, senão o navegador precisa
de uma requisição extra no fim do arquivo antes de conseguir tocar.

```bash
ffmpeg -i entrada.mp4 -c copy -movflags +faststart saida.mp4   # sem recodificar
```

Extraia também um quadro para servir de capa — é o que evita a campanha só de
vídeo cair no placeholder, já que `firstCreativeFor` procura imagem primeiro:

```bash
ffmpeg -ss 2 -i video.mp4 -frames:v 1 -vf "scale='min(640,iw)':-2" -q:v 5 capa.jpg
```

Grave o resultado no campo `poster` do criativo. Use nomes ASCII sem espaço nem
acento: além do escape na URL, o acento vem em forma decomposta no macOS e
renomear por literal falha.

⚠️ **Preview de DSP não substitui o arquivo.** O link de preview do DV360 exige
login na conta do anunciante e manda `X-Frame-Options`, então não embuta: quem
abrir o dashboard sem estar autenticado vê tela de login, não o criativo.

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
