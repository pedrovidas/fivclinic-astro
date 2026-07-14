import {
  readFile,
  writeFile,
} from 'node:fs/promises';

import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const projectRoot =
  path.resolve(__dirname, '..');

const standardPages = [
  {
    slug: 'complex-fertility-cases',
    file: 'complex-fertility-cases.astro',
    json: 'complex-fertility-cases.json',
  },
  {
    slug: 'contact-us',
    file: 'contact-us.astro',
    json: 'contact-us.json',
  },
  {
    slug: 'fertility-for-single-women-female-couples',
    file: 'fertility-for-single-women-female-couples.astro',
    json: 'fertility-for-single-women-female-couples.json',
  },
  {
    slug: 'fertility-preservation-in-barcelona',
    file: 'fertility-preservation-in-barcelona.astro',
    json: 'fertility-preservation-in-barcelona.json',
  },
  {
    slug: 'ivf-with-donor-eggs',
    file: 'ivf-with-donor-eggs.astro',
    json: 'ivf-with-donor-eggs.json',
  },
  {
    slug: 'rpl',
    file: 'rpl.astro',
    json: 'rpl.json',
  },
];

const helperImport =
  "import { getStoryblokPageContent } " +
  "from '../lib/storyblokPageContent.js';";

async function connectStandardPage(page) {
  const filePath = path.join(
    projectRoot,
    'src',
    'pages',
    page.file,
  );

  let source = await readFile(
    filePath,
    'utf8',
  );

  if (
    source.includes(
      `getStoryblokPageContent('${page.slug}'`
    )
  ) {
    console.log(
      `Ya conectada: ${page.file}`
    );
    return;
  }

  const oldImport =
    `import content from '../content/${page.json}';`;

  if (!source.includes(oldImport)) {
    throw new Error(
      `No se encontró esta importación en ${page.file}:\n` +
        oldImport
    );
  }

  const replacement = [
    helperImport,
    '',
    `const content = await getStoryblokPageContent(`,
    `  '${page.slug}',`,
    `  Astro.locals,`,
    `);`,
  ].join('\n');

  source = source.replace(
    oldImport,
    replacement,
  );

  await writeFile(
    filePath,
    source,
    'utf8',
  );

  console.log(
    `Conectada página: ${page.file}`
  );
}

async function connectOurTeam() {
  const filePath = path.join(
    projectRoot,
    'src',
    'pages',
    'our-team.astro',
  );

  let source = await readFile(
    filePath,
    'utf8',
  );

  if (
    source.includes(
      "getStoryblokPageContent('our-team'"
    )
  ) {
    console.log(
      'Ya conectada: our-team.astro'
    );
    return;
  }

  const oldImport =
    "import { medicalTeam, nursingTeam, adminTeam } " +
    "from '../data/team';";

  if (!source.includes(oldImport)) {
    throw new Error(
      'No se encontró la importación especial de equipos ' +
      'en our-team.astro.'
    );
  }

  const replacement = [
    helperImport,
    '',
    `const content = await getStoryblokPageContent(`,
    `  'our-team',`,
    `  Astro.locals,`,
    `);`,
    '',
    `const medicalTeam = content.medicalTeam ?? [];`,
    `const nursingTeam = content.nursingTeam ?? [];`,
    `const adminTeam = content.adminTeam ?? [];`,
  ].join('\n');

  source = source.replace(
    oldImport,
    replacement,
  );

  await writeFile(
    filePath,
    source,
    'utf8',
  );

  console.log(
    'Conectada página: our-team.astro'
  );
}

try {
  for (const page of standardPages) {
    await connectStandardPage(page);
  }

  await connectOurTeam();

  console.log('');
  console.log(
    'Las siete páginas ya leen Storyblok.'
  );
  console.log(
    'Los JSON locales permanecen como fallback de seguridad.'
  );
} catch (error) {
  console.error('');
  console.error(error);
  process.exitCode = 1;
}
