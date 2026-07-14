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

const PAGES = [
  {
    slug: 'complex-fertility-cases',
    name: 'Complex Fertility Cases',
    file: 'complex-fertility-cases.json',
  },
  {
    slug: 'contact-us',
    name: 'Contact Us',
    file: 'contact-us.json',
  },
  {
    slug: 'fertility-for-single-women-female-couples',
    name: 'Fertility for Single Women & Female Couples',
    file: 'fertility-for-single-women-female-couples.json',
  },
  {
    slug: 'fertility-preservation-in-barcelona',
    name: 'Fertility Preservation in Barcelona',
    file: 'fertility-preservation-in-barcelona.json',
  },
  {
    slug: 'ivf-with-donor-eggs',
    name: 'IVF with Donor Eggs',
    file: 'ivf-with-donor-eggs.json',
  },
  {
    slug: 'our-team',
    name: 'Our Team',
    file: 'our-team.json',
  },
  {
    slug: 'rpl',
    name: 'Repeated Pregnancy Loss',
    file: 'rpl.json',
  },
];

const storyblok = new StoryblokClient({
  oauthToken,
});

const componentDefinitions = new Map();
const fieldPlans = new Map();

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function apiRequest(method, endpoint, payload, attempt = 1) {
  try {
    const response =
      method === 'get'
        ? await storyblok.get(endpoint, payload)
        : method === 'post'
          ? await storyblok.post(endpoint, payload)
          : await storyblok.put(endpoint, payload);

    // El plan Starter admite 3 peticiones por segundo.
    await wait(380);
    return response;
  } catch (error) {
    const status =
      error?.response?.status ??
      error?.status;

    if ((status === 429 || status >= 500) && attempt < 6) {
      const delay = 700 * attempt;
      console.warn(
        `Reintentando ${endpoint} en ${delay} ms...`
      );
      await wait(delay);
      return apiRequest(
        method,
        endpoint,
        payload,
        attempt + 1
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
  return /(href|url|path|slug|image|img|icon|logo|logos|side|variant|id)$/i.test(
    key
  );
}

function inferTextType(values, key) {
  const strings = values.filter(
    (value) => typeof value === 'string'
  );

  const maxLength = Math.max(
    0,
    ...strings.map((value) => value.length)
  );

  const looksLong =
    /(lead|intro|description|paragraph|text|note|quote|closing|answer|subtitle|sub|hint|footer|html|content)$/i.test(
      key
    );

  const containsLineBreak = strings.some((value) =>
    value.includes('\n')
  );

  return looksLong || containsLineBreak || maxLength > 90
    ? 'textarea'
    : 'text';
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
      const primitiveItems = items.filter(
        (item) => !isPlainObject(item)
      );

      if (
        objectItems.length > 0 &&
        primitiveItems.length > 0
      ) {
        throw new Error(
          `El campo ${componentName}.${originalKey} mezcla ` +
          'objetos y valores simples. Revísalo manualmente.'
        );
      }

      const childName = safeComponentName(
        `${componentName}_${technicalKey}_item`
      );

      const usesPrimitiveItems = objectItems.length === 0;

      const childSamples = usesPrimitiveItems
        ? (
            primitiveItems.length > 0
              ? primitiveItems.map((item) => ({
                  value: item,
                }))
              : [{ value: '' }]
          )
        : objectItems;

      buildDefinition(
        childName,
        `${displayName(originalKey)} Item`,
        childSamples
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
        primitiveItems: usesPrimitiveItems,
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
      (value) =>
        value !== null &&
        value !== undefined
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
            translatable:
              !isNonTranslatableKey(originalKey),
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
          plan.primitiveItems
            ? { value: item }
            : item
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
      block[plan.technicalKey] = String(value);
    } else if (plan.type === 'boolean') {
      block[plan.technicalKey] = Boolean(value);
    } else {
      block[plan.technicalKey] = value;
    }
  }

  return block;
}

async function loadSources() {
  const loadedPages = [];

  for (const page of PAGES) {
    const sourcePath = path.join(
      projectRoot,
      'src',
      'content',
      page.file
    );

    const source = JSON.parse(
      await readFile(sourcePath, 'utf8')
    );

    const componentName = safeComponentName(
      `page_data_${page.slug}`
    );

    buildDefinition(
      componentName,
      `${page.name} Data`,
      [source]
    );

    loadedPages.push({
      ...page,
      componentName,
      source,
      block: toBlock(componentName, source),
    });
  }

  return loadedPages;
}

async function getExistingComponents() {
  const response = await apiRequest(
    'get',
    `spaces/${spaceId}/components`
  );

  return response.data.components ?? [];
}

async function upsertGeneratedComponents(
  existingByName
) {
  for (const definition of componentDefinitions.values()) {
    const current = existingByName.get(definition.name);

    if (current) {
      await apiRequest(
        'put',
        `spaces/${spaceId}/components/${current.id}`,
        {
          component: definition,
        }
      );

      console.log(
        `Actualizado bloque: ${definition.name}`
      );
    } else {
      const response = await apiRequest(
        'post',
        `spaces/${spaceId}/components`,
        {
          component: definition,
        }
      );

      existingByName.set(
        definition.name,
        response.data.component
      );

      console.log(
        `Creado bloque: ${definition.name}`
      );
    }
  }
}

async function mergePageComponent(
  existingByName,
  pageComponents
) {
  const current = existingByName.get('page');

  if (!current) {
    throw new Error(
      'No existe el componente raíz "page".'
    );
  }

  const existingSchema = current.schema ?? {};
  const existingBody = existingSchema.body ?? {
    type: 'bloks',
    display_name: 'Body',
  };

  const existingWhitelist =
    existingBody.component_whitelist ?? [];

  const mergedWhitelist = [
    ...new Set([
      ...existingWhitelist,
      ...pageComponents,
    ]),
  ];

  const updated = {
    name: current.name,
    display_name:
      current.display_name ?? 'Page',
    schema: {
      ...existingSchema,
      body: {
        ...existingBody,
        type: 'bloks',
        display_name:
          existingBody.display_name ?? 'Body',
        restrict_components: true,
        restrict_type: '',
        component_whitelist: mergedWhitelist,
      },
    },
    is_root: true,
    is_nestable: false,
  };

  await apiRequest(
    'put',
    `spaces/${spaceId}/components/${current.id}`,
    {
      component: updated,
    }
  );

  console.log(
    'Actualizado bloque: page (whitelist combinada)'
  );
}

async function getAllStories() {
  const stories = [];
  let page = 1;

  while (true) {
    const response = await apiRequest(
      'get',
      `spaces/${spaceId}/stories`,
      {
        page,
        per_page: 100,
      }
    );

    const batch = response.data.stories ?? [];
    stories.push(...batch);

    if (batch.length < 100) {
      return stories;
    }

    page += 1;
  }
}

async function upsertStories(loadedPages) {
  const stories = await getAllStories();

  for (const page of loadedPages) {
    const current = stories.find(
      (story) =>
        story.slug === page.slug &&
        Number(story.parent_id ?? 0) === 0
    );

    const content = {
      _uid: randomUUID(),
      component: 'page',
      seo_title: '',
      seo_description: '',
      body: [page.block],
    };

    const story = {
      name: page.name,
      slug: page.slug,
      parent_id: 0,
      content,
    };

    if (current) {
      await apiRequest(
        'put',
        `spaces/${spaceId}/stories/${current.id}`,
        {
          story,
          publish: false,
        }
      );

      console.log(
        `Actualizada Story: ${page.slug}`
      );
    } else {
      await apiRequest(
        'post',
        `spaces/${spaceId}/stories`,
        {
          story,
          publish: false,
        }
      );

      console.log(
        `Creada Story: ${page.slug}`
      );
    }
  }
}

try {
  console.log(
    `Migrando ${PAGES.length} páginas al espacio ` +
    `Storyblok ${spaceId}...`
  );

  const loadedPages = await loadSources();
  const existing = await getExistingComponents();

  const existingByName = new Map(
    existing.map((component) => [
      component.name,
      component,
    ])
  );

  await upsertGeneratedComponents(existingByName);

  await mergePageComponent(
    existingByName,
    loadedPages.map(
      (page) => page.componentName
    )
  );

  await upsertStories(loadedPages);

  console.log('');
  console.log(
    'Migración terminada correctamente.'
  );
  console.log(
    'Las siete Stories se han dejado como borrador.'
  );
  console.log(
    'La Story Home no se ha modificado.'
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
    `Error de Storyblok (${status}):`
  );
  console.error(details);
  process.exitCode = 1;
}
