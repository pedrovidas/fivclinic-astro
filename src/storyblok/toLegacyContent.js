const STORYBLOK_META_KEYS = new Set([
  '_uid',
  '_editable',
  'component',
]);

function camelCase(value) {
  return String(value).replace(
    /_([a-z0-9])/g,
    (_, character) => character.toUpperCase(),
  );
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function isNumericValue(value) {
  return (
    typeof value === 'string' &&
    value.trim() !== '' &&
    /^-?\d+(?:\.\d+)?$/.test(value.trim())
  );
}

/**
 * Converts Storyblok's snake_case, nested block representation
 * back into the camelCase objects expected by the existing components.
 */
export function toLegacyContent(value, parentKey = '') {
  if (Array.isArray(value)) {
    const converted = value.map((item) =>
      toLegacyContent(item, parentKey),
    );

    const isPrimitiveBlockList = converted.every(
      (item) =>
        isPlainObject(item) &&
        Object.keys(item).length === 1 &&
        Object.hasOwn(item, 'value'),
    );

    if (isPrimitiveBlockList) {
      return converted.map((item) => item.value);
    }

    return converted;
  }

  if (!isPlainObject(value)) {
    if (parentKey === 'value' && isNumericValue(value)) {
      return Number(value);
    }

    return value;
  }

  const output = {};

  for (const [key, item] of Object.entries(value)) {
    if (STORYBLOK_META_KEYS.has(key)) {
      continue;
    }

    const convertedKey = camelCase(key);

    output[convertedKey] = toLegacyContent(
      item,
      convertedKey,
    );
  }

  return output;
}

export function normalizeHomeBlock(blok) {
  const content = toLegacyContent(blok);

  if (blok.component === 'hero_home') {
    content.paragraphs = [
      content.paragraph1,
      content.paragraph2,
    ].filter(Boolean);

    delete content.paragraph1;
    delete content.paragraph2;

    content.instLogos = content.institutionalLogos;
    delete content.institutionalLogos;
  }

  return content;
}
