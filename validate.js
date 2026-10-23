/**
 * Validação do dashboard em navegador headless.
 *
 *   node validate.js            → checa estrutura, navegação e erros de JS
 *   node validate.js --shots    → também grava screenshots em ./.shots/
 *
 * Requer Playwright + Chromium, e não fixa o caminho de nenhum dos dois: o
 * binário muda de lugar a cada atualização (chromium-1194/chrome-linux virou
 * chromium-1243/chrome-linux64 de um container para o outro) e o script
 * quebrava com "executable doesn't exist". O módulo é resolvido pelo node e o
 * browser pelo próprio Playwright, via PLAYWRIGHT_BROWSERS_PATH.
 *
 * Para apontar manualmente:  PW=/caminho/do/modulo  CHROME=/caminho/do/chrome
 */
const path = require("path");
const fs = require("fs");

const SHOTS = process.argv.includes("--shots");

function carregaPlaywright(){
  const tentativas = [process.env.PW, "playwright",
                      "/opt/node22/lib/node_modules/playwright"].filter(Boolean);
  const erros = [];
  for(const p of tentativas){
    try { return require(p); } catch(e){ erros.push(`  ${p}: ${e.code || e.message}`); }
  }
  console.error("Playwright não encontrado. Tentativas:\n" + erros.join("\n") +
    "\nInstale com `npm i playwright` ou aponte PW=/caminho/do/modulo.");
  process.exit(2);
}
const { chromium } = carregaPlaywright();

/* rede de segurança: se o Playwright não resolver o browser (cache movido,
   instalação parcial), procura o chromium de maior versão no diretório de
   browsers — os dois layouts de pasta já vistos estão cobertos */
function achaChromium(){
  const raiz = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if(!fs.existsSync(raiz)) return null;
  const dirs = fs.readdirSync(raiz)
    .filter(d => /^chromium-\d+$/.test(d))
    .sort((a,b) => Number(b.slice(9)) - Number(a.slice(9)));
  for(const d of dirs){
    for(const sub of ["chrome-linux64/chrome", "chrome-linux/chrome"]){
      const exe = path.join(raiz, d, sub);
      if(fs.existsSync(exe)) return exe;
    }
  }
  return null;
}

async function abreBrowser(){
  if(process.env.CHROME) return chromium.launch({ executablePath: process.env.CHROME });
  try { return await chromium.launch(); }
  catch(e){
    const exe = achaChromium();
    if(!exe) throw e;
    console.log(`  (Playwright não resolveu o browser; usando ${exe})`);
    return chromium.launch({ executablePath: exe });
  }
}

const SECOES = ["consolidado", "campanhas", "audiencias", "criativos", "brandlift", "materiais"];

(async () => {
  const browser = await abreBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  const errs = [], consoleErrs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error") consoleErrs.push(m.text().slice(0, 140)); });

  await page.goto("file://" + path.resolve(__dirname, "index.html"), { waitUntil: "load" });
  await page.waitForTimeout(700);

  const r = await page.evaluate(secoes => ({
    title: document.title,
    logoHypr: (() => { const i = document.getElementById("tb-hypr");
      return i && i.complete && i.naturalWidth > 0 ? `${i.naturalWidth}x${i.naturalHeight}` : "FALHOU"; })(),
    logoMlOficial: !!BRAND.logo,
    bigNums: [...document.querySelectorAll("#bignums .bn")]
      .map(b => `${b.querySelector(".bn-v").textContent} · ${b.querySelector(".bn-l").textContent}`),
    navBoxes: document.querySelectorAll("#navgrid .navbox").length,
    aguardandoDados: document.querySelectorAll("#navgrid .navbox-badge").length,
    dataCounts: {
      flights: DATA.flights.length, features: DATA.features.length,
      audiences: DATA.audiences.length, creatives: DATA.creatives.length,
      brandlift: DATA.brandlift.length,
      materiais: DATA.materiais.reduce((a, c) => a + c.items.length, 0),
    },
    totals: TOT,
    secoes: secoes.map(id => {
      const body = document.getElementById(id + "-body");
      return { id, titulo: (body.querySelector(".sec-title") || {}).textContent || null,
               vazia: !!body.querySelector(".empty") };
    }),
  }), SECOES);

  // navega por todas as seções e confirma que cada uma ativa
  const nav = [];
  for (const id of [...SECOES, "hub"]) {
    await page.evaluate(s => go(s), id);
    await page.waitForTimeout(120);
    nav.push({ id, ativa: await page.evaluate(s => document.getElementById(s).classList.contains("active"), id) });
  }

  // detalhe do primeiro flight, se houver
  let detalhe = null;
  if (r.dataCounts.flights) {
    await page.evaluate(() => go("campanhas"));
    await page.click(".campbox");
    await page.waitForTimeout(200);
    detalhe = await page.evaluate(() => ({
      titulo: document.querySelector("#campanhas-body .sec-title").textContent,
      kpis: document.querySelectorAll("#campanhas-body .kcard").length,
      criativos: document.querySelectorAll("#campanhas-body .ccard").length,
    }));
  }

  if (SHOTS) {
    const dir = path.resolve(__dirname, ".shots");
    fs.mkdirSync(dir, { recursive: true });
    for (const id of ["hub", ...SECOES]) {
      await page.evaluate(s => go(s), id);
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(250);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(dir, `${id}.png`), fullPage: true });
    }
  }

  console.log(JSON.stringify({ ...r, nav, detalhe, pageErrors: errs, consoleErrors: consoleErrs }, null, 1));
  console.log(
    errs.length ? `\n✗ ${errs.length} erro(s) de JS` : "\n✓ nenhum erro de JS",
    nav.every(n => n.ativa) ? "· navegação OK" : "· FALHA na navegação"
  );
  console.log("  (ERR_TUNNEL_CONNECTION_FAILED nas fontes/Chart.js é esperado: CDN bloqueado pelo proxy)");

  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
