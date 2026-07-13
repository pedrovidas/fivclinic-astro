/**
 * Traducción del sitio a es / fr / it / ca usando la API de OpenAI.
 *
 * Uso:
 *   1) npm run build
 *   2) OPENAI_API_KEY=sk-... npm run translate
 *   3) npm run build   (o vercel --prod; las traducciones viven en public/)
 *
 * Notas:
 *   - Lee el HTML compilado de .vercel/output/static y escribe public/<lang>/...
 *   - Cachea traducciones en scripts/i18n-cache/<lang>.json (solo paga lo nuevo).
 *   - MOCK=1 npm run translate  →  modo prueba sin API (marca los textos).
 */

import { parse } from 'node-html-parser';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, '.vercel/output/static');
const PUBLIC = join(ROOT, 'public');
const CACHE_DIR = join(ROOT, 'scripts/i18n-cache');

const LANGS = {
  es: 'Spanish (Spain)',
  fr: 'French',
  it: 'Italian',
  ca: 'Catalan',
};

const MOCK = process.env.MOCK === '1';
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const BATCH = 40;

if (!MOCK && !API_KEY) {
  console.error('\n✗ Falta OPENAI_API_KEY.\n  Ejecuta:  OPENAI_API_KEY=sk-... npm run translate\n  (o MOCK=1 npm run translate para una prueba sin API)\n');
  process.exit(1);
}

// Textos dentro de <script> del wizard que también hay que traducir
const JS_STRINGS = [
  'Please enter your age',
  'Please select your country',
  'Please select an option',
  'Not provided',
  'Not answered',
];

// No traducir nunca (marcas, endónimos)
const SKIP_EXACT = new Set([
  'FIVClínic', 'FIVclínic+', 'FIVClinic', 'FIVClínic+', 'barnaclínic+', 'BARNACLÍNIC+',
  'English', 'Español', 'Français', 'Italiano', 'Català',
  'IDIBAPS', 'Barcelona', 'ROPA', 'PGT-A', 'AMH', 'IVF', '·', '—', '–', '/', '|', '+', '×', '↓',
]);

const GLOSSARY = `Glossary and rules:
- Keep brand/proper names untouched: FIVClínic, FIVclínic+, barnaclínic+, Hospital Clínic Barcelona, IDIBAPS, Universitat de Barcelona, Newsweek, World Health Organization (translate WHO's name per local convention), European Reference Networks, Bryant Pro.
- Use standard local medical terminology: e.g. "IVF" -> es:"FIV", ca:"FIV", fr:"FIV", it:"FIVET" when it reads naturally; keep acronyms PGT-A, AMH, RPL (you may expand RPL per local convention on first mention if natural), ROPA stays ROPA.
- Medical, warm, professional tone. Address the reader formally where the language distinguishes (es: "usted" implied style but natural web tone is fine; fr: "vous"; it: forma di cortesia; ca: "vostè"-neutral web tone).
- Do NOT translate anything that looks like a placeholder, code, URL or number.
- Preserve leading/trailing punctuation and casing style (if source is UPPERCASE, keep UPPERCASE).
- Return translations only, no explanations.`;

// ---------- utilidades ----------

function cacheFile(lang) {
  return join(CACHE_DIR, MOCK ? `${lang}.mock.json` : `${lang}.json`);
}
function loadCache(lang) {
  const f = cacheFile(lang);
  if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf8'));
  return {};
}
function saveCache(lang, cache) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile(lang), JSON.stringify(cache, null, 1));
}

function isTranslatable(text) {
  const t = text.trim();
  if (!t) return false;
  if (SKIP_EXACT.has(t)) return false;
  if (/^[\d\s.,:%+·\-–—/|×°'"()€$£]*$/.test(t)) return false; // solo números/símbolos
  if (/^https?:\/\//.test(t)) return false;
  if (t.length < 2) return false;
  return true;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callOpenAI(strings, lang) {
  // Claves numeradas: mucho más fiable que un array (el modelo no puede fusionar items)
  const keyed = {};
  strings.forEach((s, i) => { keyed[String(i)] = s; });
  const body = {
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a professional medical website translator. Translate each value from English to ${LANGS[lang]} for a fertility clinic website (fivclinic.es).\n${GLOSSARY}\nInput is a JSON object {"items": {"0": "...", "1": "..."}}. Reply with a JSON object {"items": {...}} containing EXACTLY the same keys, each value translated. Never merge, drop or add keys.`,
      },
      { role: 'user', content: JSON.stringify({ items: keyed }) },
    ],
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const out = JSON.parse(data.choices[0].message.content).items || {};
  const result = strings.map((_, i) => out[String(i)]);
  if (result.some((v) => typeof v !== 'string' || !v.trim())) {
    const missing = result.filter((v) => typeof v !== 'string' || !v.trim()).length;
    throw new Error(`Faltan ${missing} traducciones en la respuesta`);
  }
  return result;
}

async function translateBatch(strings, lang, attempt = 0) {
  if (MOCK) return strings.map((s) => `[${lang}] ${s}`);
  try {
    return await callOpenAI(strings, lang);
  } catch (e) {
    if (attempt < 2) {
      await sleep(1500 * (attempt + 1));
      if (strings.length > 1 && attempt === 1) {
        // dividir el lote en dos mitades y traducirlas por separado
        const mid = Math.ceil(strings.length / 2);
        const a = await translateBatch(strings.slice(0, mid), lang, 0);
        const b = await translateBatch(strings.slice(mid), lang, 0);
        return [...a, ...b];
      }
      return translateBatch(strings, lang, attempt + 1);
    }
    throw e;
  }
}

async function ensureTranslations(strings, lang, cache) {
  const missing = [...new Set(strings.filter((s) => isTranslatable(s) && !(s in cache)))];
  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH);
    process.stdout.write(`  · ${lang}: traduciendo ${i + chunk.length}/${missing.length}\r`);
    const out = await translateBatch(chunk, lang);
    chunk.forEach((s, j) => { cache[s] = out[j]; });
    saveCache(lang, cache);
  }
  if (missing.length) console.log(`  · ${lang}: ${missing.length} cadenas nuevas traducidas          `);
  else console.log(`  · ${lang}: todo en caché`);
}

// ---------- recorrido del HTML ----------

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT', 'CODE']);
const ATTRS = ['placeholder', 'aria-label', 'alt', 'title', 'content-desc'];

function collectAndApply(root, fn) {
  const walk = (node, noTranslate) => {
    if (node.nodeType === 3) { // texto
      if (!noTranslate) {
        const raw = node.rawText;
        const t = raw.trim();
        if (isTranslatable(t)) {
          const result = fn(t);
          if (result !== undefined) {
            node.rawText = raw.replace(t, result);
          }
        }
      }
      return;
    }
    const tag = (node.tagName || '').toUpperCase();
    if (SKIP_TAGS.has(tag)) return;
    const nt = noTranslate || node.hasAttribute?.('data-no-translate');
    // atributos traducibles
    if (!nt && node.getAttribute) {
      for (const a of ATTRS) {
        const v = node.getAttribute(a);
        if (v && isTranslatable(v)) {
          const r = fn(v.trim());
          if (r !== undefined) node.setAttribute(a, r);
        }
      }
    }
    for (const child of node.childNodes || []) walk(child, nt);
  };
  walk(root, false);
}

function findPages(dir, base = '') {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (['_astro', 'fonts', 'es', 'fr', 'it', 'ca'].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...findPages(full, join(base, entry)));
    } else if (entry === 'index.html') {
      out.push({ file: full, route: base || '.' });
    }
  }
  return out;
}

function localizeLinks(root, lang) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('/')) return;
    if (a.hasAttribute('data-lang-code')) return; // el JS del header los gestiona
    if (href.startsWith('/_astro') || /\.(css|js|png|jpg|svg|pdf|woff2?)($|\?)/.test(href)) return;
    if (/^\/(es|fr|it|ca)(\/|$)/.test(href)) return;
    a.setAttribute('href', `/${lang}${href}`);
  });
}

// ---------- principal ----------

async function main() {
  if (!existsSync(DIST)) {
    console.error('✗ No existe .vercel/output/static — ejecuta primero: npm run build');
    process.exit(1);
  }
  const pages = findPages(DIST);
  console.log(`Páginas encontradas: ${pages.length}${MOCK ? '  (MODO MOCK)' : ''}`);

  for (const lang of Object.keys(LANGS)) {
    console.log(`\n=== ${lang.toUpperCase()} (${LANGS[lang]}) ===`);
    const cache = loadCache(lang);

    // 1ª pasada: recolectar todas las cadenas de todas las páginas
    const all = new Set(JS_STRINGS);
    const parsed = pages.map(({ file, route }) => {
      const root = parse(readFileSync(file, 'utf8'));
      collectAndApply(root, (t) => { all.add(t); return undefined; });
      const titleEl = root.querySelector('title');
      if (titleEl) all.add(titleEl.text.trim());
      const meta = root.querySelector('meta[name="description"]');
      if (meta?.getAttribute('content')) all.add(meta.getAttribute('content').trim());
      return { root, route };
    });

    // 2ª pasada: traducir lo que falte
    await ensureTranslations([...all], lang, cache);

    // 3ª pasada: aplicar y escribir
    for (const { root, route } of parsed) {
      collectAndApply(root, (t) => cache[t]);
      const titleEl = root.querySelector('title');
      if (titleEl && cache[titleEl.text.trim()]) titleEl.set_content(cache[titleEl.text.trim()]);
      const meta = root.querySelector('meta[name="description"]');
      if (meta && cache[meta.getAttribute('content')?.trim()]) meta.setAttribute('content', cache[meta.getAttribute('content').trim()]);
      const htmlEl = root.querySelector('html');
      if (htmlEl) htmlEl.setAttribute('lang', lang);
      localizeLinks(root, lang);

      // Cadenas dentro de <script> (mensajes del wizard)
      let html = root.toString();
      for (const s of JS_STRINGS) {
        if (cache[s]) html = html.split(`'${s}'`).join(`'${cache[s].replace(/'/g, "\\'")}'`);
      }

      const outFile = join(PUBLIC, lang, route === '.' ? '' : route, 'index.html');
      mkdirSync(dirname(outFile), { recursive: true });
      writeFileSync(outFile, html);
    }
    console.log(`  · ${lang}: ${parsed.length} páginas escritas en public/${lang}/`);
  }

  console.log('\n✓ Hecho. Ejecuta ahora `npm run build` (o `vercel --prod`) para publicar con las traducciones.\n');
}

main().catch((e) => { console.error('\n✗ Error:', e.message); process.exit(1); });
