import {
  getPayload,
  useStoryblokApi,
} from '@storyblok/astro';

import {
  toLegacyContent,
} from '../storyblok/toLegacyContent.js';

const FALLBACK_LOADERS = {
  'complex-fertility-cases': () =>
    import('../content/complex-fertility-cases.json'),
  'contact-us': () =>
    import('../content/contact-us.json'),
  'fertility-for-single-women-female-couples': () =>
    import('../content/fertility-for-single-women-female-couples.json'),
  'fertility-preservation-in-barcelona': () =>
    import('../content/fertility-preservation-in-barcelona.json'),
  'ivf-with-donor-eggs': () =>
    import('../content/ivf-with-donor-eggs.json'),
  'our-team': () =>
    import('../content/our-team.json'),
  rpl: () =>
    import('../content/rpl.json'),
};

function readEnv(name) {
  return (
    process.env[name] ??
    import.meta.env[name]
  );
}

function isVisualPreviewEnabled() {
  return (
    readEnv('STORYBLOK_VISUAL_PREVIEW') === 'true'
  );
}

function getContentVersion() {
  const configured = readEnv(
    'STORYBLOK_CONTENT_VERSION'
  );

  if (
    configured === 'draft' ||
    configured === 'published'
  ) {
    return configured;
  }

  return isVisualPreviewEnabled()
    ? 'draft'
    : 'published';
}

function storyMatchesSlug(story, slug) {
  if (!story) {
    return false;
  }

  const candidates = [
    story.slug,
    story.full_slug,
    story.path,
  ]
    .filter(Boolean)
    .map((value) =>
      String(value).replace(/^\/|\/$/g, '')
    );

  return candidates.includes(slug);
}

async function loadFallback(slug) {
  const loader = FALLBACK_LOADERS[slug];

  if (!loader) {
    throw new Error(
      `No existe fallback local para "${slug}".`
    );
  }

  const module = await loader();
  return module.default;
}

/**
 * Reads a Storyblok Story and converts its first page_data_* block
 * back into the same camelCase object used by the old JSON files.
 *
 * During the migration, if Storyblok is unavailable or the Story
 * is not published, the local JSON is used as a safe fallback.
 */
export async function getStoryblokPageContent(
  slug,
  locals,
) {
  const visualPreview =
    isVisualPreviewEnabled();

  let story = null;

  if (visualPreview && locals) {
    try {
      const payload = await getPayload({
        locals,
      });

      if (
        storyMatchesSlug(payload?.story, slug)
      ) {
        story = payload.story;
      }
    } catch (error) {
      console.warn(
        `[Storyblok] No se pudo leer el payload visual de "${slug}".`,
        error,
      );
    }
  }

  if (!story) {
    try {
      const storyblokApi =
        useStoryblokApi();

      const version = getContentVersion();

      const params = {
        version,
      };

      if (version === 'draft') {
        params.cv = Date.now();
      }

      const response =
        await storyblokApi.get(
          `cdn/stories/${slug}`,
          params,
        );

      story = response.data.story;
    } catch (error) {
      console.warn(
        `[Storyblok] No se pudo cargar "${slug}". ` +
          'Se utilizará el JSON local.',
        error,
      );

      return loadFallback(slug);
    }
  }

  const body = story?.content?.body;

  const dataBlock = Array.isArray(body)
    ? (
        body.find((block) =>
          String(block?.component ?? '')
            .startsWith('page_data_')
        ) ??
        body[0]
      )
    : null;

  if (!dataBlock) {
    console.warn(
      `[Storyblok] La Story "${slug}" no contiene ` +
        'un bloque page_data_*. Se utilizará el JSON local.',
    );

    return loadFallback(slug);
  }

  return toLegacyContent(dataBlock);
}
