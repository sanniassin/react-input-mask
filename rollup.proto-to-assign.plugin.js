// eslint-disable-next-line import/no-extraneous-dependencies
import { transform } from "@babel/core";

export default function protoToAssignTransform(options = {}) {
  return {
    transform(code) {
      const transformed = transform(code, {
        babelrc: false,
        plugins: ["@babel/plugin-transform-proto-to-assign"]
      });

      const result = { code: transformed.code };

      if (options.sourceMap !== false || options.sourcemap !== false) {
        result.map = transformed.map;
      }

      return result;
    }
  };
}
