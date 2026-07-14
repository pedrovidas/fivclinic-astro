import {
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

const helperImport =
  "import { getStoryblokPageContent } " +
  "from '../lib/storyblokPageContent.js';";

async function connectRpl() {
  const filePath = path.join(
    projectRoot,
    'src',
    'pages',
    'rpl.astro',
  );

  let source = await readFile(filePath, 'utf8');

  if (
    source.includes(
      "getStoryblokPageContent"
    ) &&
    source.includes("'rpl'")
  ) {
    console.log('Ya conectada: rpl.astro');
    return;
  }

  const oldImport =
    "import content from '../content/rpl.json';";

  if (!source.includes(oldImport)) {
    throw new Error(
      'No se encontró la importación de rpl.json ' +
      'en src/pages/rpl.astro.'
    );
  }

  const replacement = [
    helperImport,
    '',
    'const content = await getStoryblokPageContent(',
    "  'rpl',",
    '  Astro.locals,',
    ');',
  ].join('\n');

  source = source.replace(
    oldImport,
    replacement,
  );

  await writeFile(filePath, source, 'utf8');
  console.log('Conectada página: rpl.astro');
}

async function connectOurTeam() {
  const filePath = path.join(
    projectRoot,
    'src',
    'pages',
    'our-team.astro',
  );

  let source = await readFile(filePath, 'utf8');

  if (
    source.includes(
      "getStoryblokPageContent"
    ) &&
    source.includes("'our-team'")
  ) {
    console.log('Ya conectada: our-team.astro');
    return;
  }

  const oldImport =
    "import { medicalTeam, nursingTeam, adminTeam } " +
    "from '../data/team';";

  if (!source.includes(oldImport)) {
    throw new Error(
      'No se encontró la importación de ../data/team ' +
      'en src/pages/our-team.astro.'
    );
  }

  const replacement = [
    helperImport,
    '',
    'const content = await getStoryblokPageContent(',
    "  'our-team',",
    '  Astro.locals,',
    ');',
    '',
    'const medicalTeam = content.medicalTeam ?? [];',
    'const nursingTeam = content.nursingTeam ?? [];',
    'const adminTeam = content.adminTeam ?? [];',
  ].join('\n');

  source = source.replace(
    oldImport,
    replacement,
  );

  await writeFile(filePath, source, 'utf8');
  console.log('Conectada página: our-team.astro');
}

try {
  await connectRpl();
  await connectOurTeam();

  console.log('');
  console.log(
    'Listo: rpl y our-team ya leen Storyblok.'
  );
} catch (error) {
  console.error('');
  console.error(error);
  process.exitCode = 1;
}
