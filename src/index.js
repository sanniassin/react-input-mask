import React from 'react';

import parseMask from './utils/parseMask';
import { isWindowsPhoneBrowser } from './utils/environment';
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
  mounted = false
  previousSelection = null

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
    this.mounted = true;

    this.isWindowsPhoneBrowser = isWindowsPhoneBrowser();

    if (this.maskOptions.mask && this.getInputValue() !== this.value) {
      this.setInputValue(this.value);
    }

    if (this.props.maxLength && this.maskOptions.mask && typeof console === 'object' && console.error) {
      console.error('react-input-mask: You shouldn\'t pass maxLength property to the masked input. It breaks masking and unnecessary because length is limited by the mask length.');
    }
  }

  componentDidUpdate() {
    var { beforeChange } = this.props;
    var oldMaskOptions = this.maskOptions;

    this.hasValue = this.props.value != null;
    this.maskOptions = parseMask(this.props.mask, this.props.maskChar, this.props.formatChars);

    if (!this.maskOptions.mask) {
      this.backspaceOrDeleteRemoval = null;
      this.lastCursorPos = null;
      return;
    }

    var cursorPos = this.lastCursorPos;
    var isMaskChanged = this.maskOptions.mask && this.maskOptions.mask !== oldMaskOptions.mask;
    var showEmpty = this.props.alwaysShowMask || this.isFocused();
    var newValue = this.hasValue
      ? this.getStringValue(this.props.value)
      : this.value;

    if (!oldMaskOptions.mask && !this.hasValue) {
      newValue = this.getInputValue();
    }

    if (isMaskChanged || (this.maskOptions.mask && (newValue || showEmpty))) {
      newValue = formatValue(this.maskOptions, newValue);

      if (isMaskChanged) {
        var filledLen = getFilledLength(this.maskOptions, newValue);
        if (cursorPos === null || filledLen < cursorPos) {
          if (isFilled(this.maskOptions, newValue)) {
            cursorPos = filledLen;
          } else {
            cursorPos = this.getRightEditablePos(filledLen);
          }
        }

        if (!oldMaskOptions.mask) {
          this.saveSelectionLoop();
        }
      }
    }

    if (this.maskOptions.mask && isEmpty(this.maskOptions, newValue) && !showEmpty && (!this.hasValue || !this.props.value)) {
      newValue = '';
    }

    if (typeof beforeChange === 'function') {
      var modifiedValue = beforeChange(newValue, cursorPos, null, this.getModifyMaskedValueConfig());
      newValue = modifiedValue.value;
      cursorPos = modifiedValue.cursorPosition;
    }

    this.value = newValue;
    if (cursorPos !== this.lastCursorPos) {
      this.setCursorPos(cursorPos);
    }

    if (this.maskOptions.mask && this.getInputValue() !== this.value) {
      this.setInputValue(this.value);
      this.forceUpdate();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  saveSelectionLoop = () => {
    if (!this.mounted || !this.maskOptions.mask || !this.focused || this.saveSelectionLoopRunning) {
      return;
    }

    this.saveSelectionLoopRunning = true;
    this.previousSelection = this.getSelection();
    defer(() => {
      this.saveSelectionLoopRunning = false;
      this.saveSelectionLoop();
    }, 1000 / 60);
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

  setSelection = (start, length = 0) => {
    var input = this.getInputDOMNode();
    if (!input) {
      return;
    }

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

    this.previousSelection = {
      start,
      end,
      length
    };
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
      start,
      end,
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

  getModifyMaskedValueConfig = () => {
    var { mask, maskChar, permanents, formatChars } = this.maskOptions;
    var { alwaysShowMask } = this.props;

    return {
      mask,
      maskChar,
      permanents,
      alwaysShowMask: !!alwaysShowMask,
      formatChars
    };
  }

  isInputAutofilled = () => {
    var input = this.getInputDOMNode();
    var isAutofilled = false;

    // input.matches throws an exception if selector isn't supported
    try {
      if (typeof input.matches === 'function' && input.matches(':-webkit-autofill')) {
        isAutofilled = true;
      }
    } catch (e) {}

    return isAutofilled;
  }

  onChange = (event) => {
    var { beforePasteState, previousSelection } = this;
    var { beforeChange } = this.props;
    var { mask, prefix, lastEditablePos } = this.maskOptions;
    var value = this.getInputValue();
    var oldValue = this.value;

    // autofill replaces entire value, ignore old one
    // https://github.com/sanniassin/react-input-mask/issues/113
    if (this.isInputAutofilled()) {
      oldValue = formatValue(this.maskOptions, '');
      previousSelection = { start: 0, end: 0, length: 0 };
    }

    var enteredString = '';
    var selection = this.getSelection();
    var cursorPos = selection.end;
    selection.start = selection.end;
    selection.length = 0;

    // set value and selection as if we haven't
    // cleared input in onPaste handler
    if (beforePasteState) {
      previousSelection = beforePasteState.selection;
      oldValue = beforePasteState.value;
      cursorPos = previousSelection.start + value.length;
      selection = { start: cursorPos, end: cursorPos, length: 0 };
      value = oldValue.slice(0, previousSelection.start) + value + oldValue.slice(previousSelection.end);
      this.beforePasteState = null;
    }

    var formattedEnteredStringLen = 0;
    var removedLen = previousSelection.length;

    cursorPos = Math.min(previousSelection.start, selection.start);

    if (selection.end > previousSelection.start) {
      enteredString = value.slice(previousSelection.start, selection.end);
      formattedEnteredStringLen = getInsertStringLength(this.maskOptions, oldValue, enteredString, cursorPos);
      if (!formattedEnteredStringLen) {
        removedLen = 0;
      }
    } else if (value.length < oldValue.length) {
      removedLen = oldValue.length - value.length;
    }

    value = oldValue;

    if (removedLen) {
      if (removedLen === 1 && !previousSelection.length) {
        var deleteFromRight = previousSelection.start === selection.start;
        cursorPos = deleteFromRight
          ? this.getRightEditablePos(selection.start)
          : this.getLeftEditablePos(selection.start);
      }
      value = clearRange(this.maskOptions, value, cursorPos, removedLen);
    }

    value = insertString(this.maskOptions, value, enteredString, cursorPos);

    cursorPos = cursorPos + formattedEnteredStringLen;
    if (cursorPos >= mask.length) {
      cursorPos = mask.length;
    } else if (cursorPos < prefix.length && !formattedEnteredStringLen) {
      cursorPos = prefix.length;
    } else if (cursorPos >= prefix.length && cursorPos < lastEditablePos && formattedEnteredStringLen) {
      cursorPos = this.getRightEditablePos(cursorPos);
    }

    value = formatValue(this.maskOptions, value);

    if (!enteredString) {
      enteredString = null;
    }

    if (typeof beforeChange === 'function') {
      var modifiedValue = beforeChange(value, cursorPos, enteredString, this.getModifyMaskedValueConfig());
      value = modifiedValue.value;
      cursorPos = modifiedValue.cursorPosition;
    }

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
    var { beforeChange } = this.props;
    var { mask, prefix } = this.maskOptions;
    this.focused = true;

    if (mask) {
      if (!this.value) {
        var value = formatValue(this.maskOptions, prefix);
        var inputValue = formatValue(this.maskOptions, value);
        var filledLen = getFilledLength(this.maskOptions, inputValue);
        var cursorPos = this.getRightEditablePos(filledLen);

        if (typeof beforeChange === 'function') {
          var modifiedValue = beforeChange(inputValue, cursorPos, null, this.getModifyMaskedValueConfig());
          inputValue = modifiedValue.value;
          cursorPos = modifiedValue.cursorPosition;
        }

        // do not use this.getInputValue and this.setInputValue as this.input
        // will be undefined if it's an initial mount of input with autoFocus attribute
        var isInputValueChanged = inputValue !== event.target.value;

        if (isInputValueChanged) {
          event.target.value = inputValue;
        }

        this.value = inputValue;

        if (isInputValueChanged && typeof this.props.onChange === 'function') {
          this.props.onChange(event);
        }

        this.setCursorPos(cursorPos);
      } else if (getFilledLength(this.maskOptions, this.value) < this.maskOptions.mask.length) {
        this.setCursorToEnd();
      }
    }

    this.saveSelectionLoop();

    if (typeof this.props.onFocus === 'function') {
      this.props.onFocus(event);
    }
  }

  onBlur = (event) => {
    var { beforeChange } = this.props;
    var { mask } = this.maskOptions;
    this.focused = false;

    if (mask && !this.props.alwaysShowMask && isEmpty(this.maskOptions, this.value)) {
      var inputValue = '';

      if (typeof beforeChange === 'function') {
        var modifiedValue = beforeChange(inputValue, null, null, this.getModifyMaskedValueConfig());
        inputValue = modifiedValue.value;
      }

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

    // event.clipboardData might not work in Android browser
    // cleaning input to get raw text inside onChange handler
    if (!event.defaultPrevented) {
      this.beforePasteState = {
        value: this.getInputValue(),
        selection: this.getSelection()
      };
      this.setInputValue('');
    }
  }

  handleRef = (ref) => {
    this.input = ref;

    if (typeof this.props.inputRef === 'function') {
      this.props.inputRef(ref);
    }
  }

  render() {
    var { mask, alwaysShowMask, maskChar, formatChars, inputRef, beforeChange, ...props } = this.props;

    if (this.maskOptions.mask) {
      if (!props.disabled && !props.readOnly) {
        var handlersKeys = ['onChange', 'onPaste', 'onMouseDown'];
        handlersKeys.forEach((key) => {
          props[key] = this[key];
        });
      }

      if (props.value != null) {
        props.value = this.value;
      }
    }

    return <input ref={this.handleRef} {...props} onFocus={this.onFocus} onBlur={this.onBlur} />;
  }
}

export default InputElement;
