const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: ["airbnb", "prettier"],
  plugins: ["prettier", "react-hooks"],
  env: {
    browser: true
  },
  rules: {
    "react/jsx-filename-extension": OFF,
    "react/jsx-props-no-spreading": OFF,
    "react/require-default-props": OFF,
    'react/no-find-dom-node': OFF,
    "react/prop-types": [ERROR, { ignore: ["value", "defaultValue"] }],
    "react-hooks/rules-of-hooks": ERROR,
    "react-hooks/exhaustive-deps": ERROR,
    "no-shadow": OFF,
    "no-param-reassign": OFF,
    "no-plusplus": OFF,
    "global-require": OFF,
    "consistent-return": OFF,
    "prefer-const": [ERROR, {
        "destructuring": "all"
    }],
    "prettier/prettier": ERROR,
  }
};
