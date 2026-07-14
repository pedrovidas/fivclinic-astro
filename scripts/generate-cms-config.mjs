/**
 * Genera public/admin/config.yml de Sveltia CMS a partir de src/content/*.json.
 * Garantiza que el panel cubre TODOS los campos (si faltara alguno, Sveltia
 * lo eliminaría al guardar). Ejecutar tras cambiar la estructura del contenido:
 *   node scripts/generate-cms-config.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';

// ====== AJUSTA ESTAS DOS LÍNEAS (ver instrucciones) ======
const GITHUB_REPO = 'pedrovidas/fivclinic-astro';
const AUTH_BASE_URL = 'https://sveltia-cms-auth.phenriquez.workers.dev';
// =========================================================

const LABELS = {
  meta: 'SEO (título y descripción)', title: 'Título', description: 'Descripción',
  hero: 'Cabecera (hero)', eyebrow: 'Antetítulo', titlePlain: 'Título (parte normal)',
  titleAccent: 'Título (parte naranja)', titleTail: 'Título (final)', lead: 'Entradilla',
  paragraphs: 'Párrafos', note: 'Nota', image: 'Imagen (URL)', instLogos: 'Logos institucionales (URL)',
  heroStats: 'Contadores de la cabecera', value: 'Número', suffix: 'Sufijo (+, %, K+)',
  label: 'Etiqueta', sublabel: 'Texto secundario', subItalic: 'Texto en cursiva', sub: 'Texto secundario',
  whoWeHelp: 'A quién ayudamos', cards: 'Tarjetas', tags: 'Subtexto', cta: 'Texto del enlace',
  href: 'Enlace (URL)', icon: 'Icono (URL)',
  clinicalEnvironment: 'Entorno clínico', intro: 'Introducción', collageImg: 'Imagen collage (URL)',
  points: 'Puntos', text: 'Texto', badges: 'Insignias',
  socialProof: 'Banda "Get on a path"', ctaText: 'Texto del botón', ctaHref: 'Enlace del botón',
  whyBarcelona: 'Por qué Barcelona', reasons: 'Razones',
  processSteps: 'Proceso paso a paso', steps: 'Pasos', listIntro: 'Intro de la lista', list: 'Lista',
  respected: 'Excelencia institucional', stats: 'Contadores', membersLabel: 'Etiqueta "Members:"',
  patientVoices: 'Testimonios', testimonials: 'Testimonios', quote: 'Cita', author: 'Autor',
  supportFaq: 'Soporte y FAQs', faqs: 'Preguntas frecuentes', q: 'Pregunta', a: 'Respuesta',
  foot: 'Texto final', medicalRecognition: 'Reconocimiento médico',
  listTitle1: 'Título lista 1', list1: 'Lista 1', listTitle2: 'Título lista 2', list2: 'Lista 2',
  closing: 'Cierre', img: 'Imagen (URL)', leadForm: 'Formulario final',
  ageGroups: 'Grupos de edad', submitText: 'Texto del botón enviar',
  rigorItems: 'Rigor científico', evaluateGroups: 'Grupos de evaluación', items: 'Elementos',
  counters: 'Contadores', intlFaqs: 'FAQs internacionales', blocks: 'Bloques especializados',
  groups: 'Grupos', boxed: 'En caja destacada', hint: 'Texto de la guía descargable',
  imageSide: 'Lado de la imagen (left/right)', boxIntro: 'Intro de la caja',
  profileCards: 'Tarjetas de perfil', emotionQuestions: 'Preguntas emocionales',
  donorTestimonials: 'Testimonios', rplTestimonials: 'Testimonios', cfcTestimonials: 'Testimonios',
  fpTestimonials: 'Testimonios', swTestimonials: 'Testimonios', realFaqs: 'Preguntas frecuentes',
  planningFaqs: 'FAQs de planificación', medicalTeam: 'Equipo médico', nursingTeam: 'Equipo de enfermería',
  adminTeam: 'Equipo de administración', name: 'Nombre', people: 'Personas', photo: 'Foto (URL)',
  roles: 'Cargos', spec: 'Especialidades', social: 'Redes sociales', linkedin: 'LinkedIn',
  x: 'X (Twitter)', doctoralia: 'Doctoralia', sidebar: 'Barra lateral',
  whatsappNumber: 'Número de WhatsApp', address: 'Dirección', mapQuery: 'Dirección para el mapa',
  whyChoose: 'Por qué elegirnos', supportItems: 'Apoyo internacional', strong: 'Parte en negrita',
  accent: 'Parte naranja', rest: 'Resto', form: 'Formulario', languages: 'Idiomas',
};
const label = (k) => LABELS[k] ?? k;

function fieldsFor(value, key) {
  if (typeof value === 'number') return { widget: 'number' };
  if (typeof value === 'boolean') return { widget: 'boolean', required: false };
  if (typeof value === 'string' || value === null) {
    const long = typeof value === 'string' && (value.length > 90 || value.includes('<'));
    return { widget: long ? 'text' : 'string', required: false };
  }
  if (Array.isArray(value)) {
    const sample = value.find((v) => v !== null) ?? '';
    if (typeof sample === 'string') return { widget: 'list', required: false };
    // lista de objetos: unión de claves de todos los elementos
    const keys = [...new Set(value.flatMap((o) => Object.keys(o ?? {})))];
    return {
      widget: 'list', required: false,
      fields: keys.map((k) => ({ name: k, label: label(k), ...fieldsFor(pick(value, k), k) })),
    };
  }
  // objeto
  return {
    widget: 'object', required: false,
    fields: Object.entries(value).map(([k, v]) => ({ name: k, label: label(k), ...fieldsFor(v, k) })),
  };
}
// valor representativo de la clave k en una lista de objetos (fusiona objetos para no perder claves)
const pick = (arr, k) => {
  const vals = arr.filter((o) => o && o[k] !== undefined && o[k] !== null).map((o) => o[k]);
  if (!vals.length) return '';
  if (typeof vals[0] === 'object' && !Array.isArray(vals[0])) return Object.assign({}, ...vals);
  if (Array.isArray(vals[0])) return vals.flat();
  return vals[0];
};

const yaml = (obj, indent = 0) => {
  const pad = '  '.repeat(indent);
  if (Array.isArray(obj)) return obj.map((v) => pad + '- ' + yaml(v, indent + 1).trimStart()).join('\n');
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).map(([k, v]) => {
      if (v && typeof v === 'object') return `${pad}${k}:\n${yaml(v, indent + 1)}`;
      const s = typeof v === 'string' && /[:#'"{}\[\]]|^\s|\s$/.test(v) ? JSON.stringify(v) : v;
      return `${pad}${k}: ${s}`;
    }).join('\n');
  }
  return pad + String(obj);
};

const PAGE_LABELS = {
  'home': 'Página de inicio (Home)',
  'rpl': 'Recurrent Pregnancy Loss',
  'ivf-with-donor-eggs': 'IVF with Donor Eggs',
  'complex-fertility-cases': 'Complex Fertility Cases',
  'fertility-preservation-in-barcelona': 'Fertility Preservation',
  'fertility-for-single-women-female-couples': 'Single Women & Female Couples',
  'our-team': 'Nuestro equipo',
  'contact-us': 'Contacto',
};

const files = readdirSync('src/content').filter((f) => f.endsWith('.json'));
const collections = [{
  name: 'paginas',
  label: 'Páginas del sitio',
  description: 'Editas el contenido en INGLÉS (idioma base). Los demás idiomas se regeneran con el sistema de traducción tras publicar.',
  files: files.map((f) => {
    const slug = f.replace('.json', '');
    const data = JSON.parse(readFileSync(`src/content/${f}`, 'utf8'));
    return {
      name: slug,
      label: PAGE_LABELS[slug] ?? slug,
      file: `src/content/${f}`,
      fields: Object.entries(data).map(([k, v]) => ({ name: k, label: label(k), ...fieldsFor(v, k) })),
    };
  }),
}];

const config = {
  backend: { name: 'github', repo: GITHUB_REPO, branch: 'main', base_url: AUTH_BASE_URL },
  media_folder: 'public/media',
  public_folder: '/media',
  site_url: 'https://fivclinicinternational.vercel.app',
  display_url: 'https://fivclinicinternational.vercel.app',
  collections,
};

mkdirSync('public/admin', { recursive: true });
writeFileSync('public/admin/config.yml', yaml(config) + '\n');
console.log(`config.yml generado: ${files.length} páginas, backend ${GITHUB_REPO}`);
