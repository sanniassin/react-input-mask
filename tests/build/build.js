/* global describe, it */

import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { expect } from 'chai';
import pjson from '../../package.json';

var rootDir = path.resolve(__dirname, '../..');

describe('CommonJS build', () => {
  var libPath = path.resolve(rootDir, pjson.main);
  var InputElement = require(libPath);

  it('should return a string', () => {
    var result = ReactDOMServer.renderToString(<InputElement value="some" mask="799" />);
    expect(typeof result).to.equal('string');
  });
});

describe('ES2015 build', () => {
  var libPath = path.resolve(rootDir, pjson.module);
  var InputElement = require(libPath).default;

  it('should return a string', () => {
    var result = ReactDOMServer.renderToString(<InputElement value="some" mask="799" />);
    expect(typeof result).to.equal('string');
  });
});

describe('UMD build', () => {
  var libPath = path.resolve(rootDir, 'dist/react-input-mask.js');
  var InputElement = require(libPath);

  it('should return a string', () => {
    var result = ReactDOMServer.renderToString(<InputElement value="some" mask="799" />);
    expect(typeof result).to.equal('string');
  });
});
