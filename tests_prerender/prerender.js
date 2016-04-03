var React = require('react');
var ReactDOMServer = require('react-dom/server');
var assert = require('assert');
var InputElement = require('../build/InputElement.js');

describe('Test prerender', function() {
  it('should return a string', function() {
    var result = ReactDOMServer.renderToString(React.createElement(InputElement, { value: 'some', mask: '799' }));
    assert.equal(typeof result, 'string');
  });
});
