import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';
import pkg from './package.json';

const input = './src/index.js';

const name = 'ReactInputMask'

// Treat as externals all not relative and not absolute paths
// e.g. 'react' to prevent duplications in user bundle.
const isExternal = id => !id.startsWith('\0') && !id.startsWith('.') && !id.startsWith('/');

export default [
  {
    input,
    output: {
      file: 'dist/react-input-mask.umd.js',
      format: 'umd',
      name,
      globals: { react: 'React' }
    },
    external: ['react'],
    plugins: [babel(), sizeSnapshot()]
  },

  {
    input,
    output: {
      file: 'dist/react-input-mask.min.js',
      format: 'umd',
      name,
      globals: { react: 'React' }
    },
    external: ['react'],
    plugins: [
      babel(),
      uglify({
        compress: { warnings: false, ie8: true },
        mangle: { ie8: true },
        output: { ie8: true }
      })
    ]
  },

  {
    input,
    output: { file: pkg.main, format: 'cjs' },
    external: isExternal,
    plugins: [babel(), sizeSnapshot()]
  },

  {
    input,
    output: { file: pkg.module, format: 'es' },
    external: isExternal,
    plugins: [babel(), sizeSnapshot()]
  }
];
