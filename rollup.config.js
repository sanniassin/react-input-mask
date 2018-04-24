import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';

var env = process.env.NODE_ENV;

var config = {
  output: {
    name: 'ReactInputMask',
    globals: {
      react: 'React'
    }
  },
  external: ['react'],
  plugins: [
    nodeResolve({
      jsnext: true
    }),
    babel(),
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
