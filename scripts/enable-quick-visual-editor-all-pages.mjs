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

const helperPath = path.join(
  projectRoot,
  'src',
  'lib',
  'storyblokPageContent.js',
);

const pageFiles = [
  'complex-fertility-cases.astro',
  'contact-us.astro',
  'fertility-for-single-women-female-couples.astro',
  'fertility-preservation-in-barcelona.astro',
  'ivf-with-donor-eggs.astro',
  'our-team.astro',
  'rpl.astro',
];

function addRawStoryblokBlock(source) {
  if (source.includes("'__storyblok'")) {
    return source;
  }

  const pattern =
    /return\s+toLegacyContent\(\s*dataBlock\s*\)\s*;/;

  if (!pattern.test(source)) {
    throw new Error(
      'No se encontró "return toLegacyContent(dataBlock)" ' +
      'en src/lib/storyblokPageContent.js.',
    );
  }

  return source.replace(
    pattern,
    `const legacyContent =
    toLegacyContent(dataBlock);

  if (
    legacyContent &&
    typeof legacyContent === 'object'
  ) {
    Object.defineProperty(
      legacyContent,
      '__storyblok',
      {
        value: dataBlock,
        enumerable: false,
      },
    );
  }

  return legacyContent;`,
  );
}

function findFrontmatterEnd(source) {
  if (!source.startsWith('---')) {
    throw new Error(
      'El archivo no comienza con frontmatter Astro.',
    );
  }

  const end = source.indexOf('\n---', 3);

  if (end === -1) {
    throw new Error(
      'No se encontró el cierre del frontmatter Astro.',
    );
  }

  return end;
}

function findOpeningTagEnd(source, start) {
  let quote = null;
  let braceDepth = 0;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    const previous = source[index - 1];

    if (quote) {
      if (
        character === quote &&
        previous !== '\\'
      ) {
        quote = null;
      }

      continue;
    }

    if (
      character === '"' ||
      character === "'" ||
      character === '`'
    ) {
      quote = character;
      continue;
    }

    if (character === '{') {
      braceDepth += 1;
      continue;
    }

    if (character === '}') {
      braceDepth = Math.max(
        0,
        braceDepth - 1,
      );
      continue;
    }

    if (
      character === '>' &&
      braceDepth === 0
    ) {
      return index;
    }
  }

  return -1;
}

function addStoryblokImport(source) {
  if (
    source.includes(
      "storyblokEditable",
    )
  ) {
    return source;
  }

  return source.replace(
    /^---\n/,
    `---
import {
  storyblokEditable,
} from '@storyblok/astro';
`,
  );
}

function addEditableAttributes(source) {
  if (
    source.includes(
      'const storyblokPageAttributes',
    )
  ) {
    return source;
  }

  const frontmatterEnd =
    findFrontmatterEnd(source);

  const declaration = `

const storyblokPageAttributes =
  content.__storyblok
    ? storyblokEditable(content.__storyblok)
    : {};
`;

  return (
    source.slice(0, frontmatterEnd) +
    declaration +
    source.slice(frontmatterEnd)
  );
}

function wrapLayoutContent(source) {
  if (
    source.includes(
      'class="storyblok-page-editable"',
    )
  ) {
    return source;
  }

  const frontmatterEnd =
    findFrontmatterEnd(source);

  const layoutStart = source.indexOf(
    '<Layout',
    frontmatterEnd,
  );

  if (layoutStart === -1) {
    throw new Error(
      'No se encontró el componente <Layout>.',
    );
  }

  const openingEnd = findOpeningTagEnd(
    source,
    layoutStart,
  );

  if (openingEnd === -1) {
    throw new Error(
      'No se pudo localizar el cierre del tag <Layout>.',
    );
  }

  const closingTag = '</Layout>';
  const layoutEnd = source.lastIndexOf(
    closingTag,
  );

  if (
    layoutEnd === -1 ||
    layoutEnd <= openingEnd
  ) {
    throw new Error(
      'No se encontró el cierre </Layout>.',
    );
  }

  const openingWrapper = `
  <div
    class="storyblok-page-editable"
    style="display: contents"
    {...storyblokPageAttributes}
  >`;

  const closingWrapper = `
  </div>
`;

  return (
    source.slice(0, openingEnd + 1) +
    openingWrapper +
    source.slice(openingEnd + 1, layoutEnd) +
    closingWrapper +
    source.slice(layoutEnd)
  );
}

function transformPage(source) {
  let transformed = source.replace(
    /\r\n/g,
    '\n',
  );

  transformed =
    addStoryblokImport(transformed);

  transformed =
    addEditableAttributes(transformed);

  transformed =
    wrapLayoutContent(transformed);

  return transformed;
}

/*
 * Primero valida y transforma TODOS los archivos en memoria.
 * No escribe nada si alguno no cumple la estructura esperada.
 */
const originalHelper = await readFile(
  helperPath,
  'utf8',
);

const transformedHelper =
  addRawStoryblokBlock(
    originalHelper.replace(/\r\n/g, '\n'),
  );

const transformedPages = [];

for (const file of pageFiles) {
  const filePath = path.join(
    projectRoot,
    'src',
    'pages',
    file,
  );

  const original = await readFile(
    filePath,
    'utf8',
  );

  const transformed =
    transformPage(original);

  transformedPages.push({
    file,
    filePath,
    original,
    transformed,
  });
}

console.log(
  'Todos los archivos han sido validados.',
);

/*
 * Solo después de validar todo se crean backups y se escriben cambios.
 */
await copyFile(
  helperPath,
  `${helperPath}.before-quick-visual-editor.bak`,
);

await writeFile(
  helperPath,
  transformedHelper,
  'utf8',
);

for (const page of transformedPages) {
  await copyFile(
    page.filePath,
    `${page.filePath}.before-quick-visual-editor.bak`,
  );

  await writeFile(
    page.filePath,
    page.transformed,
    'utf8',
  );

  console.log(
    `Editor rápido activado: ${page.file}`,
  );
}

console.log('');
console.log(
  'Editor visual rápido activado en las siete páginas.',
);
console.log('');
console.log('Ahora ejecuta:');
console.log('  npm run dev');
