import { transform } from '@babel/core';

export default function protoToAssignTransform(options = {}) {
  return {
    transform(code) {
      var transformed = transform(code, {
        babelrc: false,
        plugins: ['@babel/plugin-transform-proto-to-assign']
      });

      var result = { code: transformed.code };

      if (options.sourceMap !== false || options.sourcemap !== false) {
        result.map = transformed.map;
      }

      return result;
    }
  };
}
