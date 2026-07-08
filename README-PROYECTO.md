# FIVclínic+ — Mockup en Astro

## Estado actual
- ✅ Proyecto Astro configurado con adaptador de Vercel (`@astrojs/vercel`)
- ✅ Sistema de diseño (`src/styles/global.css`) con colores y tipografías reales extraídas del sitio
- ✅ Header + Footer compartidos (`src/components/`)
- ✅ Home completa (`src/pages/index.astro`) con las 11 secciones del original

## Pendiente
- [ ] 7 páginas restantes (5 tratamientos + Our Team + Contact Us + Fertility Assessment)
- [ ] Sustituir los placeholders de imagen por los archivos reales
- [ ] Subir las fuentes Bryant Pro (.woff2) a `public/fonts/`
- [ ] Revisar copy con el cliente

## Cómo correr en local
```
npm install
npm run dev
```

## Cómo desplegar en Vercel
1. Sube este proyecto a un repo de GitHub
2. Entra a vercel.com → "Add New Project" → importa el repo
3. Vercel detecta Astro automáticamente (build command: `astro build`, output: `.vercel/output`)
4. Deploy

## Imágenes pendientes de sustituir
Cada placeholder tiene un comentario `<!-- TODO reemplazar -->` justo encima en el código fuente,
indicando qué imagen va ahí. Colócalas en `public/images/` y actualiza el `src` en el componente,
o pásamelas y las integro yo.
