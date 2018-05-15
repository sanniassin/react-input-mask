import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import protoToAssign from './rollup.proto-to-assign.plugin';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';

const input = './src/index.js';

// Treat as externals all not relative and not absolute paths
// e.g. 'react' to prevent duplications in user bundle.
const isExternal = id => !id.startsWith('\0') && !id.startsWith('.') && !id.startsWith('/');

const external = ['react', 'react-dom'];
const plugins = [
  babel(),
  resolve({
    jsnext: true
  }),
  commonjs(),
  protoToAssign()
];
const minifiedPlugins = [
  ...plugins,
  replace({
    'process.env.NODE_ENV': '"production"'
  }),
  babel({
    babelrc: false,
    plugins: [
      'babel-plugin-minify-dead-code-elimination'
    ]
  }),
  uglify({
    compress: { warnings: false, ie8: true },
    mangle: { ie8: true },
    output: { ie8: true }
  })
];

export default [
  {
    input,
    output: {
      file: 'dist/react-input-mask.js',
      format: 'umd',
      name: 'ReactInputMask',
      globals: { react: 'React' }
    },
    external,
    plugins: [...plugins, sizeSnapshot()]
  },

  {
    input,
    output: {
      file: 'dist/react-input-mask.min.js',
      format: 'umd',
      name: 'ReactInputMask',
      globals: { react: 'React' }
    },
    external,
    plugins: minifiedPlugins
  },

  {
    input,
    output: { file: 'lib/react-input-mask.development.js', format: 'cjs' },
    external: isExternal,
    plugins: [...plugins, sizeSnapshot()]
  },

  {
    input,
    output: { file: 'lib/react-input-mask.production.min.js', format: 'cjs' },
    external,
    plugins: minifiedPlugins
  }
];
