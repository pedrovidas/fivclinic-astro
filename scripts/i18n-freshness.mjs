/**
 * Comprueba tras cada build que las páginas traducidas (public/<lang>/)
 * referencian assets (_astro/*.css|js) que existen en el build actual.
 * Si no, avisa: hay que ejecutar `npm run translate` antes de desplegar.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, '.vercel/output/static');
const LANGS = ['es', 'fr', 'it', 'ca'];

if (!existsSync(join(DIST, '_astro'))) process.exit(0);
const assets = new Set(readdirSync(join(DIST, '_astro')));

let stale = 0;
for (const lang of LANGS) {
  const f = join(ROOT, 'public', lang, 'index.html');
  if (!existsSync(f)) continue;
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/_astro\/([^"']+\.(?:css|js))/g)) {
    if (!assets.has(m[1])) { stale++; break; }
  }
}

if (stale) {
  console.warn('\n' + '\u26a0'.repeat(3) + `  ATENCIÓN: ${stale} idioma(s) traducidos referencian assets que ya no existen (CSS/JS con hash antiguo).`);
  console.warn('   Las páginas /es /fr /it /ca se verán SIN ESTILOS si despliegas así.');
  console.warn('   Solución: ejecuta  npm run translate  y vuelve a desplegar.\n');
} else if (LANGS.some((l) => existsSync(join(ROOT, 'public', l)))) {
  console.log('\u2713 Traducciones al día con el build actual.');
}
