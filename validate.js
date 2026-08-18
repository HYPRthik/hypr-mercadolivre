/**
 * Validação do dashboard em navegador headless.
 *
 *   node validate.js            → checa estrutura, navegação e erros de JS
 *   node validate.js --shots    → também grava screenshots em ./.shots/
 *
 * Requer Playwright + Chromium. Neste ambiente:
 *   PW=/opt/node22/lib/node_modules/playwright
 *   CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
 * Ambos podem ser sobrescritos por variável de ambiente.
 */
const path = require("path");
const fs = require("fs");

const PW = process.env.PW || "/opt/node22/lib/node_modules/playwright";
const CHROME = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const SHOTS = process.argv.includes("--shots");
const { chromium } = require(PW);

const SECOES = ["consolidado", "campanhas", "audiencias", "criativos", "brandlift", "materiais"];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
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
