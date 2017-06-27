const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  'parser': 'babel-eslint',
  'parserOptions': {
    'ecmaVersion': 6,
    'ecmaFeatures': {
      'jsx': true,
      'experimentalObjectRestSpread': true
    }
  },
  'extends': 'airbnb',
  'env': {
    'browser': true
  },
  'rules': {
    'spaced-comment': OFF,
    'no-var': OFF,
    'vars-on-top': OFF,
    'no-alert': OFF,
    'func-names': OFF,
    'comma-dangle': [ERROR, 'never'],
    'react/prop-types': OFF,
    'react/react-in-jsx-scope': OFF,
    'react/sort-comp': OFF,
    'react/no-multi-comp': OFF,
    'react/no-did-mount-set-state': OFF,
    'react/prefer-stateless-function': OFF,
    'react/jsx-no-bind': OFF,
    'react/no-did-update-set-state': OFF,
    'react/jsx-wrap-multilines': OFF,
    'react/jsx-filename-extension': OFF,
    'react/no-array-index-key': OFF,
    'react/no-string-refs': WARN,
    'react/no-find-dom-node': WARN,
    'react/jsx-no-target-blank': WARN,
    'react/jsx-no-undef': [ERROR, { 'allowGlobals': false }],
    'react/no-unescaped-entities': OFF,
    'no-undef': ERROR,
    'no-param-reassign': OFF,
    'id-length': OFF,
    'max-len': OFF,
    'prefer-template': OFF,
    'object-shorthand': OFF,
    'space-before-function-paren': OFF,
    'quote-props': OFF,
    'no-else-return': OFF,
    'import/first': OFF,
    'import/no-mutable-exports': OFF,
    'import/prefer-default-export': OFF,
    'import/no-extraneous-dependencies': OFF,
    'operator-assignment': OFF,
    'no-mixed-operators': OFF,
    'no-plusplus': OFF,
    'jsx-a11y/no-static-element-interactions': OFF,
    'jsx-a11y/alt-text': OFF,
    'arrow-parens': OFF,
    'no-underscore-dangle': OFF,
    'arrow-body-style': OFF,
    'no-return-assign': OFF,
    'no-nested-ternary': OFF,
    'global-require': OFF,
    'prefer-spread': OFF,
    'prefer-const': OFF
  }
};
