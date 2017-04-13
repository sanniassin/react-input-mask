var canUseBS = false;

try {
    var bsCredentials = require(__dirname + '/browserStack.json');
    canUseBS = true;
} catch(e) {
    console.warn("Can't load credentials from browserStack.json, fallback to PhantomJS");
}

module.exports = function (config) {
  config.set({
    // global config of your BrowserStack account
    browserStack: canUseBS && bsCredentials,

    // define browsers
    customLaunchers: {
      bs_ie11_win7: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '11',
        os: 'WINDOWS',
        os_version: '7'
      },
      bs_ie9_win7: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '9',
        os: 'WINDOWS',
        os_version: '7'
      },
      bs_ie8_win7: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '8',
        os: 'WINDOWS',
        os_version: '7'
      },
      bs_edge_win10: {
        base: 'BrowserStack',
        browser: 'edge',
        browser_version: '12',
        os: 'WINDOWS',
        os_version: '10'
      },
      bs_chrome_win10: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '46',
        os: 'WINDOWS',
        os_version: '10'
      },
      bs_chrome_winxp: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '46',
        os: 'WINDOWS',
        os_version: 'XP'
      },
      bs_firefox_win10: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '42',
        os: 'WINDOWS',
        os_version: '10'
      },
      bs_safari_elcap: {
        base: 'BrowserStack',
        browser: 'safari',
        os : 'OS X',
        os_version : 'El Capitan'
      },
      bs_safari_mavericks: {
        base: 'BrowserStack',
        browser: 'safari',
        os : 'OS X',
        os_version : 'Mavericks'
      },
      bs_ios8: {
        base: 'BrowserStack',
        device: 'iPhone 6',
        os: 'ios',
        os_version: '8.0'
      },
      bs_ios6: {
        base: 'BrowserStack',
        device: 'iPhone 5',
        os: 'ios',
        os_version: '6.0'
      },
      bs_android44: {
        base: 'BrowserStack',
        device: 'Samsung Galaxy S5',
        os: 'android',
        os_version: '4.4'
      }
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: canUseBS ? [
      'bs_ie11_win7',
      'bs_ie9_win7',
      'bs_ie8_win7',
      'bs_edge_win10',
      'bs_chrome_win10',
      //'bs_chrome_winxp',
      'bs_firefox_win10',
      'bs_safari_elcap',
      //'bs_safari_mavericks',
      'bs_ios8',
      //'bs_ios6',
      'bs_android44'
    ] : ['PhantomJS'],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath : './',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks : ['jasmine', 'browserify'],

    // list of files / patterns to load in the browser
    files : [
      'node_modules/babel-polyfill/dist/polyfill.min.js',
      'node_modules/console-polyfill/index.js',
      'node_modules/react/dist/react-with-addons.min.js',
      'tests/*.js'
    ],

    // list of files to exclude
    exclude : [
      'karma.conf.js'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors : {
      'tests/*.js' : ['browserify']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters : ['progress'],

    // web server port
    port : 9876,

    // enable / disable colors in the output (reporters and logs)
    colors : true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel : config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch : false,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun : true,

    browserify : {
      transform: [['babelify', {
        presets: ['es2015', 'react'],
        plugins: ['transform-class-properties', 'transform-object-rest-spread']
      }]]
    }
  })
}
