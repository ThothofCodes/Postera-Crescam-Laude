import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://blog.pcl.co.ke',
  
  // Image optimization
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  
  // Vite configuration
  vite: {
    define: {
      'import.meta.env.PUBLIC_SANITY_PROJECT_ID': JSON.stringify(process.env.SANITY_PROJECT_ID || ''),
      'import.meta.env.PUBLIC_SANITY_DATASET': JSON.stringify(process.env.SANITY_DATASET || 'production'),
    },
  },
});
