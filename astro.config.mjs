// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { storyblok } from '@storyblok/astro';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), 'STORYBLOK_');

// https://astro.build/config
export default defineConfig({
  output: 'static',

  adapter: vercel(),

  site: 'https://fivclinic.es',

  integrations: [
    storyblok({
      accessToken: env.STORYBLOK_DELIVERY_API_TOKEN,

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