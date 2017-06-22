// https://github.com/sanniassin/react-input-mask
import React from 'react';

import parseMask from './utils/parseMask';
import { isAndroidBrowser, isWindowsPhoneBrowser, isAndroidFirefox } from './utils/environment';
import {
  clearRange,
  formatValue,
  getFilledLength,
  isFilled,
  isEmpty,
  isPermanentChar,
  isAllowedChar,
  getInsertStringLength,
  insertString
} from './utils/string';

class InputElement extends React.Component {
  lastCursorPos = null

  constructor(props) {
    super(props);

    var { mask, maskChar, formatChars, defaultValue, value, alwaysShowMask } = props;

    this.hasValue = value != null;
    this.maskOptions = parseMask(mask, maskChar, formatChars);

    if (defaultValue == null) {
      defaultValue = '';
    }
    if (value == null) {
      value = defaultValue;
    }

    value = this.getStringValue(value);

    if (this.maskOptions.mask && (alwaysShowMask || value)) {
      value = formatValue(this.maskOptions, value);
    }

    this.state = { value };
  }

  componentDidMount = () => {
    this.isAndroidBrowser = isAndroidBrowser();
    this.isWindowsPhoneBrowser = isWindowsPhoneBrowser();
    this.isAndroidFirefox = isAndroidFirefox();

    var input = this.getInputDOMNode();

    // workaround for Jest
    // it doesn't mount a real node so input will be null
    if (input && Object.getOwnPropertyDescriptor && Object.getPrototypeOf && Object.defineProperty) {
      var valueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
      this.canUseAccessors = !!(valueDescriptor && valueDescriptor.get && valueDescriptor.set);
    }

    if (this.maskOptions.mask && this.props.value == null) {
      this.updateUncontrolledInput();
    }
  }

  componentWillReceiveProps = (nextProps) => {
    var oldMaskOptions = this.maskOptions;

    this.hasValue = nextProps.value != null;
    this.maskOptions = parseMask(nextProps.mask, nextProps.maskChar, nextProps.formatChars);

    if (!this.maskOptions.mask) {
      this.lastCursorPos = null;
      return;
    }

    var isMaskChanged = this.maskOptions.mask && this.maskOptions.mask !== oldMaskOptions.mask;
    var showEmpty = nextProps.alwaysShowMask || this.isFocused();
    var newValue = this.hasValue
      ? this.getStringValue(nextProps.value)
      : this.state.value;

    if (!oldMaskOptions.mask && !this.hasValue) {
      newValue = this.getInputDOMNode().value;
    }

    if (isMaskChanged || (this.maskOptions.mask && (newValue || showEmpty))) {
      newValue = formatValue(this.maskOptions, newValue);

      if (isMaskChanged) {
        var pos = this.lastCursorPos;
        var filledLen = getFilledLength(this.maskOptions, newValue);
        if (pos === null || filledLen < pos) {
          if (isFilled(this.maskOptions, newValue)) {
            pos = filledLen;
          } else {
            pos = this.getRightEditablePos(filledLen);
          }
          this.setCursorPos(pos);
        }
      }
    }

    if (this.maskOptions.mask && isEmpty(this.maskOptions, newValue) && !showEmpty && (!this.hasValue || !nextProps.value)) {
      newValue = '';
    }

    this.value = newValue;

    if (this.state.value !== newValue) {
      this.setState({ value: newValue });
    }
  }

  componentDidUpdate = (prevProps) => {
    if ((this.maskOptions.mask || prevProps.mask) && this.props.value == null) {
      this.updateUncontrolledInput();
    }

    if (this.valueDescriptor && this.getInputValue() !== this.state.value) {
      this.setInputValue(this.state.value);
    }
  }

  isDOMElement = (element) => {
    return typeof HTMLElement === 'object'
      ? element instanceof HTMLElement // DOM2
      : element.nodeType === 1 && typeof element.nodeName === 'string';
  }

  getInputDOMNode = () => {
    var input = this.input;

    if (!input) {
      return null;
    }

    if (this.isDOMElement(input)) {
      return input;
    }

    // React 0.13
    return React.findDOMNode(input);
  }

  enableValueAccessors = () => {
    if (this.canUseAccessors) {
      var input = this.getInputDOMNode();
      this.valueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
      Object.defineProperty(input, 'value', {
        configurable: true,
        enumerable: true,
        get: () => this.value,
        set: (value) => {
          this.value = value;
          this.valueDescriptor.set.call(input, value);
        }
      });
    }
  }

  disableValueAccessors = () => {
    var { valueDescriptor } = this;
    if (!valueDescriptor) {
      return;
    }
    this.valueDescriptor = null;
    var input = this.getInputDOMNode();
    Object.defineProperty(input, 'value', valueDescriptor);
  }

  getInputValue = () => {
    var input = this.getInputDOMNode();
    var { valueDescriptor } = this;

    var value;
    if (valueDescriptor) {
      value = valueDescriptor.get.call(input);
    } else {
      value = input.value;
    }

    return value;
  }

  setInputValue = (value) => {
    var input = this.getInputDOMNode();
    this.value = value;
    input.value = value;
  }

  getLeftEditablePos = (pos) => {
    for (var i = pos; i >= 0; --i) {
      if (!isPermanentChar(this.maskOptions, i)) {
        return i;
      }
    }
    return null;
  }

  getRightEditablePos = (pos) => {
    var { mask } = this.maskOptions;
    for (var i = pos; i < mask.length; ++i) {
      if (!isPermanentChar(this.maskOptions, i)) {
        return i;
      }
    }
    return null;
  }

  setCursorToEnd = () => {
    var filledLen = getFilledLength(this.maskOptions, this.state.value);
    var pos = this.getRightEditablePos(filledLen);
    if (pos !== null) {
      this.setCursorPos(pos);
    }
  }

  setSelection = (start, len = 0) => {
    var input = this.getInputDOMNode();
    if (!input) {
      return;
    }

    var end = start + len;
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
  }

  getSelection = () => {
    var input = this.getInputDOMNode();
    var start = 0;
    var end = 0;

    if ('selectionStart' in input && 'selectionEnd' in input) {
      start = input.selectionStart;
      end = input.selectionEnd;
    } else {
      var range = document.selection.createRange();
      if (range.parentElement() === input) {
        start = -range.moveStart('character', -input.value.length);
        end = -range.moveEnd('character', -input.value.length);
      }
    }

    return {
      start: start,
      end: end,
      length: end - start
    };
  }

  getCursorPos = () => {
    return this.getSelection().start;
  }

  setCursorPos = (pos) => {
    var raf = window.requestAnimationFrame
              ||
              window.webkitRequestAnimationFrame
              ||
              window.mozRequestAnimationFrame
              ||
              ((fn) => setTimeout(fn, 0));

    this.setSelection(pos, 0);
    raf(() => {
      this.setSelection(pos, 0);
    });

    this.lastCursorPos = pos;
  }

  isFocused = () => {
    return document.activeElement === this.getInputDOMNode();
  }

  getStringValue = (value) => {
    return !value && value !== 0 ? '' : value + '';
  }

  updateUncontrolledInput = () => {
    if (this.getInputValue() !== this.state.value) {
      this.setInputValue(this.state.value);
    }
  }

  onKeyDown = (event) => {
    var { key, ctrlKey, metaKey } = event;
    var hasHandler = typeof this.props.onKeyDown === 'function';
    if (ctrlKey || metaKey) {
      if (hasHandler) {
        this.props.onKeyDown(event);
      }
      return;
    }

    var cursorPos = this.getCursorPos();
    var value = this.state.value;
    var { prefix } = this.maskOptions;
    var preventDefault = false;
    switch (key) {
      case 'Backspace':
      case 'Delete':
        var deleteFromRight = key === 'Delete';
        var selectionRange = this.getSelection();
        if (selectionRange.length) {
          value = clearRange(this.maskOptions, value, selectionRange.start, selectionRange.length);
        } else if (cursorPos < prefix.length || (!deleteFromRight && cursorPos === prefix.length)) {
          cursorPos = prefix.length;
        } else {
          var editablePos = deleteFromRight
            ? this.getRightEditablePos(cursorPos)
            : this.getLeftEditablePos(cursorPos - 1);

          if (editablePos !== null) {
            value = clearRange(this.maskOptions, value, editablePos, 1);
            cursorPos = editablePos;
          }
        }
        preventDefault = true;
        break;
      default:
        break;
    }

    if (hasHandler) {
      this.props.onKeyDown(event);
    }

    if (value !== this.state.value) {
      preventDefault = true;

      this.setInputValue(value);
      this.setState({
        value: this.hasValue ? this.state.value : value
      });

      if (typeof this.props.onChange === 'function') {
        this.props.onChange(event);
      }
    }

    if (preventDefault) {
      event.preventDefault();
      this.setCursorPos(cursorPos);
    }
  }

  onKeyPress = (event) => {
    var { key, ctrlKey, metaKey } = event;
    var hasHandler = typeof this.props.onKeyPress === 'function';
    if (key === 'Enter' || ctrlKey || metaKey) {
      if (hasHandler) {
        this.props.onKeyPress(event);
      }
      return;
    }

    if (this.isWindowsPhoneBrowser) {
      return;
    }

    var cursorPos = this.getCursorPos();
    var selection = this.getSelection();
    var { value } = this.state;
    var { mask, lastEditablePos, prefix } = this.maskOptions;

    if (isPermanentChar(this.maskOptions, cursorPos) && mask[cursorPos] === key) {
      value = insertString(this.maskOptions, value, key, cursorPos);
      ++cursorPos;
    } else {
      var editablePos = this.getRightEditablePos(cursorPos);
      if (editablePos !== null && isAllowedChar(this.maskOptions, editablePos, key)) {
        value = clearRange(this.maskOptions, value, selection.start, selection.length);
        value = insertString(this.maskOptions, value, key, editablePos);
        cursorPos = editablePos + 1;
      }
    }

    if (value !== this.state.value) {
      this.setInputValue(value);
      this.setState({
        value: this.hasValue ? this.state.value : value
      });
      if (typeof this.props.onChange === 'function') {
        this.props.onChange(event);
      }
    }

    event.preventDefault();

    if (cursorPos < lastEditablePos && cursorPos > prefix.length) {
      cursorPos = this.getRightEditablePos(cursorPos);
    }
    this.setCursorPos(cursorPos);
  }

  onChange = (event) => {
    var { pasteSelection } = this;
    var { mask, maskChar, lastEditablePos, prefix } = this.maskOptions;
    var value = this.getInputValue();
    if (!value && this.preventEmptyChange) {
      this.disableValueAccessors();
      this.preventEmptyChange = false;
      this.setInputValue(this.state.value);
      return;
    }
    var oldValue = this.state.value;
    if (pasteSelection) {
      this.pasteSelection = null;
      this.pasteText(oldValue, value, pasteSelection, event);
      return;
    }
    var selection = this.getSelection();
    var cursorPos = selection.end;
    var maskLen = mask.length;
    var valueLen = value.length;
    var oldValueLen = oldValue.length;

    var clearedValue;
    var enteredString;

    if (valueLen > oldValueLen) {
      var enteredStringLen = valueLen - oldValueLen;
      var startPos = selection.end - enteredStringLen;
      enteredString = value.substr(startPos, enteredStringLen);

      if (startPos < lastEditablePos && (enteredStringLen !== 1 || enteredString !== mask[startPos])) {
        cursorPos = this.getRightEditablePos(startPos);
      } else {
        cursorPos = startPos;
      }

      value = value.substr(0, startPos) + value.substr(startPos + enteredStringLen);

      clearedValue = clearRange(this.maskOptions, value, startPos, maskLen - startPos);
      clearedValue = insertString(this.maskOptions, clearedValue, enteredString, cursorPos);

      value = insertString(this.maskOptions, oldValue, enteredString, cursorPos);

      if (enteredStringLen !== 1 || (cursorPos >= prefix.length && cursorPos < lastEditablePos)) {
        cursorPos = getFilledLength(this.maskOptions, clearedValue);
      } else if (cursorPos < lastEditablePos) {
        cursorPos++;
      }
    } else if (valueLen < oldValueLen) {
      var removedLen = maskLen - valueLen;
      enteredString = value.substr(0, selection.end);
      var clearOnly = enteredString === oldValue.substr(0, selection.end);

      clearedValue = clearRange(this.maskOptions, oldValue, selection.end, removedLen);

      if (maskChar) {
        value = insertString(this.maskOptions, clearedValue, enteredString, 0);
      }

      clearedValue = clearRange(this.maskOptions, clearedValue, selection.end, maskLen - selection.end);
      clearedValue = insertString(this.maskOptions, clearedValue, enteredString, 0);

      if (!clearOnly) {
        cursorPos = getFilledLength(this.maskOptions, clearedValue);
      } else if (cursorPos < prefix.length) {
        cursorPos = prefix.length;
      }
    }
    value = formatValue(this.maskOptions, value);

    if (this.isWindowsPhoneBrowser) {
      event.persist();
      setTimeout(() => {
        this.setInputValue(value);

        if (!this.hasValue) {
          this.setState({
            value: value
          });
        }

        if (typeof this.props.onChange === 'function') {
          this.props.onChange(event);
        }

        this.setCursorPos(cursorPos);
      }, 0);
    } else {
      // prevent android autocomplete insertion on backspace
      if (!this.canUseAccessors || (!this.isAndroidBrowser)) {
        this.setInputValue(value);
      }

      if (this.canUseAccessors && ((this.isAndroidFirefox && value && !this.getInputValue()) || this.isAndroidBrowser)) {
        this.value = value;
        this.enableValueAccessors();
        if (this.isAndroidFirefox) {
          this.preventEmptyChange = true;
        }
        setTimeout(() => {
          this.preventEmptyChange = false;
          this.disableValueAccessors();
        }, 0);
      }

      this.setState({
        value: this.hasValue ? this.state.value : value
      });

      if (typeof this.props.onChange === 'function') {
        this.props.onChange(event);
      }

      this.setCursorPos(cursorPos);
    }
  }

  onFocus = (event) => {
    if (!this.state.value) {
      var prefix = this.maskOptions.prefix;
      var value = formatValue(this.maskOptions, prefix);
      var inputValue = formatValue(this.maskOptions, value);

      // do not use this.getInputValue and this.setInputValue as this.input
      // can be undefined at this moment if autoFocus attribute is set
      var isInputValueChanged = inputValue !== event.target.value;

      if (isInputValueChanged) {
        event.target.value = inputValue;
      }

      this.setState({
        value: this.hasValue ? this.state.value : inputValue
      }, this.setCursorToEnd);

      if (isInputValueChanged && typeof this.props.onChange === 'function') {
        this.props.onChange(event);
      }
    } else if (getFilledLength(this.maskOptions, this.state.value) < this.maskOptions.mask.length) {
      this.setCursorToEnd();
    }

    if (typeof this.props.onFocus === 'function') {
      this.props.onFocus(event);
    }
  }

  onBlur = (event) => {
    if (!this.props.alwaysShowMask && isEmpty(this.maskOptions, this.state.value)) {
      var inputValue = '';
      var isInputValueChanged = inputValue !== this.getInputValue();

      if (isInputValueChanged) {
        this.setInputValue(inputValue);
      }

      this.setState({
        value: this.hasValue ? this.state.value : ''
      });

      if (isInputValueChanged && typeof this.props.onChange === 'function') {
        this.props.onChange(event);
      }
    }

    if (typeof this.props.onBlur === 'function') {
      this.props.onBlur(event);
    }
  }

  onPaste = (event) => {
    if (this.isAndroidBrowser) {
      this.pasteSelection = this.getSelection();
      this.setInputValue('');
      return;
    }

    var text;
    if (window.clipboardData && window.clipboardData.getData) { // IE
      text = window.clipboardData.getData('Text');
    } else if (event.clipboardData && event.clipboardData.getData) {
      text = event.clipboardData.getData('text/plain');
    }

    if (text) {
      var value = this.state.value;
      var selection = this.getSelection();
      this.pasteText(value, text, selection, event);
    }

    event.preventDefault();
  }

  pasteText = (value, text, selection, event) => {
    var cursorPos = selection.start;
    if (selection.length) {
      value = clearRange(this.maskOptions, value, cursorPos, selection.length);
    }
    var textLen = getInsertStringLength(this.maskOptions, value, text, cursorPos);
    value = insertString(this.maskOptions, value, text, cursorPos);
    cursorPos += textLen;
    cursorPos = this.getRightEditablePos(cursorPos) || cursorPos;

    if (value !== this.getInputValue()) {
      if (event) {
        this.setInputValue(value);
      }
      this.setState({
        value: this.hasValue ? this.state.value : value
      });
      if (event && typeof this.props.onChange === 'function') {
        this.props.onChange(event);
      }
    }

    this.setCursorPos(cursorPos);
  }

  render = () => {
    var { mask, alwaysShowMask, maskChar, formatChars, ...props } = this.props;

    if (this.maskOptions.mask) {
      if (!props.disabled && !props.readOnly) {
        var handlersKeys = ['onFocus', 'onBlur', 'onChange', 'onKeyDown', 'onKeyPress', 'onPaste'];
        handlersKeys.forEach((key) => {
          props[key] = this[key];
        });
      }

      if (props.value != null) {
        props.value = this.state.value;
      }
    }

    return <input ref={ref => this.input = ref} {...props} />;
  }
}

export default InputElement;
