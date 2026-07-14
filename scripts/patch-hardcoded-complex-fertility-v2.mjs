import {
  copyFile,
  readFile,
  writeFile,
} from 'node:fs/promises';

import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const pagePath = path.join(
  projectRoot,
  'src',
  'pages',
  'complex-fertility-cases.astro',
);

const fallbackPath = path.join(
  projectRoot,
  'src',
  'content',
  'hardcoded',
  'complex-fertility-cases.json',
);

const backupPath = `${pagePath}.before-hardcoded-patch-v2.bak`;

let source = await readFile(pagePath, 'utf8');
source = source.replace(/\r\n/g, '\n');

await readFile(fallbackPath, 'utf8');

try {
  await copyFile(pagePath, backupPath);
  console.log(`Backup creado: ${backupPath}`);
} catch {
  console.log('El backup v2 ya existe; se conserva.');
}

function replaceOne(label, pattern, replacement, alreadyApplied) {
  if (
    alreadyApplied &&
    source.includes(alreadyApplied)
  ) {
    console.log(`Ya aplicado: ${label}`);
    return;
  }

  const matches = [...source.matchAll(
    new RegExp(
      pattern.source,
      pattern.flags.includes('g')
        ? pattern.flags
        : `${pattern.flags}g`,
    ),
  )];

  if (matches.length !== 1) {
    throw new Error(
      `${label}: se esperaban 1 coincidencia y se encontraron ${matches.length}. ` +
      'La plantilla no se ha guardado.',
    );
  }

  source = source.replace(pattern, replacement);
  console.log(`Sustituido: ${label}`);
}

/*
 * Añade el JSON de respaldo. No cambia la forma en que la página
 * obtiene "content" desde Storyblok.
 */
if (
  !source.includes(
    "import templateFallback from '../content/hardcoded/complex-fertility-cases.json';",
  )
) {
  replaceOne(
    'Import del fallback',
    /import\s+\{\s*cfcRigorIcons\s*\}\s+from\s+['"]\.\.\/data\/cfcRigorIcons['"]\s*;/,
    (match) =>
      `${match}\nimport templateFallback from '../content/hardcoded/complex-fertility-cases.json';`,
  );
} else {
  console.log('Ya aplicado: Import del fallback');
}

/*
 * Storyblok representa los objetos anidados como arrays de un bloque.
 * Esta función convierte únicamente los arrays de un solo objeto en
 * objetos normales. Las listas de textos y elementos se conservan.
 */
if (
  !source.includes(
    'const template = unwrapSingletonBlocks(templateSource);',
  )
) {
  replaceOne(
    'Normalización del bloque Page Texts',
    /const\s+cfcTestimonials\s*=\s*content\.cfcTestimonials\s*;/,
    (match) => `${match}

function unwrapSingletonBlocks(value: any): any {
  if (Array.isArray(value)) {
    const normalized = value.map(unwrapSingletonBlocks);

    if (
      normalized.length === 1 &&
      normalized[0] !== null &&
      typeof normalized[0] === 'object' &&
      !Array.isArray(normalized[0])
    ) {
      return normalized[0];
    }

    return normalized;
  }

  if (
    value !== null &&
    typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        unwrapSingletonBlocks(item),
      ]),
    );
  }

  return value;
}

const templateSource =
  content.template?.[0] ?? templateFallback;

const template =
  unwrapSingletonBlocks(templateSource);`,
  );
} else {
  console.log('Ya aplicado: Normalización del bloque Page Texts');
}

/* SEO */
replaceOne(
  'SEO title',
  /\btitle\s*=\s*["']Complex Fertility Cases in Barcelona \| FIVClínic["']/,
  'title={template.seo.title}',
  'title={template.seo.title}',
);

replaceOne(
  'SEO description',
  /\bdescription\s*=\s*["']Complex fertility and IVF care in Barcelona — expert second opinions, care for women 40\+, and reproductive genetics guidance, backed by Hospital Clínic Barcelona\.["']/,
  'description={template.seo.description}',
  'description={template.seo.description}',
);

/* Hero */
replaceOne(
  'Hero title plain',
  /\btitlePlain\s*=\s*["']Complex["']/,
  'titlePlain={template.hero.titlePlain}',
  'titlePlain={template.hero.titlePlain}',
);

replaceOne(
  'Hero title accent',
  /\btitleAccent\s*=\s*["']fertility and IVF care:["']/,
  'titleAccent={template.hero.titleAccent}',
  'titleAccent={template.hero.titleAccent}',
);

replaceOne(
  'Hero title tail',
  /\btitleTail\s*=\s*["']clear answers, expert guidance["']/,
  'titleTail={template.hero.titleTail}',
  'titleTail={template.hero.titleTail}',
);

replaceOne(
  'Hero paragraphs',
  /paragraphs\s*=\s*\{\s*\[\s*['"]Advanced fertility care backed by <strong>Hospital Clínic Barcelona<\/strong>,[\s\S]*?experienced in complex and international cases\.<\/strong>['"]\s*,?\s*\]\s*\}/,
  'paragraphs={template.hero.paragraphs}',
  'paragraphs={template.hero.paragraphs}',
);

replaceOne(
  'Hero checks',
  /checks\s*=\s*\{\s*\[\s*['"]Expert second opinions after failed IVF cycles['"][\s\S]*?['"]Advanced reproductive genetics and PGT-A guidance['"]\s*,?\s*\]\s*\}/,
  'checks={template.hero.checks}',
  'checks={template.hero.checks}',
);

replaceOne(
  'Hero note',
  /\bnote\s*=\s*["']FIVClínic is the assisted reproduction department of barnaclínic\+, backed by<br\s*\/?><strong>Hospital Clínic Barcelona<\/strong> [–—-] an internationally ranked, tier-1 university hospital group\.["']/,
  'note={template.hero.note}',
  'note={template.hero.note}',
);

replaceOne(
  'Hero form title',
  /\bformTitle\s*=\s*["']Understand your IVF treatment options with an expert["']/,
  'formTitle={template.hero.formTitle}',
  'formTitle={template.hero.formTitle}',
);

/* Uncertainty */
replaceOne(
  'Uncertainty title plain',
  /\btitlePlain\s*=\s*["']When fertility becomes complex,["']/,
  'titlePlain={template.uncertainty.titlePlain}',
  'titlePlain={template.uncertainty.titlePlain}',
);

replaceOne(
  'Uncertainty title accent',
  /\btitleAccent\s*=\s*["']uncertainty is often the hardest part\.["']/,
  'titleAccent={template.uncertainty.titleAccent}',
  'titleAccent={template.uncertainty.titleAccent}',
);

replaceOne(
  'Uncertainty paragraphs',
  /paragraphs\s*=\s*\{\s*\[\s*['"]After failed IVF cycles,[\s\S]*?confident decisions\.<\/strong>['"]\s*,?\s*\]\s*\}/,
  'paragraphs={template.uncertainty.paragraphs}',
  'paragraphs={template.uncertainty.paragraphs}',
);

replaceOne(
  'Question heading',
  /<strong\s+class=["']accent-text["']>You may be asking yourself:<\/strong>/,
  '<strong class="accent-text">{template.uncertainty.questionHeading}</strong>',
  '{template.uncertainty.questionHeading}',
);

replaceOne(
  'Question list',
  /<li>Why previous IVF treatments didn[’']t work<\/li>\s*<li>Whether age or ovarian reserve limits your real options<\/li>\s*<li>If genetics could be affecting embryo development<\/li>\s*<li>What makes sense to try next — and what doesn[’']t<\/li>/,
  `{template.uncertainty.questions.map((item) => (
    <li>{item}</li>
  ))}`,
  'template.uncertainty.questions.map',
);

replaceOne(
  'Uncertainty closing',
  /<p\s+style=["']margin-top:18px;color:var\(--color-body\)["']>Without clarity, moving forward becomes emotionally and medically exhausting\.<\/p>/,
  '<p style="margin-top:18px;color:var(--color-body)">{template.uncertainty.closing}</p>',
  '{template.uncertainty.closing}',
);

/* Why FIVClínic */
replaceOne(
  'Right place title plain',
  /\btitlePlain\s*=\s*["']Why FIVClínic is the right place["']/,
  'titlePlain={template.rightPlace.titlePlain}',
  'titlePlain={template.rightPlace.titlePlain}',
);

replaceOne(
  'Right place title accent',
  /\btitleAccent\s*=\s*["']for your journey["']/,
  'titleAccent={template.rightPlace.titleAccent}',
  'titleAccent={template.rightPlace.titleAccent}',
);

replaceOne(
  'Right place paragraphs',
  /paragraphs\s*=\s*\{\s*\[\s*['"]<strong>You don[’']t need more opinions\. You need the right one\.<\/strong>['"][\s\S]*?what options make sense for you\.['"]\s*,?\s*\]\s*\}/,
  'paragraphs={template.rightPlace.paragraphs}',
  'paragraphs={template.rightPlace.paragraphs}',
);

/* Scientific rigor */
replaceOne(
  'Rigor title plain',
  /\btitlePlain\s*=\s*["']Scientific rigor, explained clearly\.["']/,
  'titlePlain={template.rigor.titlePlain}',
  'titlePlain={template.rigor.titlePlain}',
);

replaceOne(
  'Rigor title accent',
  /\btitleAccent\s*=\s*["']Human care, always present\.["']/,
  'titleAccent={template.rigor.titleAccent}',
  'titleAccent={template.rigor.titleAccent}',
);

replaceOne(
  'Rigor subtitle',
  /\bsubtitle\s*=\s*["']Complex fertility decisions cannot be standardized or rushed\.<br\s*\/?>At <strong>FIVClínic:<\/strong>["']/,
  'subtitle={template.rigor.subtitle}',
  'subtitle={template.rigor.subtitle}',
);

replaceOne(
  'Rigor note',
  /\bnote\s*=\s*["']Here, clarity is part of the treatment\.["']/,
  'note={template.rigor.note}',
  'note={template.rigor.note}',
);

/* Barcelona */
replaceOne(
  'Barcelona intro',
  /\bintro\s*=\s*["']Barcelona is one of Europe[’']s leading destinations for advanced medical care, combining <strong>clinical excellence, innovation, and an international healthcare ecosystem\.<\/strong>["']/,
  'intro={template.barcelona.intro}',
  'intro={template.barcelona.intro}',
);

replaceOne(
  'Barcelona footer',
  /\bfooter\s*=\s*["']<strong>FIVClínic\+<\/strong> benefits directly from this ecosystem, with its clinical approach supported by the medical excellence and standards of Hospital Clínic Barcelona, one of the most respected academic hospitals in Spain and Europe\.["']/,
  'footer={template.barcelona.footer}',
  'footer={template.barcelona.footer}',
);

/* Specialized approach */
replaceOne(
  'Approach title',
  /<h2\s+class=["']cfc-title["']>A specialized approach for\s*<span\s+class=["']accent["']>complex fertility journeys<\/span><\/h2>/,
  '<h2 class="cfc-title">{template.approach.titlePlain} <span class="accent">{template.approach.titleAccent}</span></h2>',
  '{template.approach.titlePlain}',
);

replaceOne(
  'Approach CTA',
  /<a\s+href=["']#["']\s+class=["']btn cfc-cta["']>Download the free complex fertility guide<\/a>/,
  '<a href="#" class="btn cfc-cta">{template.approach.cta}</a>',
  '{template.approach.cta}',
);

/* Process */
replaceOne(
  'Process heading',
  /<TreatmentProcess\s+steps=\{processSteps\}\s+titleAccent=["']A clear, step-by-step process["']\s+titlePlain=["']designed around you["']\s*\/>/,
  '<TreatmentProcess steps={processSteps} titleAccent={template.process.titleAccent} titlePlain={template.process.titlePlain} />',
  'titleAccent={template.process.titleAccent}',
);

/* International patients */
replaceOne(
  'International title plain',
  /\btitlePlain\s*=\s*["']Support for["']/,
  'titlePlain={template.international.titlePlain}',
  'titlePlain={template.international.titlePlain}',
);

replaceOne(
  'International title accent',
  /\btitleAccent\s*=\s*["']international patients["']/,
  'titleAccent={template.international.titleAccent}',
  'titleAccent={template.international.titleAccent}',
);

replaceOne(
  'International title tail',
  /\btitleTail\s*=\s*["']at every step["']/,
  'titleTail={template.international.titleTail}',
  'titleTail={template.international.titleTail}',
);

replaceOne(
  'International intro',
  /\bintro\s*=\s*["']We understand that pursuing fertility treatment abroad requires clarity, coordination, and trust\. <strong>FIVClínic<\/strong> offers a structured and supportive process designed specifically for international patients\.["']/,
  'intro={template.international.intro}',
  'intro={template.international.intro}',
);

/* Clarity */
replaceOne(
  'Clarity title plain',
  /\btitlePlain\s*=\s*["']Clarity["']/,
  'titlePlain={template.clarity.titlePlain}',
  'titlePlain={template.clarity.titlePlain}',
);

replaceOne(
  'Clarity title accent',
  /\btitleAccent\s*=\s*["']changes everything\.["']/,
  'titleAccent={template.clarity.titleAccent}',
  'titleAccent={template.clarity.titleAccent}',
);

replaceOne(
  'Clarity paragraphs',
  /paragraphs\s*=\s*\{\s*\[\s*['"]When you truly understand your situation and your real options:['"]\s*\]\s*\}/,
  'paragraphs={template.clarity.paragraphs}',
  'paragraphs={template.clarity.paragraphs}',
);

replaceOne(
  'Clarity bullets',
  /bullets\s*=\s*\{\s*\[\s*['"]PGT-A['"]\s*,\s*['"]Carrier screening panels['"]\s*,\s*['"]Advanced genetic analysis when indicated['"]\s*\]\s*\}/,
  'bullets={template.clarity.bullets}',
  'bullets={template.clarity.bullets}',
);

replaceOne(
  'Clarity closing',
  /<p\s+style=["']margin-top:18px;color:var\(--color-body\)["']>Whether the next step involves treatment, adjustment, or a different approach, clarity allows you to move forward with confidence\.<\/p>/,
  '<p style="margin-top:18px;color:var(--color-body)">{template.clarity.closing}</p>',
  '{template.clarity.closing}',
);

/* Avoid block */
replaceOne(
  'Avoid title',
  /<h2\s+class=["']avoid-title["']>Avoid moving forward without understanding why\.<\/h2>/,
  '<h2 class="avoid-title">{template.avoid.title}</h2>',
  '{template.avoid.title}',
);

replaceOne(
  'Avoid intro',
  /<p\s+class=["']avoid-sub["']>Repeated treatments without proper analysis can lead to:<\/p>/,
  '<p class="avoid-sub">{template.avoid.intro}</p>',
  '{template.avoid.intro}',
);

replaceOne(
  'Avoid bullets',
  /<li>Emotional exhaustion<\/li>\s*<li>Loss of trust<\/li>\s*<li>Missed opportunities to adjust strategy<\/li>/,
  `{template.avoid.bullets.map((item) => (
    <li>{item}</li>
  ))}`,
  'template.avoid.bullets.map',
);

replaceOne(
  'Avoid footer',
  /<p\s+class=["']avoid-foot["']>A thorough, honest review helps prevent repeating the same path without answers\.<\/p>/,
  '<p class="avoid-foot">{template.avoid.footer}</p>',
  '{template.avoid.footer}',
);

/* Final sections */
replaceOne(
  'Patient voices title',
  /\btitleAccent\s*=\s*["']What patients say about us["']/,
  'titleAccent={template.patientVoices.titleAccent}',
  'titleAccent={template.patientVoices.titleAccent}',
);

replaceOne(
  'Lead form title',
  /<LeadForm\s+titlePlain=["']Take the next step with["']\s+titleAccent=["']clarity and expert guidance\.["']\s*\/>/,
  '<LeadForm titlePlain={template.leadForm.titlePlain} titleAccent={template.leadForm.titleAccent} />',
  'titlePlain={template.leadForm.titlePlain}',
);

/*
 * Solo se escribe cuando TODOS los patrones han sido validados.
 * Si cualquiera falla, el archivo original permanece intacto.
 */
await writeFile(pagePath, source, 'utf8');

console.log('');
console.log('Plantilla actualizada correctamente.');
console.log('Storyblok no se ha modificado de nuevo.');
console.log('');
console.log('Siguiente paso:');
console.log('  npm run dev');
console.log('  abre /complex-fertility-cases/');
