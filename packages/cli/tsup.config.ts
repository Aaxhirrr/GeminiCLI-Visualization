import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    sourcemap: true,
    clean: true,
    banner: {
        js: '#!/usr/bin/env node',
    },
    // External packages that shouldn't be bundled
    external: ['puppeteer', 'sharp', 'sixel'],
});
