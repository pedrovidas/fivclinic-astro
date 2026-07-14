import { randomUUID, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';
import StoryblokClient from 'storyblok-js-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

loadDotenv({ path: path.join(projectRoot, '.env.local') });

const oauthToken = process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN;
const spaceId = process.env.STORYBLOK_SPACE_ID;

if (!oauthToken) {
  throw new Error(
    'Falta STORYBLOK_PERSONAL_ACCESS_TOKEN en .env.local'
  );
}

if (!spaceId || !/^\d+$/.test(spaceId)) {
  throw new Error(
    'Falta STORYBLOK_SPACE_ID o no contiene solo números.'
  );
}

const sourcePath = path.join(projectRoot, 'src/content/home.json');
const source = JSON.parse(await readFile(sourcePath, 'utf8'));

const storyblok = new StoryblokClient({
  oauthToken,
});

const topLevelNames = {
  hero: 'hero_home',
  heroStats: 'hero_stats',
  whoWeHelp: 'who_we_help',
  clinicalEnvironment: 'clinical_environment',
  socialProof: 'social_proof',
  whyBarcelona: 'why_barcelona',
  processSteps: 'process_steps',
  respected: 'respected_by_excellence',
  patientVoices: 'patient_voices',
  supportFaq: 'support_faq',
  medicalRecognition: 'medical_recognition',
  leadForm: 'lead_form',
};

const componentDefinitions = new Map();
const fieldPlans = new Map();

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
    .map((word) => word[0].toUpperCase() + word.slice(1))
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

function isNonTranslatableKey(key) {
  return /(href|url|path|slug|image|img|icon|logo|logos)$/i.test(key);
}

function inferTextType(values, key) {
  const strings = values
    .filter((value) => typeof value === 'string');

  const maxLength = Math.max(
    0,
    ...strings.map((value) => value.length)
  );

  const looksLong =
    /(lead|intro|description|paragraph|text|note|quote|closing|answer|sublabel|tags)$/i.test(
      key
    );

  const containsLineBreak = strings.some((value) =>
    value.includes('\n')
  );

  return looksLong || containsLineBreak || maxLength > 90
    ? 'textarea'
    : 'text';
}

function normalizeHero(hero) {
  return {
    eyebrow: hero.eyebrow ?? '',
    titleAccent: hero.titleAccent ?? '',
    titleTail: hero.titleTail ?? '',
    lead: hero.lead ?? '',
    paragraph1: hero.paragraphs?.[0] ?? '',
    paragraph2: hero.paragraphs?.[1] ?? '',
    note: hero.note ?? '',
    image: hero.image ?? '',
    institutionalLogos: hero.instLogos ?? '',
  };
}

function normalizeTopLevelSection(key, value) {
  if (key === 'hero') {
    return normalizeHero(value);
  }

  if (key === 'heroStats') {
    return {
      items: value,
    };
  }

  return value;
}

function buildDefinition(componentName, label, samples) {
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
      (sample) => sample[originalKey]
    );

    const arrayValues = values.filter(Array.isArray);

    if (arrayValues.length > 0) {
      const items = arrayValues.flat();
      const objectItems = items.filter(isPlainObject);

      const childName = safeComponentName(
        `${componentName}_${technicalKey}_item`
      );

      const childSamples =
        objectItems.length > 0
          ? objectItems
          : items.map((item) => ({ value: item }));

      buildDefinition(
        childName,
        `${displayName(originalKey)} Item`,
        childSamples.length > 0
          ? childSamples
          : [{ value: '' }]
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
        primitiveItems: objectItems.length === 0,
      };

      continue;
    }

    const objectValues = values.filter(isPlainObject);

    if (objectValues.length > 0) {
      const childName = safeComponentName(
        `${componentName}_${technicalKey}`
      );

      buildDefinition(
        childName,
        displayName(originalKey),
        objectValues
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

    const firstDefined = values.find(
      (value) => value !== null && value !== undefined
    );

    let type = 'textarea';

    if (typeof firstDefined === 'number') {
      type = 'number';
    } else if (typeof firstDefined === 'boolean') {
      type = 'boolean';
    } else if (typeof firstDefined === 'string') {
      type = inferTextType(values, originalKey);
    }

    schema[technicalKey] = {
      type,
      display_name: displayName(originalKey),
      ...(type === 'text' || type === 'textarea'
        ? {
            translatable: !isNonTranslatableKey(originalKey),
          }
        : {}),
    };

    plans[originalKey] = {
      technicalKey,
      kind: 'primitive',
      type,
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
      `No existe un plan de campos para ${componentName}`
    );
  }

  const block = {
    _uid: randomUUID(),
    component: componentName,
  };

  for (const [originalKey, plan] of Object.entries(plans)) {
    const value = data?.[originalKey];

    if (plan.kind === 'array') {
      const items = Array.isArray(value) ? value : [];

      block[plan.technicalKey] = items.map((item) =>
        toBlock(
          plan.childName,
          plan.primitiveItems ? { value: item } : item
        )
      );

      continue;
    }

    if (plan.kind === 'object') {
      block[plan.technicalKey] = isPlainObject(value)
        ? [toBlock(plan.childName, value)]
        : [];

      continue;
    }

    if (value === null || value === undefined) {
      block[plan.technicalKey] =
        plan.type === 'boolean' ? false : '';
    } else if (plan.type === 'number') {
      // Storyblok valida los campos Number como cadenas numéricas.
      block[plan.technicalKey] = String(value);
    } else if (plan.type === 'boolean') {
      block[plan.technicalKey] = Boolean(value);
    } else {
      block[plan.technicalKey] = value;
    }
  }

  return block;
}

const body = [];
const allowedTopLevelComponents = [];

for (const [sourceKey, componentName] of Object.entries(
  topLevelNames
)) {
  const rawValue = source[sourceKey];

  if (rawValue === undefined) {
    console.warn(
      `Aviso: no se encontró "${sourceKey}" en home.json`
    );
    continue;
  }

  const normalized = normalizeTopLevelSection(
    sourceKey,
    rawValue
  );

  buildDefinition(
    componentName,
    displayName(componentName),
    [normalized]
  );

  allowedTopLevelComponents.push(componentName);
  body.push(toBlock(componentName, normalized));
}

componentDefinitions.set('page', {
  name: 'page',
  display_name: 'Page',
  schema: {
    seo_title: {
      type: 'text',
      display_name: 'SEO Title',
      translatable: true,
    },
    seo_description: {
      type: 'textarea',
      display_name: 'SEO Description',
      translatable: true,
    },
    body: {
      type: 'bloks',
      display_name: 'Body',
      restrict_components: true,
      restrict_type: '',
      component_whitelist: allowedTopLevelComponents,
    },
  },
  is_root: true,
  is_nestable: false,
});

const pageContent = {
  _uid: randomUUID(),
  component: 'page',
  seo_title: source.meta?.title ?? '',
  seo_description: source.meta?.description ?? '',
  body,
};

async function getExistingComponents() {
  const response = await storyblok.get(
    `spaces/${spaceId}/components`
  );

  return response.data.components ?? [];
}

async function upsertComponents() {
  const existing = await getExistingComponents();
  const existingByName = new Map(
    existing.map((component) => [
      component.name,
      component,
    ])
  );

  for (const definition of componentDefinitions.values()) {
    const current = existingByName.get(definition.name);

    if (current) {
      await storyblok.put(
        `spaces/${spaceId}/components/${current.id}`,
        {
          component: definition,
        }
      );

      console.log(`Actualizado bloque: ${definition.name}`);
    } else {
      const response = await storyblok.post(
        `spaces/${spaceId}/components`,
        {
          component: definition,
        }
      );

      existingByName.set(
        definition.name,
        response.data.component
      );

      console.log(`Creado bloque: ${definition.name}`);
    }
  }
}

async function findHomeStory() {
  let page = 1;

  while (true) {
    const response = await storyblok.get(
      `spaces/${spaceId}/stories`,
      {
        page,
        per_page: 100,
      }
    );

    const stories = response.data.stories ?? [];
    const found = stories.find(
      (story) =>
        story.slug === 'home' &&
        Number(story.parent_id ?? 0) === 0
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

async function upsertHomeStory() {
  const current = await findHomeStory();

  const story = {
    name: 'Home',
    slug: 'home',
    parent_id: 0,
    content: pageContent,
  };

  if (current) {
    await storyblok.put(
      `spaces/${spaceId}/stories/${current.id}`,
      {
        story,
        publish: false,
      }
    );

    console.log('Actualizada Story: home');
    return;
  }

  await storyblok.post(
    `spaces/${spaceId}/stories`,
    {
      story,
      publish: false,
    }
  );

  console.log('Creada Story: home');
}

try {
  console.log(
    `Migrando home.json al espacio Storyblok ${spaceId}...`
  );

  await upsertComponents();
  await upsertHomeStory();

  console.log('');
  console.log('Migración terminada correctamente.');
  console.log(
    'La Story "home" se ha dejado como borrador.'
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
  console.error(`Error de Storyblok (${status}):`);
  console.error(details);
  process.exitCode = 1;
}
