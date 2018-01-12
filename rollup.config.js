import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';

var env = process.env.NODE_ENV;

var config = {
  output: {
    name: 'ReactInputMask',
    format: 'umd',
    globals: {
      react: 'React'
    }
  },
  external: ['react'],
  plugins: [
    nodeResolve({
      jsnext: true
    }),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-es2015', { modules: false, loose: true }],
        '@babel/preset-react',
        '@babel/preset-stage-2'
      ]
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    })
  ]
};

if (env === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        warnings: false,
        ie8: true
      },
      mangle: {
        ie8: true
      },
      output: {
        ie8: true
      }
    })
  );
}

export default config;
