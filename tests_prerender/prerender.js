/* global describe, it */

var React = require('react');
var ReactDOMServer = require('react-dom/server');
var assert = require('assert');
var InputElement = require('../build/InputElement.js');

describe('Test prerender', () => {
  it('should return a string', () => {
    var result = ReactDOMServer.renderToString(React.createElement(InputElement, { value: 'some', mask: '799' }));
    assert.equal(typeof result, 'string');
  });
});
