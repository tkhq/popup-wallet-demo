import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    'postcss-import': {
      // In an npm workspaces monorepo deps are hoisted to the root node_modules.
      // postcss-import only searches the importing file's directory by default,
      // so we point it at the root node_modules explicitly.
      path: [resolve(__dirname, '../../node_modules')],
    },
    tailwindcss: {},
    autoprefixer: {},
  },
};
