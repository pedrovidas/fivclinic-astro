// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { storyblok } from '@storyblok/astro';
import { loadEnv } from 'vite';

const fileEnv = loadEnv('', process.cwd(), '');

const storyblokToken =
  process.env.STORYBLOK_DELIVERY_API_TOKEN ??
  fileEnv.STORYBLOK_DELIVERY_API_TOKEN;

const visualPreview =
  (
    process.env.STORYBLOK_VISUAL_PREVIEW ??
    fileEnv.STORYBLOK_VISUAL_PREVIEW
  ) === 'true';

export default defineConfig({
  output: visualPreview ? 'server' : 'static',

  adapter: vercel(),

  site: 'https://fivclinic.es',

  integrations: [
    storyblok({
      accessToken: storyblokToken,
      livePreview: visualPreview,

      apiOptions: {
        region: 'eu',
      },

      components: {
  page: 'storyblok/Page',
  hero_home: 'storyblok/HomeSection',
  hero_stats: 'storyblok/HomeSection',
  who_we_help: 'storyblok/HomeSection',
  clinical_environment: 'storyblok/HomeSection',
  social_proof: 'storyblok/HomeSection',
  why_barcelona: 'storyblok/HomeSection',
  process_steps: 'storyblok/HomeSection',
  respected_by_excellence: 'storyblok/HomeSection',
  patient_voices: 'storyblok/HomeSection',
  support_faq: 'storyblok/HomeSection',
  medical_recognition: 'storyblok/HomeSection',
  lead_form: 'storyblok/HomeSection',
},
    }),
  ],
});