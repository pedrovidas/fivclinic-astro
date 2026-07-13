/**
 * Extrae las consts de datos del frontmatter de una página .astro a JSON.
 * Uso: node scripts/extract-content.mjs src/pages/rpl.astro src/content/rpl.json
 * - Stubbea los imports de iconos (los SVG son diseño, no contenido: se quedan en la página).
 * - En rigorItems (u otros arrays con campo icon de iconos importados) elimina el campo icon.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [,, pagePath, outPath] = process.argv;
const src = readFileSync(pagePath, 'utf8');
const fm = src.split('---')[1];

// Quitar imports; detectar iconos importados para stub
const lines = fm.split('\n');
const iconImports = [];
const body = lines.filter((l) => {
  const m = l.match(/^import \{ (\w+) \} from '\.\.\/data\//);
  if (m) { iconImports.push(m[1]); return false; }
  return !l.startsWith('import ');
}).join('\n');

// Stub de los arrays de iconos: proxys que devuelven un marcador
const stubs = iconImports.map((n) => `const ${n} = new Proxy([], { get: (t, k) => '__ICON__' });`).join('\n');

// Detectar nombres de consts declaradas
const names = [...body.matchAll(/^const (\w+) =/gm)].map((m) => m[1]);

const script = `${stubs}\n${body}\nconst __out = {};\n${names.map((n) => `__out[${JSON.stringify(n)}] = ${n};`).join('\n')}\nprocess.stdout.write(JSON.stringify(__out, null, 2));`;

const { execFileSync } = await import('node:child_process');
writeFileSync('/tmp/extract-tmp.mjs', script);
const json = execFileSync('node', ['/tmp/extract-tmp.mjs'], { encoding: 'utf8' });
const data = JSON.parse(json);

// Limpiar marcadores de iconos: quitar campos icon con __ICON__
const clean = (v) => {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, val] of Object.entries(v)) {
      if (val === '__ICON__') continue;
      o[k] = clean(val);
    }
    return o;
  }
  return v;
};
for (const k of Object.keys(data)) data[k] = clean(data[k]);
delete data.u; // la base de uploads no es contenido editable

writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`${outPath}: ${Object.keys(data).join(', ')}`);
