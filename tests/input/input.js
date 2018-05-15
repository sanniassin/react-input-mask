/* global describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import { expect } from 'chai';
import { defer } from '../../src/utils/defer';
import Input from '../../src';
import { isDOMElement } from '../../src/utils/helpers';

document.body.innerHTML = '<div id="container"></div>';
const container = document.getElementById('container');

const getInputDOMNode = (input) => {
  if (!isDOMElement(input)) {
    input = ReactDOM.findDOMNode(input);
  }

  if (input.nodeName !== 'INPUT') {
    input = input.querySelector('input');
  }

  if (!input) {
    throw new Error('inputComponent doesn\'t contain input node');
  }

  return input;
};

const createInput = (component, cb) => {
  return () => {
    var input;

    ReactDOM.unmountComponentAtNode(container);

    component = React.cloneElement(component, {
      ref: (ref) => input = ref
    });

    return new Promise((resolve, reject) => {
      ReactDOM.render(component, container, () => {
        // IE can fail if executed synchronously
        setImmediate(() => {
          var inputNode = getInputDOMNode(input);
          Promise.resolve(cb(input, inputNode))
            .then(() => {
              ReactDOM.unmountComponentAtNode(container);
              resolve();
            })
            .catch((err) => {
              ReactDOM.unmountComponentAtNode(container);
              reject(err);
            });
        });
      });
    });
  };
};

const setInputSelection = (input, start, length) => {
  var end = start + length;
  if ('selectionStart' in input && 'selectionEnd' in input) {
    input.selectionStart = start;
    input.selectionEnd = end;
  } else {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveStart('character', start);
    range.moveEnd('character', end - start);
    range.select();
  }
};

const setInputProps = (input, props) => {
  ReactDOM.render(React.createElement(Input, { ...input.props, ...props }), container);
};

const insertStringIntoInput = (input, str) => {
  var inputNode = getInputDOMNode(input);
  var selection = input.getSelection();
  var { value } = inputNode;

  inputNode.value = value.slice(0, selection.start) + str + value.slice(selection.end);

  setInputSelection(inputNode, selection.start + str.length, 0);

  TestUtils.Simulate.change(inputNode);
};

const simulateInputKeyPress = insertStringIntoInput;

const simulateInputPaste = (input, str) => {
  var inputNode = getInputDOMNode(input);

  TestUtils.Simulate.paste(inputNode);

  insertStringIntoInput(input, str);
};

const simulateInputBackspacePress = (input) => {
  var inputNode = getInputDOMNode(input);
  var selection = input.getSelection();
  var { value } = inputNode;

  if (selection.length) {
    inputNode.value = value.slice(0, selection.start) + value.slice(selection.end);
    setInputSelection(inputNode, selection.start, 0);
  } else if (selection.start) {
    inputNode.value = value.slice(0, selection.start - 1) + value.slice(selection.end);
    setInputSelection(inputNode, selection.start - 1, 0);
  }

  TestUtils.Simulate.change(inputNode);
};

const simulateInputDeletePress = (input) => {
  var inputNode = getInputDOMNode(input);
  var selection = input.getSelection();
  var { value } = inputNode;

  if (selection.length) {
    value = value.slice(0, selection.start) + value.slice(selection.end);
  } else if (selection.start < value.length) {
    value = value.slice(0, selection.start) + value.slice(selection.end + 1);
  }
  inputNode.value = value;

  setInputSelection(inputNode, selection.start, 0);

  TestUtils.Simulate.change(inputNode);
};

class TestInputComponent extends React.Component {
  render() {
    return <div><input {...this.props} /></div>;
  }
}

const TestFunctionalInputComponent = (props) => {
  return <div><div><input {...props} /></div></div>;
};

describe('react-input-mask', () => {
  it('should format value on mount', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input, inputNode) => {
      expect(inputNode.value).to.equal('+7 (495) 315 64 54');
    }));

  it('should format value with invalid characters on mount', createInput(
    <Input mask="+7 (9a9) 999 99 99" defaultValue="749531b6454" />, (input, inputNode) => {
      expect(inputNode.value).to.equal('+7 (4b6) 454 __ __');
    }));

  it('should show placeholder on focus', createInput(
    <Input mask="+7 (*a9) 999 99 99" />, (input, inputNode) => {
      expect(inputNode.value).to.equal('');

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      expect(inputNode.value).to.equal('+7 (___) ___ __ __');
    }));

  it('should clear input on blur', createInput(
    <Input mask="+7 (*a9) 999 99 99" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      expect(inputNode.value).to.equal('+7 (___) ___ __ __');

      inputNode.blur();
      TestUtils.Simulate.blur(inputNode);
      expect(inputNode.value).to.equal('');

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      simulateInputKeyPress(input, '1');
      expect(inputNode.value).to.equal('+7 (1__) ___ __ __');

      inputNode.blur();
      TestUtils.Simulate.blur(inputNode);
      expect(inputNode.value).to.equal('+7 (1__) ___ __ __');
    }));

  it('should handle escaped characters in mask', createInput(
    <Input mask="+4\9 99 9\99 99" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      inputNode.value = '+49 12 3';
      setInputSelection(inputNode, 8, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('+49 12 39');
    }));

  it('should handle alwaysShowMask', createInput(
    <Input mask="+7 (999) 999 99 99" alwaysShowMask />, (input, inputNode) => {
      expect(inputNode.value).to.equal('+7 (___) ___ __ __');

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      expect(inputNode.value).to.equal('+7 (___) ___ __ __');

      inputNode.blur();
      TestUtils.Simulate.blur(inputNode);
      expect(inputNode.value).to.equal('+7 (___) ___ __ __');

      setInputProps(input, { alwaysShowMask: false });
      expect(inputNode.value).to.equal('');

      setInputProps(input, { alwaysShowMask: true });
      expect(inputNode.value).to.equal('+7 (___) ___ __ __');
    }));

  it('should adjust cursor position on focus', createInput(
    <Input mask="+7 (999) 999 99 99" value="+7" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      expect(input.getCursorPosition()).to.equal(4);

      inputNode.blur();
      TestUtils.Simulate.blur(inputNode);

      setInputProps(input, { value: '+7 (___) ___ _1 __' });
      setInputSelection(inputNode, 2, 0);
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      expect(input.getCursorPosition()).to.equal(16);

      inputNode.blur();
      TestUtils.Simulate.blur(inputNode);

      setInputProps(input, { value: '+7 (___) ___ _1 _1' });
      setInputSelection(inputNode, 2, 0);
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      expect(input.getCursorPosition()).to.equal(2);
    }));

  it('should adjust cursor position on focus on input with autoFocus', createInput(
    <Input mask="+7 (999) 999 99 99" value="+7" autoFocus />, (input, inputNode) => {
      expect(input.getCursorPosition()).to.equal(4);

      inputNode.blur();
      TestUtils.Simulate.blur(inputNode);

      setInputProps(input, { value: '+7 (___) ___ _1 __' });
      setInputSelection(inputNode, 2, 0);
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      expect(input.getCursorPosition()).to.equal(16);

      inputNode.blur();
      TestUtils.Simulate.blur(inputNode);

      setInputProps(input, { value: '+7 (___) ___ _1 _1' });
      setInputSelection(inputNode, 2, 0);
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      expect(input.getCursorPosition()).to.equal(2);
    }));

  it('should handle changes on input with autoFocus', createInput(
    <Input mask="+7 (999) 999 99 99" autoFocus />, (input, inputNode) => {
      insertStringIntoInput(input, '222 222 22 22');

      return new Promise((resolve) => {
        defer(() => {
          setInputSelection(inputNode, 5, 0);
          setTimeout(() => {
            simulateInputKeyPress(input, '3');
            expect(inputNode.value).to.equal('+7 (232) 222 22 22');
            resolve();
          }, 100);
        });
      });
    }));

  it('should format value in onChange (with maskChar)', createInput(
    <Input mask="**** **** **** ****" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      setInputSelection(inputNode, 0, 0);
      inputNode.value = 'a' + inputNode.value;
      setInputSelection(inputNode, 1, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('a___ ____ ____ ____');
      expect(input.getCursorPosition()).to.equal(1);

      setInputSelection(inputNode, 0, 19);
      inputNode.value = 'a';
      setInputSelection(inputNode, 1, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('a___ ____ ____ ____');
      expect(input.getCursorPosition()).to.equal(1);

      inputNode.value = 'aaaaa___ ____ ____ ____';
      setInputSelection(inputNode, 1, 4);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('aaaa a___ ____ ____');
      expect(input.getCursorPosition()).to.equal(6);

      input.setCursorPosition(4);
      inputNode.value = 'aaa a___ ____ ____';
      setInputSelection(inputNode, 3, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('aaa_ a___ ____ ____');

      input.setSelection(3, 6);
      inputNode.value = 'aaaaaa___ ____ ____';
      setInputSelection(inputNode, 6, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('aaaa aa__ ____ ____');

      input.setSelection(3, 6);
      inputNode.value = 'aaaaxa__ ____ ____';
      setInputSelection(inputNode, 5, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('aaaa xa__ ____ ____');
      expect(input.getCursorPosition()).to.equal(6);
    }));

  it('should format value in onChange (without maskChar)', createInput(
    <Input mask="**** **** **** ****" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      expect(inputNode.value).to.equal('');

      setInputSelection(inputNode, 0, 0);
      inputNode.value = 'aaa';
      setInputSelection(inputNode, 3, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('aaa');
      expect(input.getCursorPosition()).to.equal(3);

      inputNode.value = 'aaaaa';
      setInputSelection(inputNode, 5, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('aaaa a');
      expect(input.getCursorPosition()).to.equal(6);

      inputNode.value = 'aaaa afgh ijkl mnop';
      setInputSelection(inputNode, 19, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('aaaa afgh ijkl mnop');
      expect(input.getCursorPosition()).to.equal(19);

      inputNode.value = 'aaaa afgh ijkl mnopq';
      setInputSelection(inputNode, 20, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('aaaa afgh ijkl mnop');
      expect(input.getCursorPosition()).to.equal(19);
    }));

  it('should handle entered characters (with maskChar)', createInput(
    <Input mask="+7 (*a9) 999 99 99" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(0);
      simulateInputKeyPress(input, '+');
      expect(inputNode.value).to.equal('+7 (___) ___ __ __');

      input.setCursorPosition(0);
      simulateInputKeyPress(input, '7');
      expect(inputNode.value).to.equal('+7 (___) ___ __ __');

      input.setCursorPosition(0);
      simulateInputKeyPress(input, '8');
      expect(inputNode.value).to.equal('+7 (8__) ___ __ __');

      input.setCursorPosition(0);
      simulateInputKeyPress(input, 'E');
      expect(inputNode.value).to.equal('+7 (E__) ___ __ __');

      simulateInputKeyPress(input, '6');
      expect(inputNode.value).to.equal('+7 (E__) ___ __ __');

      simulateInputKeyPress(input, 'x');
      expect(inputNode.value).to.equal('+7 (Ex_) ___ __ __');
    }));

  it('should handle entered characters (without maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="+7 (111) 123 45 6" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      setInputSelection(inputNode, 4, 0);
      simulateInputKeyPress(input, 'E');
      expect(inputNode.value).to.equal('+7 (111) 123 45 6');

      input.setSelection(4, 7);
      simulateInputKeyPress(input, '0');
      expect(inputNode.value).to.equal('+7 (012) 345 6');

      setInputSelection(inputNode, 14, 0);
      simulateInputKeyPress(input, '7');
      simulateInputKeyPress(input, '8');
      simulateInputKeyPress(input, '9');
      simulateInputKeyPress(input, '4');
      expect(inputNode.value).to.equal('+7 (012) 345 67 89');

      inputNode.value = '+7 (';
      setInputSelection(inputNode, 4, 0);
      TestUtils.Simulate.change(inputNode);
      setInputSelection(inputNode, 0, 0);
      simulateInputKeyPress(input, '+');
      expect(inputNode.value).to.equal('+7 (');
    }));

  it('should adjust cursor position on input (with maskChar)', createInput(
    <Input mask="(999)" defaultValue="11" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      setInputSelection(inputNode, 3, 0);
      simulateInputKeyPress(input, 'x');
      expect(input.getCursorPosition()).to.equal(3);

      simulateInputKeyPress(input, '1');
      expect(input.getCursorPosition()).to.equal(4);

      setInputSelection(inputNode, 0, 4);
      simulateInputBackspacePress(input);
      setInputSelection(inputNode, 2, 0);
      simulateInputKeyPress(input, 'x');
      expect(input.getCursorPosition()).to.equal(2);
    }));

  it('should handle single character removal with Backspace (with maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(10);
      simulateInputBackspacePress(input);
      expect(inputNode.value).to.equal('+7 (495) _15 64 54');

      simulateInputBackspacePress(input);
      expect(inputNode.value).to.equal('+7 (49_) _15 64 54');
    }));

  it('should handle single character removal with Backspace (without maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(10);
      simulateInputBackspacePress(input);
      expect(inputNode.value).to.equal('+7 (495) 156 45 4');

      inputNode.value = '+7 (';
      setInputSelection(inputNode, 4, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('+7 (');

      inputNode.value = '+7 ';
      setInputSelection(inputNode, 3, 0);
      TestUtils.Simulate.change(inputNode);
      expect(inputNode.value).to.equal('+7 (');
    }));

  it('should adjust cursor position on single character removal with Backspace (with maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(10);
      simulateInputBackspacePress(input);
      expect(input.getCursorPosition()).to.equal(9);

      simulateInputBackspacePress(input);
      expect(input.getCursorPosition()).to.equal(6);

      input.setCursorPosition(4);
      simulateInputBackspacePress(input);
      expect(input.getCursorPosition()).to.equal(4);
    }));

  it('should adjust cursor position on single character removal with Backspace (without maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="749531564" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(16);
      simulateInputBackspacePress(input);
      expect(input.getCursorPosition()).to.equal(14);
    }));

  it('should handle multiple characters removal with Backspace (with maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setSelection(1, 10);
      simulateInputBackspacePress(input);
      expect(inputNode.value).to.equal('+7 (___) _15 64 54');
    }));

  it('should handle multiple characters removal with Backspace (without maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setSelection(1, 10);
      simulateInputBackspacePress(input);
      expect(inputNode.value).to.equal('+7 (156) 454 ');
    }));

  it('should adjust cursor position on multiple characters removal with Backspace (with maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setSelection(1, 10);
      simulateInputBackspacePress(input);
      expect(input.getCursorPosition()).to.equal(4);
    }));

  it('should handle single character removal with Backspace on mask with escaped characters (without maskChar)', createInput(
    <Input mask="+4\9 99 9\99 99" defaultValue="+49 12 394" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(10);
      simulateInputBackspacePress(input);
      expect(inputNode.value).to.equal('+49 12 39');

      input.setCursorPosition(9);
      simulateInputBackspacePress(input);
      expect(inputNode.value).to.equal('+49 12 ');

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      inputNode.value = '+49 12 39';
      TestUtils.Simulate.change(inputNode);
      input.setCursorPosition(6);
      simulateInputBackspacePress(input);
      expect(inputNode.value).to.equal('+49 13 ');
    }));

  it('should adjust cursor position on single character removal with Backspace on mask with escaped characters (without maskChar)', createInput(
    <Input mask="+4\9 99 9\99 99" defaultValue="+49 12 394" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(10);
      simulateInputBackspacePress(input);
      expect(input.getCursorPosition()).to.equal(9);

      input.setCursorPosition(9);
      simulateInputBackspacePress(input);
      expect(input.getCursorPosition()).to.equal(7);

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      inputNode.value = '+49 12 39';
      TestUtils.Simulate.change(inputNode);
      input.setCursorPosition(6);
      simulateInputBackspacePress(input);
      expect(input.getCursorPosition()).to.equal(5);
    }));

  it('should handle multiple characters removal with Backspace on mask with escaped characters (without maskChar)', createInput(
    <Input mask="+4\9 99 9\99 99" defaultValue="+49 12 394" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setSelection(4, 6);
      simulateInputBackspacePress(input);
      expect(inputNode.value).to.equal('+49 34 ');

      inputNode.value = '+49 12 394 5';
      TestUtils.Simulate.change(inputNode);
      input.setSelection(4, 6);
      simulateInputBackspacePress(input);
      expect(inputNode.value).to.equal('+49 34 59');
    }));

  it('should adjust cursor position on multiple characters removal with Backspace on mask with escaped characters (without maskChar)', createInput(
    <Input mask="+4\9 99 9\99 99" defaultValue="+49 12 394" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setSelection(4, 6);
      simulateInputBackspacePress(input);
      expect(input.getCursorPosition()).to.equal(4);

      inputNode.value = '+49 12 394 5';
      TestUtils.Simulate.change(inputNode);
      input.setSelection(4, 6);
      simulateInputBackspacePress(input);
      expect(input.getCursorPosition()).to.equal(4);
    }));

  it('should handle single character removal with Delete (with maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(0);
      simulateInputDeletePress(input);
      expect(inputNode.value).to.equal('+7 (_95) 315 64 54');

      input.setCursorPosition(7);
      simulateInputDeletePress(input);
      expect(inputNode.value).to.equal('+7 (_95) _15 64 54');

      input.setCursorPosition(11);
      simulateInputDeletePress(input);
      expect(inputNode.value).to.equal('+7 (_95) _1_ 64 54');
    }));

  it('should adjust cursor position on single character removal with Delete (with maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(0);
      simulateInputDeletePress(input);
      expect(input.getCursorPosition()).to.equal(4);

      input.setCursorPosition(7);
      simulateInputDeletePress(input);
      expect(input.getCursorPosition()).to.equal(9);

      input.setCursorPosition(11);
      simulateInputDeletePress(input);
      expect(input.getCursorPosition()).to.equal(11);
    }));

  it('should handle multiple characters removal with Delete (with maskChar)', createInput(
    <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setSelection(1, 10);
      simulateInputDeletePress(input);
      expect(inputNode.value).to.equal('+7 (___) _15 64 54');
    }));

  it('should handle single character removal with Delete on mask with escaped characters (without maskChar)', createInput(
    <Input mask="+4\9 99 9\99 99" defaultValue="+49 12 394" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(9);
      simulateInputDeletePress(input);
      expect(inputNode.value).to.equal('+49 12 39');

      input.setCursorPosition(7);
      simulateInputDeletePress(input);
      expect(inputNode.value).to.equal('+49 12 ');

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      inputNode.value = '+49 12 39';
      TestUtils.Simulate.change(inputNode);
      input.setCursorPosition(5);
      simulateInputDeletePress(input);
      expect(inputNode.value).to.equal('+49 13 ');
    }));

  it('should adjust cursor position on single character removal with Delete on mask with escaped characters (without maskChar)', createInput(
    <Input mask="+4\9 99 9\99 99" defaultValue="+49 12 394" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(9);
      simulateInputDeletePress(input);
      expect(input.getCursorPosition()).to.equal(9);

      input.setCursorPosition(7);
      simulateInputDeletePress(input);
      expect(input.getCursorPosition()).to.equal(7);

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      inputNode.value = '+49 12 39';
      TestUtils.Simulate.change(inputNode);
      input.setCursorPosition(5);
      simulateInputDeletePress(input);
      expect(input.getCursorPosition()).to.equal(5);
    }));

  it('should handle multiple characters removal with Delete on mask with escaped characters (without maskChar)', createInput(
    <Input mask="+4\9 99 9\99 99" defaultValue="+49 12 394" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setSelection(4, 6);
      simulateInputDeletePress(input);
      expect(inputNode.value).to.equal('+49 34 ');

      inputNode.value = '+49 12 394 5';
      TestUtils.Simulate.change(inputNode);
      input.setSelection(4, 6);
      simulateInputDeletePress(input);
      expect(inputNode.value).to.equal('+49 34 59');
    }));

  it('should adjust cursor position on multiple characters removal with Delete on mask with escaped characters (without maskChar)', createInput(
    <Input mask="+4\9 99 9\99 99" defaultValue="+49 12 394" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setSelection(4, 6);
      simulateInputDeletePress(input);
      expect(input.getCursorPosition()).to.equal(4);

      inputNode.value = '+49 12 394 5';
      TestUtils.Simulate.change(inputNode);
      input.setSelection(4, 6);
      simulateInputDeletePress(input);
      expect(input.getCursorPosition()).to.equal(4);
    }));

  it('should handle mask change', createInput(
    <Input mask="9999-9999-9999-9999" defaultValue="34781226917" />, (input, inputNode) => {
      setInputProps(input, { mask: '9999-999999-99999' });
      expect(inputNode.value).to.equal('3478-122691-7____');

      setInputProps(input, { mask: '9-9-9-9' });
      expect(inputNode.value).to.equal('3-4-7-8');

      setInputProps(input, { mask: null });
      expect(inputNode.value).to.equal('3-4-7-8');

      inputNode.value = '0-1-2-3';

      setInputProps(input, { mask: '9999' });
      expect(inputNode.value).to.equal('0123');
    }));

  it('should handle mask change with on controlled input', createInput(
    <Input mask="9999-9999-9999-9999" value="38781226917" />, (input, inputNode) => {
      setInputProps(input, {
        onChange: () => {
          setInputProps(input, {
            mask: '9999-999999-99999',
            value: '3478-1226-917_-____'
          });
        }
      });

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      expect(inputNode.value).to.equal('3878-1226-917_-____');

      setInputSelection(inputNode, 1, 0);
      simulateInputKeyPress(input, '4');
      TestUtils.Simulate.change(inputNode);

      expect(inputNode.value).to.equal('3478-122691-7____');
    }));

  it('should handle string paste (with maskChar)', createInput(
    <Input mask="9999-9999-9999-9999" defaultValue="____-____-____-6543" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      setInputSelection(inputNode, 3, 15);
      simulateInputPaste(input, '34781226917');
      expect(inputNode.value).to.equal('___3-4781-2269-17_3');

      setInputSelection(inputNode, 3, 0);
      simulateInputPaste(input, '3-__81-2_6917');
      expect(inputNode.value).to.equal('___3-__81-2_69-17_3');

      setInputSelection(inputNode, 0, 3);
      simulateInputPaste(input, ' 333');
      expect(inputNode.value).to.equal('3333-__81-2_69-17_3');
    }));

  it('should adjust cursor position on string paste (with maskChar)', createInput(
    <Input mask="9999-9999-9999-9999" defaultValue="____-____-____-6543" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      setInputSelection(inputNode, 3, 15);
      simulateInputPaste(input, '478122691');
      expect(input.getCursorPosition()).to.equal(15);

      setInputSelection(inputNode, 3, 0);
      simulateInputPaste(input, '3-__81-2_6917');
      expect(input.getCursorPosition()).to.equal(17);
    }));

  it('should handle string paste (without maskChar)', createInput(
    <Input mask="9999-9999-9999-9999" defaultValue="9999-9999-9999-9999" maskChar={null} />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      setInputSelection(inputNode, 0, 19);
      simulateInputPaste(input, '34781226917');
      expect(inputNode.value).to.equal('3478-1226-917');

      setInputSelection(inputNode, 1, 0);
      simulateInputPaste(input, '12345');
      expect(inputNode.value).to.equal('3123-4547-8122-6917');

      setInputSelection(inputNode, 1, 0);
      simulateInputPaste(input, '4321');
      expect(inputNode.value).to.equal('3432-1547-8122-6917');

      setInputProps(input, {
        value: '',
        onChange: (event) => {
          setInputProps(input, {
            value: event.target.value
          });
        }
      });

      simulateInputPaste(input, '123');
      expect(inputNode.value).to.equal('123');
    }));

  it('should handle string paste at position of permanent character (with maskChar)', createInput(
    <Input mask="9999-9999-9999" maskChar=" " />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      simulateInputPaste(input, '1111 1111 1111');
      expect(inputNode.value).to.equal('1111-1111-1111');
    }));

  it('should handle formatChars property', createInput(
    <Input mask="11-11" defaultValue="1234" formatChars={{ '1': '[1-3]' }} />, (input, inputNode) => {
      expect(inputNode.value).to.equal('12-3_');
    }));

  it('should keep placeholder on rerender on empty input with alwaysShowMask', createInput(
    <Input mask="99-99" value="" alwaysShowMask />, (input, inputNode) => {
      setInputProps(input, { value: '' });

      expect(inputNode.value).to.equal('__-__');
    }));

  it('should ignore null formatChars', createInput(
    <Input mask="99-99" formatChars={null} alwaysShowMask />, (input, inputNode) => {
      expect(inputNode.value).to.equal('__-__');
    }));

  it('should show empty value when input switches from uncontrolled to controlled', createInput(
    <Input mask="+7 (*a9) 999 99 99" />, (input, inputNode) => {
      setInputProps(input, { value: '+7 (___) ___ __ __' });
      expect(inputNode.value).to.equal('+7 (___) ___ __ __');
    }));

  it('shouldn\'t affect value if mask is empty', createInput(
    <Input value="12345" />, (input, inputNode) => {
      expect(inputNode.value).to.equal('12345');

      setInputProps(input, {
        value: '54321'
      });
      expect(inputNode.value).to.equal('54321');
    }));

  it('should show next permanent character when maskChar is null', createInput(
    <Input mask="99/99/9999" value="01" maskChar={null} />, (input, inputNode) => {
      expect(inputNode.value).to.equal('01/');
    }));

  it('should show all next consecutive permanent characters when maskChar is null', createInput(
    <Input mask="99---99" value="01" maskChar={null} />, (input, inputNode) => {
      expect(inputNode.value).to.equal('01---');
    }));

  it('should show trailing permanent character when maskChar is null', createInput(
    <Input mask="99%" value="10" maskChar={null} />, (input, inputNode) => {
      expect(inputNode.value).to.equal('10%');
    }));

  it('should pass input DOM node to inputRef function', () => {
    var inputRef;
    return createInput(
      <Input inputRef={ref => inputRef = ref} />, (input, inputNode) => {
        expect(inputRef).to.equal(inputNode);
      })();
  });

  it('should allow to modify value with beforeMaskedValueChange', createInput(
    <Input mask="99999-9999" maskChar={null} value="" />, (input, inputNode) => {
      setInputProps(input, {
        onChange: (event) => {
          setInputProps(input, {
            value: event.target.value
          });
        },
        beforeMaskedValueChange: (newState, oldState, userInput) => {
          var { value } = newState;
          var selection = newState.selection;
          var cursorPosition = selection ? selection.start : null;
          if (value.endsWith('-') && userInput !== '-' && !input.props.value.endsWith('-')) {
            if (cursorPosition === value.length) {
              cursorPosition--;
              selection = { start: cursorPosition, end: cursorPosition };
            }
            value = value.slice(0, -1);
          }

          return {
            value,
            selection
          };
        }
      });

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      setInputProps(input, { value: '12345' });
      expect(inputNode.value).to.equal('12345');

      input.setCursorPosition(5);

      simulateInputKeyPress(input, '-');
      expect(inputNode.value).to.equal('12345-');
    }));

  it('shouldn\'t modify value on entering non-allowed character', createInput(
    <Input mask="9999" defaultValue="1234" />, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      input.setCursorPosition(0);
      simulateInputKeyPress(input, 'a');

      expect(inputNode.value).to.equal('1234');
      expect(input.getCursorPosition()).to.equal(0);

      input.setSelection(0, 1);
      simulateInputKeyPress(input, 'a');

      expect(inputNode.value).to.equal('1234');

      input.setSelection(1, 4);
      simulateInputKeyPress(input, 'a');

      expect(inputNode.value).to.equal('1234');
    }));

  it('should handle autofill', createInput(
    <Input mask="9999-9999" defaultValue="123" maskChar={null} />, (input, inputNode) => {
      input.isInputAutofilled = () => true;

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      inputNode.value = '12345678';
      setInputSelection(inputNode, 8, 0);
      TestUtils.Simulate.change(inputNode);

      expect(inputNode.value).to.equal('1234-5678');
    }));

  it('should handle transition between masked and non-masked state', createInput(
    <Input />, (input, inputNode) => {
      setInputProps(input, {
        value: '',
        onChange: (event) => {
          setInputProps(input, {
            value: event.target.value,
            mask: event.target.value ? '+7 999 999 99 99' : null
          });
        }
      });

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      expect(input.getCursorPosition()).to.equal(0);

      simulateInputKeyPress(input, '1');
      expect(inputNode.value).to.equal('+7 1__ ___ __ __');
      expect(input.getCursorPosition()).to.equal(4);

      simulateInputBackspacePress(input);
      inputNode.blur();
      TestUtils.Simulate.blur(inputNode);

      expect(inputNode.value).to.equal('');

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      expect(input.getCursorPosition()).to.equal(0);

      simulateInputKeyPress(input, '1');
      expect(inputNode.value).to.equal('+7 1__ ___ __ __');
      expect(input.getCursorPosition()).to.equal(4);
    }));

  it('should handle regular component as children', createInput(
    <Input mask="+7 (999) 999 99 99">{(props) => <TestInputComponent {...props} />}</Input>, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      expect(input.getCursorPosition()).to.equal(4);

      simulateInputKeyPress(input, '1');
      expect(inputNode.value).to.equal('+7 (1__) ___ __ __');
      expect(input.getCursorPosition()).to.equal(5);
    }));

  it('should handle functional component as children', createInput(
    <Input mask="+7 (999) 999 99 99">{(props) => <TestFunctionalInputComponent {...props} />}</Input>, (input, inputNode) => {
      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      expect(input.getCursorPosition()).to.equal(4);

      simulateInputKeyPress(input, '1');
      expect(inputNode.value).to.equal('+7 (1__) ___ __ __');
      expect(input.getCursorPosition()).to.equal(5);
    }));


  it('should handle children change', createInput(
    <Input mask="+7 (999) 999 99 99" />, (input, inputNode) => {
      setInputProps(input, {
        value: '',
        onChange: (event) => {
          setInputProps(input, {
            value: event.target.value
          });
        },
        children: (props) => <TestInputComponent {...props} />
      });
      inputNode = getInputDOMNode(input);

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);

      expect(input.getCursorPosition()).to.equal(4);

      simulateInputKeyPress(input, '1');
      expect(inputNode.value).to.equal('+7 (1__) ___ __ __');
      expect(input.getCursorPosition()).to.equal(5);

      setInputProps(input, {
        children: (props) => <TestFunctionalInputComponent {...props} />,
        value: '22'
      });
      inputNode = getInputDOMNode(input);

      expect(inputNode.value).to.equal('+7 (22_) ___ __ __');

      setInputProps(input, {
        children: null
      });
      inputNode = getInputDOMNode(input);

      expect(inputNode.value).to.equal('+7 (22_) ___ __ __');
    }));
});
