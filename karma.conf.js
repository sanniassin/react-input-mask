module.exports = config => {
  config.set({
    // define browsers
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: "ChromeHeadless",
        flags: ["--no-sandbox"]
      }
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["ChromeHeadlessNoSandbox"],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "./",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["mocha"],

    // list of files / patterns to load in the browser
    files: [
      "node_modules/@babel/polyfill/dist/polyfill.min.js",
      "node_modules/console-polyfill/index.js",
      "tests/input/*.js"
    ],

    // list of files to exclude
    exclude: ["karma.conf.js"],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "tests/input/*.js": ["webpack"]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress"],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    webpack: {
      devtool: false,
      performance: {
        hints: false
      },
      mode: "development",
      output: {
        filename: "[name].js"
      },
      resolve: {
        modules: ["node_modules", "."]
      },
      module: require("./webpack.config").module
    }
  });
};
