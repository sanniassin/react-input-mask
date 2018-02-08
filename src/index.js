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
  getInsertStringLength,
  insertString
} from './utils/string';
import defer from './utils/defer';

class InputElement extends React.Component {
  lastCursorPos = null
  focused = false

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

    this.value = value;
  }

  componentDidMount() {
    this.isAndroidBrowser = isAndroidBrowser();
    this.isWindowsPhoneBrowser = isWindowsPhoneBrowser();
    this.isAndroidFirefox = isAndroidFirefox();

    if (this.maskOptions.mask && this.getInputValue() !== this.value) {
      this.setInputValue(this.value);
    }
  }

  componentWillReceiveProps(nextProps) {
    var oldMaskOptions = this.maskOptions;

    this.hasValue = nextProps.value != null;
    this.maskOptions = parseMask(nextProps.mask, nextProps.maskChar, nextProps.formatChars);

    if (!this.maskOptions.mask) {
      this.backspaceOrDeleteRemoval = null;
      this.lastCursorPos = null;
      return;
    }

    var isMaskChanged = this.maskOptions.mask && this.maskOptions.mask !== oldMaskOptions.mask;
    var showEmpty = nextProps.alwaysShowMask || this.isFocused();
    var newValue = this.hasValue
      ? this.getStringValue(nextProps.value)
      : this.value;

    if (!oldMaskOptions.mask && !this.hasValue) {
      newValue = this.getInputValue();
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
  }

  componentDidUpdate() {
    if (this.maskOptions.mask && this.getInputValue() !== this.value) {
      this.setInputValue(this.value);
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

  getInputValue = () => {
    var input = this.getInputDOMNode();
    if (!input) {
      return null;
    }

    return input.value;
  }

  setInputValue = (value) => {
    var input = this.getInputDOMNode();
    if (!input) {
      return;
    }

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
    var filledLen = getFilledLength(this.maskOptions, this.value);
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
    this.setSelection(pos, 0);

    defer(() => {
      this.setSelection(pos, 0);
    });

    this.lastCursorPos = pos;
  }

  isFocused = () => {
    return this.focused;
  }

  getStringValue = (value) => {
    return !value && value !== 0 ? '' : value + '';
  }

  onKeyDown = (event) => {
    this.backspaceOrDeleteRemoval = null;

    if (typeof this.props.onKeyDown === 'function') {
      this.props.onKeyDown(event);
    }

    var { key, ctrlKey, metaKey, defaultPrevented } = event;
    if (ctrlKey || metaKey || defaultPrevented) {
      return;
    }

    if (key === 'Backspace' || key === 'Delete') {
      var selection = this.getSelection();
      var canRemove = (key === 'Backspace' && selection.end > 0)
                      ||
                      (key === 'Delete' && this.value.length > selection.start);

      if (!canRemove) {
        return;
      }

      this.backspaceOrDeleteRemoval = {
        key: key,
        selection: this.getSelection()
      };
    }
  }

  onChange = (event) => {
    var { beforePasteState } = this;
    var { mask, maskChar, lastEditablePos, prefix } = this.maskOptions;
    var value = this.getInputValue();

    if (beforePasteState) {
      this.beforePasteState = null;
      this.pasteText(beforePasteState.value, value, beforePasteState.selection, event);
      return;
    }

    var oldValue = this.value;
    var input = this.getInputDOMNode();

    // autofill replaces whole value, ignore old one
    // https://github.com/sanniassin/react-input-mask/issues/113
    //
    // input.matches throws exception if selector isn't supported
    try {
      if (typeof input.matches === 'function' && input.matches(':-webkit-autofill')) {
        oldValue = '';
      }
    } catch (e) {}

    var selection = this.getSelection();
    var cursorPos = selection.end;
    var maskLen = mask.length;
    var valueLen = value.length;
    var oldValueLen = oldValue.length;

    var clearedValue;
    var enteredString;

    if (this.backspaceOrDeleteRemoval) {
      var deleteFromRight = this.backspaceOrDeleteRemoval.key === 'Delete';
      value = this.value;
      selection = this.backspaceOrDeleteRemoval.selection;
      cursorPos = selection.start;

      this.backspaceOrDeleteRemoval = null;

      if (selection.length) {
        value = clearRange(this.maskOptions, value, selection.start, selection.length);
      } else if (selection.start < prefix.length || (!deleteFromRight && selection.start === prefix.length)) {
        cursorPos = prefix.length;
      } else {
        var editablePos = deleteFromRight
          ? this.getRightEditablePos(cursorPos)
          : this.getLeftEditablePos(cursorPos - 1);

        if (editablePos !== null) {
          if (!maskChar) {
            value = value.substr(0, getFilledLength(this.maskOptions, value));
          }
          value = clearRange(this.maskOptions, value, editablePos, 1);
          cursorPos = editablePos;
        }
      }
    } else if (valueLen > oldValueLen) {
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
        cursorPos = Math.max(getFilledLength(this.maskOptions, clearedValue), cursorPos);
        if (cursorPos < lastEditablePos) {
          cursorPos = this.getRightEditablePos(cursorPos);
        }
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
        cursorPos = Math.max(getFilledLength(this.maskOptions, clearedValue), cursorPos);
        if (cursorPos < lastEditablePos) {
          cursorPos = this.getRightEditablePos(cursorPos);
        }
      } else if (cursorPos < prefix.length) {
        cursorPos = prefix.length;
      }
    }
    value = formatValue(this.maskOptions, value);

    this.setInputValue(value);

    if (typeof this.props.onChange === 'function') {
      this.props.onChange(event);
    }

    if (this.isWindowsPhoneBrowser) {
      defer(() => {
        this.setSelection(cursorPos, 0);
      });
    } else {
      this.setCursorPos(cursorPos);
    }
  }

  onFocus = (event) => {
    this.focused = true;

    if (this.maskOptions.mask) {
      if (!this.value) {
        var prefix = this.maskOptions.prefix;
        var value = formatValue(this.maskOptions, prefix);
        var inputValue = formatValue(this.maskOptions, value);

        // do not use this.getInputValue and this.setInputValue as this.input
        // can be undefined at this moment if autoFocus attribute is set
        var isInputValueChanged = inputValue !== event.target.value;

        if (isInputValueChanged) {
          event.target.value = inputValue;
        }

        this.value = inputValue;

        if (isInputValueChanged && typeof this.props.onChange === 'function') {
          this.props.onChange(event);
        }

        this.setCursorToEnd();
      } else if (getFilledLength(this.maskOptions, this.value) < this.maskOptions.mask.length) {
        this.setCursorToEnd();
      }
    }

    if (typeof this.props.onFocus === 'function') {
      this.props.onFocus(event);
    }
  }

  onBlur = (event) => {
    this.focused = false;

    if (this.maskOptions.mask && !this.props.alwaysShowMask && isEmpty(this.maskOptions, this.value)) {
      var inputValue = '';
      var isInputValueChanged = inputValue !== this.getInputValue();

      if (isInputValueChanged) {
        this.setInputValue(inputValue);
      }

      if (isInputValueChanged && typeof this.props.onChange === 'function') {
        this.props.onChange(event);
      }
    }

    if (typeof this.props.onBlur === 'function') {
      this.props.onBlur(event);
    }
  }

  onMouseDown = (event) => {
    // tiny unintentional mouse movements can break cursor
    // position on focus, so we have to restore it in that case
    //
    // https://github.com/sanniassin/react-input-mask/issues/108
    if (!this.focused && document.addEventListener) {
      this.mouseDownX = event.clientX;
      this.mouseDownY = event.clientY;
      this.mouseDownTime = (new Date()).getTime();

      var mouseUpHandler = (mouseUpEvent) => {
        document.removeEventListener('mouseup', mouseUpHandler);

        if (!this.focused) {
          return;
        }

        var deltaX = Math.abs(mouseUpEvent.clientX - this.mouseDownX);
        var deltaY = Math.abs(mouseUpEvent.clientY - this.mouseDownY);
        var axisDelta = Math.max(deltaX, deltaY);
        var timeDelta = (new Date()).getTime() - this.mouseDownTime;

        if ((axisDelta <= 10 && timeDelta <= 200) || (axisDelta <= 5 && timeDelta <= 300)) {
          this.setCursorToEnd();
        }
      };

      document.addEventListener('mouseup', mouseUpHandler);
    }

    if (typeof this.props.onMouseDown === 'function') {
      this.props.onMouseDown(event);
    }
  }

  onPaste = (event) => {
    if (typeof this.props.onPaste === 'function') {
      this.props.onPaste(event);
    }

    // we need raw pasted text, but event.clipboardData
    // may not work in Android browser, so we clean input
    // to get raw text in onChange handler
    if (!event.defaultPrevented) {
      this.beforePasteState = {
        value: this.getInputValue(),
        selection: this.getSelection()
      };
      this.setInputValue('');
    }
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

    this.setInputValue(value);
    if (event && typeof this.props.onChange === 'function') {
      this.props.onChange(event);
    }

    this.setCursorPos(cursorPos);
  }

  render() {
    var { mask, alwaysShowMask, maskChar, formatChars, userRef, ...props } = this.props;

    var assignRef = ref => {
      if (typeof userRef === 'function') {
        userRef(ref);
      }

      this.input = ref;
    }

    if (this.maskOptions.mask) {
      if (!props.disabled && !props.readOnly) {
        var handlersKeys = ['onChange', 'onKeyDown', 'onPaste', 'onMouseDown'];
        handlersKeys.forEach((key) => {
          props[key] = this[key];
        });
      }

      if (props.value != null) {
        props.value = this.value;
      }
    }

    return <input ref={assignRef} {...props} onFocus={this.onFocus} onBlur={this.onBlur} />;
  }
}

export default InputElement;
