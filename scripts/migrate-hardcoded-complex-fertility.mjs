import { randomUUID, createHash } from 'node:crypto';
import {
  mkdir,
  readFile,
  writeFile,
  copyFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';
import StoryblokClient from 'storyblok-js-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

loadDotenv({ path: path.join(projectRoot, '.env.local') });

const oauthToken =
  process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN;
const spaceId = process.env.STORYBLOK_SPACE_ID;

if (!oauthToken) {
  throw new Error(
    'Falta STORYBLOK_PERSONAL_ACCESS_TOKEN en .env.local',
  );
}

if (!spaceId || !/^\d+$/.test(spaceId)) {
  throw new Error(
    'Falta STORYBLOK_SPACE_ID o no contiene solo números.',
  );
}

const SLUG = 'complex-fertility-cases';
const ROOT_COMPONENT =
  'page_data_complex_fertility_cases';
const TEMPLATE_COMPONENT =
  'complex_fertility_template';

const pagePath = path.join(
  projectRoot,
  'src',
  'pages',
  'complex-fertility-cases.astro',
);

const fallbackDir = path.join(
  projectRoot,
  'src',
  'content',
  'hardcoded',
);

const fallbackPath = path.join(
  fallbackDir,
  'complex-fertility-cases.json',
);

const templateSource = {
  seo: {
    title:
      'Complex Fertility Cases in Barcelona | FIVClínic',
    description:
      'Complex fertility and IVF care in Barcelona — expert second opinions, care for women 40+, and reproductive genetics guidance, backed by Hospital Clínic Barcelona.',
  },

  hero: {
    titlePlain: 'Complex',
    titleAccent: 'fertility and IVF care:',
    titleTail: 'clear answers, expert guidance',
    paragraphs: [
      'Advanced fertility care backed by <strong>Hospital Clínic Barcelona</strong>, one of Europe’s leading hospitals, with a multidisciplinary team <strong>experienced in complex and international cases.</strong>',
    ],
    checks: [
      'Expert second opinions after failed IVF cycles',
      'Specialized care for women 40+ and with low ovarian reserve',
      'Advanced reproductive genetics and PGT-A guidance',
    ],
    note:
      'FIVClínic is the assisted reproduction department of barnaclínic+, backed by<br /><strong>Hospital Clínic Barcelona</strong> – an internationally ranked, tier-1 university hospital group.',
    formTitle:
      'Understand your IVF treatment options with an expert',
  },

  uncertainty: {
    titlePlain: 'When fertility becomes complex,',
    titleAccent:
      'uncertainty is often the hardest part.',
    paragraphs: [
      'After failed IVF cycles, with age-related fertility changes, or when genetic factors are involved, many patients face the same situation: they don’t lack treatments — <strong>they lack clear explanations and confident decisions.</strong>',
    ],
    questionHeading: 'You may be asking yourself:',
    questions: [
      'Why previous IVF treatments didn’t work',
      'Whether age or ovarian reserve limits your real options',
      'If genetics could be affecting embryo development',
      'What makes sense to try next — and what doesn’t',
    ],
    closing:
      'Without clarity, moving forward becomes emotionally and medically exhausting.',
  },

  rightPlace: {
    titlePlain: 'Why FIVClínic is the right place',
    titleAccent: 'for your journey',
    paragraphs: [
      '<strong>You don’t need more opinions. You need the right one.</strong>',
      '<strong>FIVClínic</strong> specializes in complex fertility cases that require time, experience, and honest medical guidance.',
      'Our clinical approach is supported by the standards and medical environment of Hospital Clínic Barcelona, one of Europe’s most respected university hospitals.',
      'We act as your guide — listening carefully, reviewing your case in depth, and helping you understand what is truly happening and what options make sense for you.',
    ],
  },

  rigor: {
    titlePlain: 'Scientific rigor, explained clearly.',
    titleAccent: 'Human care, always present.',
    subtitle:
      'Complex fertility decisions cannot be standardized or rushed.<br />At <strong>FIVClínic:</strong>',
    note: 'Here, clarity is part of the treatment.',
  },

  barcelona: {
    intro:
      'Barcelona is one of Europe’s leading destinations for advanced medical care, combining <strong>clinical excellence, innovation, and an international healthcare ecosystem.</strong>',
    footer:
      '<strong>FIVClínic+</strong> benefits directly from this ecosystem, with its clinical approach supported by the medical excellence and standards of Hospital Clínic Barcelona, one of the most respected academic hospitals in Spain and Europe.',
  },

  approach: {
    titlePlain: 'A specialized approach for',
    titleAccent: 'complex fertility journeys',
    cta: 'Download the free complex fertility guide',
  },

  process: {
    titleAccent: 'A clear, step-by-step process',
    titlePlain: 'designed around you',
  },

  international: {
    titlePlain: 'Support for',
    titleAccent: 'international patients',
    titleTail: 'at every step',
    intro:
      'We understand that pursuing fertility treatment abroad requires clarity, coordination, and trust. <strong>FIVClínic</strong> offers a structured and supportive process designed specifically for international patients.',
  },

  clarity: {
    titlePlain: 'Clarity',
    titleAccent: 'changes everything.',
    paragraphs: [
      'When you truly understand your situation and your real options:',
    ],
    bullets: [
      'PGT-A',
      'Carrier screening panels',
      'Advanced genetic analysis when indicated',
    ],
    closing:
      'Whether the next step involves treatment, adjustment, or a different approach, clarity allows you to move forward with confidence.',
  },

  avoid: {
    title:
      'Avoid moving forward without understanding why.',
    intro:
      'Repeated treatments without proper analysis can lead to:',
    bullets: [
      'Emotional exhaustion',
      'Loss of trust',
      'Missed opportunities to adjust strategy',
    ],
    footer:
      'A thorough, honest review helps prevent repeating the same path without answers.',
  },

  patientVoices: {
    titleAccent: 'What patients say about us',
  },

  leadForm: {
    titlePlain: 'Take the next step with',
    titleAccent: 'clarity and expert guidance.',
  },
};

const storyblok = new StoryblokClient({
  oauthToken,
});

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function apiRequest(
  method,
  endpoint,
  payload,
  attempt = 1,
) {
  try {
    const response =
      method === 'get'
        ? await storyblok.get(endpoint, payload)
        : method === 'post'
          ? await storyblok.post(endpoint, payload)
          : await storyblok.put(endpoint, payload);

    await wait(380);
    return response;
  } catch (error) {
    const status =
      error?.response?.status ?? error?.status;

    if (
      (status === 429 || status >= 500) &&
      attempt < 6
    ) {
      const delay = 700 * attempt;
      console.warn(
        `Reintentando ${endpoint} en ${delay} ms...`,
      );
      await wait(delay);

      return apiRequest(
        method,
        endpoint,
        payload,
        attempt + 1,
      );
    }

    throw error;
  }
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function snakeCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function displayName(value) {
  return snakeCase(value)
    .split('_')
    .filter(Boolean)
    .map(
      (word) =>
        word[0].toUpperCase() + word.slice(1),
    )
    .join(' ');
}

function safeComponentName(value) {
  const normalized = snakeCase(value);

  if (normalized.length <= 60) {
    return normalized;
  }

  const hash = createHash('sha1')
    .update(normalized)
    .digest('hex')
    .slice(0, 8);

  return `${normalized.slice(0, 51)}_${hash}`;
}

function inferTextType(values, key) {
  const strings = values.filter(
    (value) => typeof value === 'string',
  );

  const maxLength = Math.max(
    0,
    ...strings.map((value) => value.length),
  );

  const looksLong =
    /(description|paragraph|text|note|intro|footer|closing|subtitle)$/i.test(
      key,
    );

  return looksLong || maxLength > 90
    ? 'textarea'
    : 'text';
}

const componentDefinitions = new Map();
const fieldPlans = new Map();

function buildDefinition(
  componentName,
  label,
  samples,
) {
  if (componentDefinitions.has(componentName)) {
    return;
  }

  const validSamples = samples.filter(isPlainObject);
  const keys = new Set();

  for (const sample of validSamples) {
    for (const key of Object.keys(sample)) {
      keys.add(key);
    }
  }

  const schema = {};
  const plans = {};

  for (const originalKey of keys) {
    const technicalKey = snakeCase(originalKey);
    const values = validSamples.map(
      (sample) => sample[originalKey],
    );

    const arrays = values.filter(Array.isArray);

    if (arrays.length > 0) {
      const items = arrays.flat();
      const objectItems = items.filter(isPlainObject);
      const primitiveItems = items.filter(
        (item) => !isPlainObject(item),
      );

      if (
        objectItems.length > 0 &&
        primitiveItems.length > 0
      ) {
        throw new Error(
          `${componentName}.${originalKey} mezcla objetos y valores simples.`,
        );
      }

      const childName = safeComponentName(
        `${componentName}_${technicalKey}_item`,
      );

      const primitive = objectItems.length === 0;

      buildDefinition(
        childName,
        `${displayName(originalKey)} Item`,
        primitive
          ? (
              primitiveItems.length
                ? primitiveItems.map((item) => ({
                    value: item,
                  }))
                : [{ value: '' }]
            )
          : objectItems,
      );

      schema[technicalKey] = {
        type: 'bloks',
        display_name: displayName(originalKey),
        restrict_components: true,
        restrict_type: '',
        component_whitelist: [childName],
      };

      plans[originalKey] = {
        technicalKey,
        kind: 'array',
        childName,
        primitive,
      };

      continue;
    }

    const objects = values.filter(isPlainObject);

    if (objects.length > 0) {
      const childName = safeComponentName(
        `${componentName}_${technicalKey}`,
      );

      buildDefinition(
        childName,
        displayName(originalKey),
        objects,
      );

      schema[technicalKey] = {
        type: 'bloks',
        display_name: displayName(originalKey),
        maximum: 1,
        restrict_components: true,
        restrict_type: '',
        component_whitelist: [childName],
      };

      plans[originalKey] = {
        technicalKey,
        kind: 'object',
        childName,
      };

      continue;
    }

    const type = inferTextType(
      values,
      originalKey,
    );

    schema[technicalKey] = {
      type,
      display_name: displayName(originalKey),
      translatable: true,
    };

    plans[originalKey] = {
      technicalKey,
      kind: 'primitive',
    };
  }

  componentDefinitions.set(componentName, {
    name: componentName,
    display_name: label,
    schema,
    is_root: false,
    is_nestable: true,
  });

  fieldPlans.set(componentName, plans);
}

function toBlock(componentName, data) {
  const plans = fieldPlans.get(componentName);

  if (!plans) {
    throw new Error(
      `No existe plan para ${componentName}.`,
    );
  }

  const block = {
    _uid: randomUUID(),
    component: componentName,
  };

  for (const [originalKey, plan] of Object.entries(
    plans,
  )) {
    const value = data?.[originalKey];

    if (plan.kind === 'array') {
      const items = Array.isArray(value)
        ? value
        : [];

      block[plan.technicalKey] = items.map(
        (item) =>
          toBlock(
            plan.childName,
            plan.primitive
              ? { value: item }
              : item,
          ),
      );

      continue;
    }

    if (plan.kind === 'object') {
      block[plan.technicalKey] = isPlainObject(
        value,
      )
        ? [toBlock(plan.childName, value)]
        : [];

      continue;
    }

    block[plan.technicalKey] =
      value ?? '';
  }

  return block;
}

async function getComponents() {
  const response = await apiRequest(
    'get',
    `spaces/${spaceId}/components`,
  );

  return response.data.components ?? [];
}

async function upsertTemplateComponents(
  existingByName,
) {
  for (const definition of componentDefinitions.values()) {
    const current = existingByName.get(
      definition.name,
    );

    if (current) {
      await apiRequest(
        'put',
        `spaces/${spaceId}/components/${current.id}`,
        { component: definition },
      );

      console.log(
        `Actualizado bloque: ${definition.name}`,
      );
    } else {
      const response = await apiRequest(
        'post',
        `spaces/${spaceId}/components`,
        { component: definition },
      );

      existingByName.set(
        definition.name,
        response.data.component,
      );

      console.log(
        `Creado bloque: ${definition.name}`,
      );
    }
  }
}

async function addTemplateFieldToRoot(
  existingByName,
) {
  const root = existingByName.get(ROOT_COMPONENT);

  if (!root) {
    throw new Error(
      `No existe el bloque ${ROOT_COMPONENT}.`,
    );
  }

  const updated = {
    name: root.name,
    display_name:
      root.display_name ??
      'Complex Fertility Cases Data',
    schema: {
      ...(root.schema ?? {}),
      template: {
        type: 'bloks',
        display_name: 'Page Texts',
        maximum: 1,
        restrict_components: true,
        restrict_type: '',
        component_whitelist: [
          TEMPLATE_COMPONENT,
        ],
      },
    },
    is_root: false,
    is_nestable: true,
  };

  await apiRequest(
    'put',
    `spaces/${spaceId}/components/${root.id}`,
    { component: updated },
  );

  console.log(
    `Actualizado bloque raíz: ${ROOT_COMPONENT}`,
  );
}

async function findStory() {
  let page = 1;

  while (true) {
    const response = await apiRequest(
      'get',
      `spaces/${spaceId}/stories`,
      {
        page,
        per_page: 100,
      },
    );

    const stories =
      response.data.stories ?? [];

    const found = stories.find(
      (story) =>
        story.slug === SLUG &&
        Number(story.parent_id ?? 0) === 0,
    );

    if (found) {
      return found;
    }

    if (stories.length < 100) {
      return null;
    }

    page += 1;
  }
}

async function updateStory(templateBlock) {
  const summary = await findStory();

  if (!summary) {
    throw new Error(
      `No existe la Story ${SLUG}.`,
    );
  }

  const response = await apiRequest(
    'get',
    `spaces/${spaceId}/stories/${summary.id}`,
  );

  const story = response.data.story;
  const body = story.content?.body;

  if (!Array.isArray(body)) {
    throw new Error(
      `La Story ${SLUG} no contiene body.`,
    );
  }

  const dataBlock = body.find(
    (block) =>
      block.component === ROOT_COMPONENT,
  );

  if (!dataBlock) {
    throw new Error(
      `No se encontró ${ROOT_COMPONENT} en la Story.`,
    );
  }

  dataBlock.template = [templateBlock];

  await apiRequest(
    'put',
    `spaces/${spaceId}/stories/${story.id}`,
    {
      story: {
        ...story,
        content: {
          ...story.content,
          body,
        },
      },
      publish: false,
    },
  );

  console.log(
    `Actualizada Story: ${SLUG} (borrador)`,
  );
}

function replaceRequired(
  source,
  before,
  after,
  label,
) {
  if (source.includes(after)) {
    console.log(`Ya aplicado: ${label}`);
    return source;
  }

  if (!source.includes(before)) {
    throw new Error(
      `No se encontró el fragmento "${label}". ` +
        'No se ha modificado la plantilla.',
    );
  }

  console.log(`Sustituido: ${label}`);
  return source.replace(before, after);
}

async function patchAstroFile() {
  let source = await readFile(pagePath, 'utf8');
  source = source.replace(/\r\n/g, '\n');

  const backupPath = `${pagePath}.before-hardcoded-migration.bak`;

  try {
    await copyFile(pagePath, backupPath);
    console.log(`Backup creado: ${backupPath}`);
  } catch {
    // Si ya existe o no puede copiarse, continuamos.
  }

  if (
    !source.includes(
      "import templateFallback from '../content/hardcoded/complex-fertility-cases.json';",
    )
  ) {
    const anchor =
      "import { cfcRigorIcons } from '../data/cfcRigorIcons';";

    if (!source.includes(anchor)) {
      throw new Error(
        'No se encontró el import de cfcRigorIcons.',
      );
    }

    source = source.replace(
      anchor,
      `${anchor}\nimport templateFallback from '../content/hardcoded/complex-fertility-cases.json';`,
    );
  }

  if (
    !source.includes(
      'const template = content.template?.[0] ?? templateFallback;',
    )
  ) {
    const anchor =
      'const cfcTestimonials = content.cfcTestimonials;';

    if (!source.includes(anchor)) {
      throw new Error(
        'No se encontró const cfcTestimonials.',
      );
    }

    source = source.replace(
      anchor,
      `${anchor}\nconst template = content.template?.[0] ?? templateFallback;`,
    );
  }

  const replacements = [
    [
      'title="Complex Fertility Cases in Barcelona | FIVClínic"',
      'title={template.seo.title}',
      'SEO title',
    ],
    [
      'description="Complex fertility and IVF care in Barcelona — expert second opinions, care for women 40+, and reproductive genetics guidance, backed by Hospital Clínic Barcelona."',
      'description={template.seo.description}',
      'SEO description',
    ],
    [
      'titlePlain="Complex"',
      'titlePlain={template.hero.titlePlain}',
      'Hero title plain',
    ],
    [
      'titleAccent="fertility and IVF care:"',
      'titleAccent={template.hero.titleAccent}',
      'Hero title accent',
    ],
    [
      'titleTail="clear answers, expert guidance"',
      'titleTail={template.hero.titleTail}',
      'Hero title tail',
    ],
    [
      `paragraphs={[
  'Advanced fertility care backed by <strong>Hospital Clínic Barcelona</strong>, one of Europe’s leading hospitals, with a multidisciplinary team <strong>experienced in complex and international cases.</strong>',
 ]}`,
      'paragraphs={template.hero.paragraphs}',
      'Hero paragraphs',
    ],
    [
      `checks={[
  'Expert second opinions after failed IVF cycles',
  'Specialized care for women 40+ and with low ovarian reserve',
  'Advanced reproductive genetics and PGT-A guidance',
 ]}`,
      'checks={template.hero.checks}',
      'Hero checks',
    ],
    [
      'note="FIVClínic is the assisted reproduction department of barnaclínic+, backed by<br /><strong>Hospital Clínic Barcelona</strong> – an internationally ranked, tier-1 university hospital group."',
      'note={template.hero.note}',
      'Hero note',
    ],
    [
      'formTitle="Understand your IVF treatment options with an expert"',
      'formTitle={template.hero.formTitle}',
      'Hero form title',
    ],
    [
      'titlePlain="When fertility becomes complex,"',
      'titlePlain={template.uncertainty.titlePlain}',
      'Uncertainty title plain',
    ],
    [
      'titleAccent="uncertainty is often the hardest part."',
      'titleAccent={template.uncertainty.titleAccent}',
      'Uncertainty title accent',
    ],
    [
      `paragraphs={[
  'After failed IVF cycles, with age-related fertility changes, or when genetic factors are involved, many patients face the same situation: they don’t lack treatments — <strong>they lack clear explanations and confident decisions.</strong>',
 ]}`,
      'paragraphs={template.uncertainty.paragraphs}',
      'Uncertainty paragraphs',
    ],
    [
      '<strong class="accent-text">You may be asking yourself:</strong>',
      '<strong class="accent-text">{template.uncertainty.questionHeading}</strong>',
      'Question heading',
    ],
    [
      `<li>Why previous IVF treatments didn’t work</li>
  <li>Whether age or ovarian reserve limits your real options</li>
  <li>If genetics could be affecting embryo development</li>
  <li>What makes sense to try next — and what doesn’t</li>`,
      `{template.uncertainty.questions.map((item) => (
   <li>{item}</li>
  ))}`,
      'Question list',
    ],
    [
      '<p style="margin-top:18px;color:var(--color-body)">Without clarity, moving forward becomes emotionally and medically exhausting.</p>',
      '<p style="margin-top:18px;color:var(--color-body)">{template.uncertainty.closing}</p>',
      'Uncertainty closing',
    ],
    [
      'titlePlain="Why FIVClínic is the right place"',
      'titlePlain={template.rightPlace.titlePlain}',
      'Right place title plain',
    ],
    [
      'titleAccent="for your journey"',
      'titleAccent={template.rightPlace.titleAccent}',
      'Right place title accent',
    ],
    [
      `paragraphs={[
  '<strong>You don’t need more opinions. You need the right one.</strong>',
  '<strong>FIVClínic</strong> specializes in complex fertility cases that require time, experience, and honest medical guidance.',
  'Our clinical approach is supported by the standards and medical environment of Hospital Clínic Barcelona, one of Europe’s most respected university hospitals.',
  'We act as your guide — listening carefully, reviewing your case in depth, and helping you understand what is truly happening and what options make sense for you.',
 ]}`,
      'paragraphs={template.rightPlace.paragraphs}',
      'Right place paragraphs',
    ],
    [
      'titlePlain="Scientific rigor, explained clearly."',
      'titlePlain={template.rigor.titlePlain}',
      'Rigor title plain',
    ],
    [
      'titleAccent="Human care, always present."',
      'titleAccent={template.rigor.titleAccent}',
      'Rigor title accent',
    ],
    [
      'subtitle="Complex fertility decisions cannot be standardized or rushed.<br />At <strong>FIVClínic:</strong>"',
      'subtitle={template.rigor.subtitle}',
      'Rigor subtitle',
    ],
    [
      'note="Here, clarity is part of the treatment."',
      'note={template.rigor.note}',
      'Rigor note',
    ],
    [
      'intro="Barcelona is one of Europe’s leading destinations for advanced medical care, combining <strong>clinical excellence, innovation, and an international healthcare ecosystem.</strong>"',
      'intro={template.barcelona.intro}',
      'Barcelona intro',
    ],
    [
      'footer="<strong>FIVClínic+</strong> benefits directly from this ecosystem, with its clinical approach supported by the medical excellence and standards of Hospital Clínic Barcelona, one of the most respected academic hospitals in Spain and Europe."',
      'footer={template.barcelona.footer}',
      'Barcelona footer',
    ],
    [
      '<h2 class="cfc-title">A specialized approach for <span class="accent">complex fertility journeys</span></h2>',
      '<h2 class="cfc-title">{template.approach.titlePlain} <span class="accent">{template.approach.titleAccent}</span></h2>',
      'Approach title',
    ],
    [
      '<a href="#" class="btn cfc-cta">Download the free complex fertility guide</a>',
      '<a href="#" class="btn cfc-cta">{template.approach.cta}</a>',
      'Approach CTA',
    ],
    [
      '<TreatmentProcess steps={processSteps} titleAccent="A clear, step-by-step process" titlePlain="designed around you" />',
      '<TreatmentProcess steps={processSteps} titleAccent={template.process.titleAccent} titlePlain={template.process.titlePlain} />',
      'Process heading',
    ],
    [
      'titlePlain="Support for"',
      'titlePlain={template.international.titlePlain}',
      'International title plain',
    ],
    [
      'titleAccent="international patients"',
      'titleAccent={template.international.titleAccent}',
      'International title accent',
    ],
    [
      'titleTail="at every step"',
      'titleTail={template.international.titleTail}',
      'International title tail',
    ],
    [
      'intro="We understand that pursuing fertility treatment abroad requires clarity, coordination, and trust. <strong>FIVClínic</strong> offers a structured and supportive process designed specifically for international patients."',
      'intro={template.international.intro}',
      'International intro',
    ],
    [
      'titlePlain="Clarity"',
      'titlePlain={template.clarity.titlePlain}',
      'Clarity title plain',
    ],
    [
      'titleAccent="changes everything."',
      'titleAccent={template.clarity.titleAccent}',
      'Clarity title accent',
    ],
    [
      "paragraphs={['When you truly understand your situation and your real options:']}",
      'paragraphs={template.clarity.paragraphs}',
      'Clarity paragraphs',
    ],
    [
      "bullets={['PGT-A', 'Carrier screening panels', 'Advanced genetic analysis when indicated']}",
      'bullets={template.clarity.bullets}',
      'Clarity bullets',
    ],
    [
      '<p style="margin-top:18px;color:var(--color-body)">Whether the next step involves treatment, adjustment, or a different approach, clarity allows you to move forward with confidence.</p>',
      '<p style="margin-top:18px;color:var(--color-body)">{template.clarity.closing}</p>',
      'Clarity closing',
    ],
    [
      '<h2 class="avoid-title">Avoid moving forward without understanding why.</h2>',
      '<h2 class="avoid-title">{template.avoid.title}</h2>',
      'Avoid title',
    ],
    [
      '<p class="avoid-sub">Repeated treatments without proper analysis can lead to:</p>',
      '<p class="avoid-sub">{template.avoid.intro}</p>',
      'Avoid intro',
    ],
    [
      `<li>Emotional exhaustion</li>
  <li>Loss of trust</li>
  <li>Missed opportunities to adjust strategy</li>`,
      `{template.avoid.bullets.map((item) => (
   <li>{item}</li>
  ))}`,
      'Avoid bullets',
    ],
    [
      '<p class="avoid-foot">A thorough, honest review helps prevent repeating the same path without answers.</p>',
      '<p class="avoid-foot">{template.avoid.footer}</p>',
      'Avoid footer',
    ],
    [
      'titleAccent="What patients say about us"',
      'titleAccent={template.patientVoices.titleAccent}',
      'Patient voices title',
    ],
    [
      '<LeadForm titlePlain="Take the next step with" titleAccent="clarity and expert guidance." />',
      '<LeadForm titlePlain={template.leadForm.titlePlain} titleAccent={template.leadForm.titleAccent} />',
      'Lead form title',
    ],
  ];

  for (const [before, after, label] of replacements) {
    source = replaceRequired(
      source,
      before,
      after,
      label,
    );
  }

  await writeFile(pagePath, source, 'utf8');

  console.log(
    'Plantilla Astro actualizada correctamente.',
  );
}

try {
  console.log(
    'Preparando textos hardcodeados de Complex Fertility Cases...',
  );

  buildDefinition(
    TEMPLATE_COMPONENT,
    'Complex Fertility Page Texts',
    [templateSource],
  );

  const templateBlock = toBlock(
    TEMPLATE_COMPONENT,
    templateSource,
  );

  const existing = await getComponents();
  const existingByName = new Map(
    existing.map((component) => [
      component.name,
      component,
    ]),
  );

  await upsertTemplateComponents(existingByName);
  await addTemplateFieldToRoot(existingByName);
  await updateStory(templateBlock);

  await mkdir(fallbackDir, {
    recursive: true,
  });

  await writeFile(
    fallbackPath,
    `${JSON.stringify(templateSource, null, 2)}\n`,
    'utf8',
  );

  console.log(
    `Fallback creado: ${fallbackPath}`,
  );

  await patchAstroFile();

  console.log('');
  console.log(
    'Migración terminada correctamente.',
  );
  console.log(
    'La Story sigue como borrador.',
  );
  console.log(
    'Ejecuta npm run dev y revisa /complex-fertility-cases/.',
  );
} catch (error) {
  const status =
    error?.response?.status ??
    error?.status ??
    'desconocido';

  const details =
    error?.response?.data ??
    error?.message ??
    error;

  console.error('');
  console.error(
    `Error (${status}):`,
  );
  console.error(details);
  console.error('');
  console.error(
    'No borres el archivo .bak. Sirve para restaurar la plantilla si fuera necesario.',
  );
  process.exitCode = 1;
}
