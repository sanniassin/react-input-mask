/* global describe, it */

var React = require('react');
var ReactDOMServer = require('react-dom/server');
var expect = require('chai').expect;
var InputElement = require('../build/InputElement.js');

describe('Test prerender', () => {
  it('should return a string', () => {
    var result = ReactDOMServer.renderToString(React.createElement(InputElement, { value: 'some', mask: '799' }));
    expect(typeof result).to.equal('string');
  });
});
