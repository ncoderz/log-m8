import type { Plugin } from 'esbuild';
import { defineConfig } from 'tsup';

/**
 * This plugin strips code blocks marked with block comments STRIP:START and STRIP:END.
 *
 * It is used to remove node specific code from the browser builds.
 *
 * @returns {Plugin} An esbuild plugin that strips code blocks marked with block comments STRIP:START and STRIP:END.
 */
const stripNodeJsBlock = (): Plugin => ({
  name: 'strip-nodejs-block',
  setup(build) {
    const pattern = /\/\*\s*NODEJS:START\s*\*\/[\s\S]*?\/\*\s*NODEJS:END\s*\*\//g;

    build.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
      const fs = await import('fs/promises');
      let code = await fs.readFile(args.path, 'utf8');

      code = code.replace(pattern, '');
      return { contents: code, loader: args.path.endsWith('.ts') ? 'ts' : 'js' };
    });
  },
});

const browserDefines = {
  // NONE AS YET
};

export default defineConfig([
  // Node builds (CJS + ESM)
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    target: 'es2020',
    outDir: 'dist',
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    splitting: false,
  },
  // Browser build (IIFE + minified)
  {
    entry: { 'log-m8': 'src/index.ts' },
    format: 'iife',
    globalName: 'logM8', // Replace with your desired global
    outDir: 'dist/browser',
    define: browserDefines,
    sourcemap: true,
    minify: 'terser',
    // minifySyntax: true,
    // minifyIdentifiers: true,
    // minifyWhitespace: true,
    clean: false, // prevent removing CJS/ESM outputs
    shims: false,
    target: 'es6',

    // Enable Terser manually (tsup will detect this if installed)
    terserOptions: {
      compress: {
        passes: 1, // Number of times to run Terser
      },
      // mangle: {
      //   properties: {
      //     // Use a regex to match internal-only properties
      //     // regex: /^_?([a-z])/i,
      //     regex: /^_/,
      //   },
      // },
    },

    esbuildPlugins: [stripNodeJsBlock()],
  },
]);
