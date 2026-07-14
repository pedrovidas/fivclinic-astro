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

const fallbackImport =
  "import templateFallback from '../content/hardcoded/complex-fertility-cases.json';";

const layoutMarkup = String.raw`<Layout
  title={template.seo.title}
  description={template.seo.description}
>
  <TreatmentHero
    titlePlain={template.hero.titlePlain}
    titleAccent={template.hero.titleAccent}
    accentFirst={false}
    titleTail={template.hero.titleTail}
    paragraphs={template.hero.paragraphs}
    checks={template.hero.checks}
    note={template.hero.note}
    formTitle={template.hero.formTitle}
    bgImage={u + '2026/02/HERO-IMG-2-1.png'}
  />

  <ProfileSelector cards={profileCards} />

  <SplitSection
    titlePlain={template.uncertainty.titlePlain}
    titleAccent={template.uncertainty.titleAccent}
    paragraphs={template.uncertainty.paragraphs}
    image={u + '2026/02/Rectangle-866.png'}
    imageSide="left"
  >
    <p style="margin-top:20px">
      <strong class="accent-text">
        {template.uncertainty.questionHeading}
      </strong>
    </p>

    <ul class="slot-bullets">
      {template.uncertainty.questions.map((item: string) => (
        <li>{item}</li>
      ))}
    </ul>

    <p style="margin-top:18px;color:var(--color-body)">
      {template.uncertainty.closing}
    </p>
  </SplitSection>

  <SplitSection
    titlePlain={template.rightPlace.titlePlain}
    titleAccent={template.rightPlace.titleAccent}
    paragraphs={template.rightPlace.paragraphs}
    image={u + '2026/02/Group-763.png'}
    imageSide="right"
    surface={true}
    wideImage={true}
  />

  <ScientificRigor
    titlePlain={template.rigor.titlePlain}
    titleAccent={template.rigor.titleAccent}
    subtitle={template.rigor.subtitle}
    items={rigorItems}
    note={template.rigor.note}
  />

  <WhyBarcelonaCards
    intro={template.barcelona.intro}
    footer={template.barcelona.footer}
  />

  <section class="section section-surface cfc-blocks">
    <div class="container">
      <h2 class="cfc-title">
        {template.approach.titlePlain}
        {' '}
        <span class="accent">
          {template.approach.titleAccent}
        </span>
      </h2>

      {blocks.map((b: any) => (
        <div
          class:list={[
            'cfc-grid',
            { 'image-left': b.imageSide === 'left' },
          ]}
        >
          <div class="cfc-copy">
            <h3>
              <span class="plus">+</span>
              {' '}
              {b.title}
            </h3>

            <p set:html={b.intro} />

            {b.groups.map((g: any) => (
              g.boxed ? (
                <div class="cfc-box">
                  <p
                    class="cfc-group-intro"
                    set:html={g.intro}
                  />
                  <ul>
                    {g.items.map((item: string) => (
                      <li>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div class="cfc-plain">
                  <p
                    class="cfc-group-intro"
                    set:html={g.intro}
                  />
                  <ul>
                    {g.items.map((item: string) => (
                      <li>{item}</li>
                    ))}
                  </ul>
                </div>
              )
            ))}

            {b.closing.map((closing: string) => (
              <p
                class="cfc-closing"
                set:html={closing}
              />
            ))}

            <div class="cfc-hint">
              <span
                class="hint-icon"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#fff"
                  stroke-width="2"
                >
                  <path
                    d="M12 16V4m0 12l-4-4m4 4l4-4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M4 18v2h16v-2"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <p>{b.hint}</p>
            </div>

            <a href="#" class="btn cfc-cta">
              {template.approach.cta}
            </a>
          </div>

          <div class="cfc-media">
            <img
              src={b.image}
              alt=""
              loading="lazy"
            />
          </div>
        </div>
      ))}
    </div>
  </section>

  <TreatmentProcess
    steps={processSteps}
    titleAccent={template.process.titleAccent}
    titlePlain={template.process.titlePlain}
  />

  <ExperienceCounters counters={counters} />

  <PlanningAbroad
    titlePlain={template.international.titlePlain}
    titleAccent={template.international.titleAccent}
    titleTail={template.international.titleTail}
    intro={template.international.intro}
    faqs={intlFaqs}
  />

  <FAQAccordion faqs={faqs} columns={2} />

  <SplitSection
    titlePlain={template.clarity.titlePlain}
    titleAccent={template.clarity.titleAccent}
    paragraphs={template.clarity.paragraphs}
    bullets={template.clarity.bullets}
    image={u + '2026/02/Rectangle-884.png'}
    imageSide="right"
  >
    <p style="margin-top:18px;color:var(--color-body)">
      {template.clarity.closing}
    </p>
  </SplitSection>

  <section class="section avoid-outer">
    <div class="container">
      <div class="avoid-head">
        <span class="avoid-plus" aria-hidden="true">+</span>
        <h2 class="avoid-title">
          {template.avoid.title}
        </h2>
      </div>

      <div class="avoid-box">
        <p class="avoid-sub">
          {template.avoid.intro}
        </p>

        <ul>
          {template.avoid.bullets.map((item: string) => (
            <li>{item}</li>
          ))}
        </ul>

        <p class="avoid-foot">
          {template.avoid.footer}
        </p>
      </div>
    </div>
  </section>

  <PatientVoices
    testimonials={cfcTestimonials}
    titlePlain=""
    titleAccent={template.patientVoices.titleAccent}
    eyebrow=""
    variant="gray"
  />

  <MedicalRecognition />

  <LeadForm
    titlePlain={template.leadForm.titlePlain}
    titleAccent={template.leadForm.titleAccent}
  />
</Layout>`;

function addFallbackImport(source) {
  if (source.includes(fallbackImport)) {
    return source;
  }

  const pattern =
    /import\s+\{\s*cfcRigorIcons\s*\}\s+from\s+['"]\.\.\/data\/cfcRigorIcons['"]\s*;/;

  const match = source.match(pattern);

  if (!match) {
    throw new Error(
      'No se encontró el import de cfcRigorIcons.',
    );
  }

  return source.replace(
    pattern,
    `${match[0]}\n${fallbackImport}`,
  );
}

function addTemplateNormalizer(source) {
  if (
    source.includes(
      'const template = unwrapSingletonBlocks(templateSource);',
    )
  ) {
    return source;
  }

  const pattern =
    /const\s+cfcTestimonials\s*=\s*content\.cfcTestimonials\s*;/;

  const match = source.match(pattern);

  if (!match) {
    throw new Error(
      'No se encontró la declaración cfcTestimonials.',
    );
  }

  const insertion = `${match[0]}

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
  unwrapSingletonBlocks(templateSource);`;

  return source.replace(pattern, insertion);
}

function replaceEntireLayout(source) {
  const start = source.indexOf('<Layout');
  const endTag = '</Layout>';
  const end = source.indexOf(endTag, start);

  if (start === -1 || end === -1) {
    throw new Error(
      'No se encontró el bloque <Layout>...</Layout>.',
    );
  }

  const before = source.slice(0, start);
  const after = source.slice(end + endTag.length);

  return `${before}${layoutMarkup}${after}`;
}

let source = await readFile(pagePath, 'utf8');
source = source.replace(/\r\n/g, '\n');

if (
  !source.includes(
    "getStoryblokPageContent",
  )
) {
  throw new Error(
    'La página todavía no está conectada a Storyblok.',
  );
}

if (
  !source.includes(
    "content.template",
  ) &&
  !source.includes(
    "const cfcTestimonials = content.cfcTestimonials",
  )
) {
  throw new Error(
    'No se encontró la estructura esperada de contenido.',
  );
}

const backupPath =
  `${pagePath}.before-layout-replacement.bak`;

await copyFile(pagePath, backupPath);

source = addFallbackImport(source);
source = addTemplateNormalizer(source);
source = replaceEntireLayout(source);

await writeFile(pagePath, source, 'utf8');

console.log('');
console.log('Página sustituida correctamente.');
console.log(`Backup: ${backupPath}`);
console.log('');
console.log('Ahora ejecuta:');
console.log('  npm run dev');
console.log('');
console.log('Y abre:');
console.log('  http://localhost:4321/complex-fertility-cases/');
