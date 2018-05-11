import React from 'react';

import { setInputSelection, getInputSelection } from './utils/selection';
import parseMask from './utils/parseMask';
import { isWindowsPhoneBrowser } from './utils/environment';
import {
  clearRange,
  formatValue,
  getFilledLength,
  isFilled,
  isEmpty,
  getInsertStringLength,
  insertString,
  getLeftEditablePosition,
  getRightEditablePosition,
  getStringValue
} from './utils/string';
import { isDOMElement, isFunction } from './utils/helpers';
import { defer, cancelDefer } from './utils/defer';

class InputElement extends React.Component {
  focused = false
  mounted = false
  previousSelection = null
  selectionDeferId = null
  saveSelectionLoopDeferId = null

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

    value = getStringValue(value);

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
    var { previousSelection } = this;
    var { beforeMaskedValueChange } = this.props;
    var oldMaskOptions = this.maskOptions;

    this.hasValue = this.props.value != null;
    this.maskOptions = parseMask(this.props.mask, this.props.maskChar, this.props.formatChars);

    if (!this.maskOptions.mask) {
      this.stopSaveSelectionLoop();
      this.previousSelection = null;
      return;
    } else if (!oldMaskOptions.mask && this.isFocused()) {
      this.runSaveSelectionLoop();
    }

    var cursorPosition = previousSelection ? previousSelection.start : null;
    var isMaskChanged = this.maskOptions.mask && this.maskOptions.mask !== oldMaskOptions.mask;
    var showEmpty = this.props.alwaysShowMask || this.isFocused();
    var newValue = this.hasValue
      ? getStringValue(this.props.value)
      : this.value;

    if (!oldMaskOptions.mask && !this.hasValue) {
      newValue = this.getInputValue();
    }

    if (isMaskChanged || (this.maskOptions.mask && (newValue || showEmpty))) {
      newValue = formatValue(this.maskOptions, newValue);
    }

    if (isMaskChanged) {
      var filledLength = getFilledLength(this.maskOptions, newValue);
      if (cursorPosition === null || filledLength < cursorPosition) {
        if (isFilled(this.maskOptions, newValue)) {
          cursorPosition = filledLength;
        } else {
          cursorPosition = getRightEditablePosition(this.maskOptions, filledLength);
        }
      }
    }

    if (this.maskOptions.mask && isEmpty(this.maskOptions, newValue) && !showEmpty && (!this.hasValue || !this.props.value)) {
      newValue = '';
    }

    var newSelection = { start: cursorPosition, end: cursorPosition };

    if (isFunction(beforeMaskedValueChange)) {
      var modifiedValue = beforeMaskedValueChange(
        { value: newValue, selection: newSelection },
        { value: this.value, selection: this.previousSelection },
        null,
        this.getModifyMaskedValueConfig()
      );
      newValue = modifiedValue.value;
      newSelection = modifiedValue.selection;
    }

    this.value = newValue;

    if (this.maskOptions.mask && this.getInputValue() !== this.value) {
      this.setInputValue(this.value);
      this.forceUpdate();
    }

    var isSelectionChanged = false;
    if (newSelection.start != null && newSelection.end != null) {
      isSelectionChanged = !previousSelection
                           ||
                           previousSelection.start !== newSelection.start
                           ||
                           previousSelection.end !== newSelection.end;
    }

    if (isSelectionChanged) {
      this.setSelection(newSelection.start, newSelection.end);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    if (this.selectionDeferId !== null) {
      cancelDefer(this.selectionDeferId);
    }
    this.stopSaveSelectionLoop();
  }

  saveSelectionLoop = () => {
    this.previousSelection = this.getSelection();
    this.saveSelectionLoopDeferId = defer(this.saveSelectionLoop);
  }

  runSaveSelectionLoop = () => {
    if (this.saveSelectionLoopDeferId === null) {
      this.saveSelectionLoop();
    }
  }

  stopSaveSelectionLoop = () => {
    if (this.saveSelectionLoopDeferId !== null) {
      cancelDefer(this.saveSelectionLoopDeferId);
      this.saveSelectionLoopDeferId = null;
    }
  }

  getInputDOMNode = () => {
    var input = this.input;
    if (!input) {
      return null;
    }

    if (isDOMElement(input)) {
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

  setCursorToEnd = () => {
    var filledLength = getFilledLength(this.maskOptions, this.value);
    var pos = getRightEditablePosition(this.maskOptions, filledLength);
    if (pos !== null) {
      this.setCursorPosition(pos);
    }
  }

  setSelection = (start, end, options = {}) => {
    var input = this.getInputDOMNode();
    if (!input) {
      return;
    }

    var { deferred } = options;

    if (!deferred) {
      setInputSelection(input, start, end);
    }

    if (this.selectionDeferId !== null) {
      cancelDefer(this.selectionDeferId);
    }

    // deferred selection update is required for pre-Lollipop Android browser,
    // but for consistent behavior we do it for all browsers
    this.selectionDeferId = defer(() => {
      this.selectionDeferId = null;
      setInputSelection(input, start, end);
    });

    this.previousSelection = {
      start,
      end,
      length: Math.abs(end - start)
    };
  }

  getSelection = () => {
    var input = this.getInputDOMNode();

    return getInputSelection(input);
  }

  getCursorPosition = () => {
    return this.getSelection().start;
  }

  setCursorPosition = (pos) => {
    this.setSelection(pos, pos);
  }

  isFocused = () => {
    return this.focused;
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
      if (isFunction(input.matches) && input.matches(':-webkit-autofill')) {
        isAutofilled = true;
      }
    } catch (e) {}

    return isAutofilled;
  }

  onChange = (event) => {
    var { beforePasteState, previousSelection } = this;
    var { beforeMaskedValueChange } = this.props;
    var { mask, prefix, lastEditablePosition } = this.maskOptions;
    var newValue = this.getInputValue();
    var previousValue = this.value;
    var enteredString = '';
    var selection = this.getSelection();
    var cursorPosition = selection.end;
    var formattedEnteredStringLength = 0;
    var removedLength;

    // autofill replaces entire value, ignore old one
    // https://github.com/sanniassin/react-input-mask/issues/113
    if (this.isInputAutofilled()) {
      previousValue = formatValue(this.maskOptions, '');
      previousSelection = { start: 0, end: 0, length: 0 };
    }

    // set value and selection as if we haven't
    // cleared input in onPaste handler
    if (beforePasteState) {
      previousSelection = beforePasteState.selection;
      previousValue = beforePasteState.value;
      cursorPosition = previousSelection.start + newValue.length;
      selection = { start: cursorPosition, end: cursorPosition, length: 0 };
      newValue = previousValue.slice(0, previousSelection.start) + newValue + previousValue.slice(previousSelection.end);
      this.beforePasteState = null;
    }

    cursorPosition = Math.min(previousSelection.start, selection.start);

    if (selection.end > previousSelection.start) {
      enteredString = newValue.slice(previousSelection.start, selection.end);
      formattedEnteredStringLength = getInsertStringLength(this.maskOptions, previousValue, enteredString, cursorPosition);
      if (!formattedEnteredStringLength) {
        removedLength = 0;
      } else {
        removedLength = previousSelection.length;
      }
    } else if (newValue.length < previousValue.length) {
      removedLength = previousValue.length - newValue.length;
    }

    newValue = previousValue;

    if (removedLength) {
      if (removedLength === 1 && !previousSelection.length) {
        var deleteFromRight = previousSelection.start === selection.start;
        cursorPosition = deleteFromRight
          ? getRightEditablePosition(this.maskOptions, selection.start)
          : getLeftEditablePosition(this.maskOptions, selection.start);
      }
      newValue = clearRange(this.maskOptions, newValue, cursorPosition, removedLength);
    }

    newValue = insertString(this.maskOptions, newValue, enteredString, cursorPosition);

    cursorPosition = cursorPosition + formattedEnteredStringLength;
    if (cursorPosition >= mask.length) {
      cursorPosition = mask.length;
    } else if (cursorPosition < prefix.length && !formattedEnteredStringLength) {
      cursorPosition = prefix.length;
    } else if (cursorPosition >= prefix.length && cursorPosition < lastEditablePosition && formattedEnteredStringLength) {
      cursorPosition = getRightEditablePosition(this.maskOptions, cursorPosition);
    }

    newValue = formatValue(this.maskOptions, newValue);

    if (!enteredString) {
      enteredString = null;
    }

    var newSelection = { start: cursorPosition, end: cursorPosition };

    if (isFunction(beforeMaskedValueChange)) {
      var modifiedValue = beforeMaskedValueChange(
        { value: newValue, selection: newSelection },
        { value: previousValue, selection: previousSelection },
        enteredString,
        this.getModifyMaskedValueConfig()
      );
      newValue = modifiedValue.value;
      newSelection = modifiedValue.selection;
    }

    this.setInputValue(newValue);

    if (isFunction(this.props.onChange)) {
      this.props.onChange(event);
    }

    if (this.isWindowsPhoneBrowser) {
      this.setSelection(newSelection.start, newSelection.end, { deferred: true });
    } else {
      this.setSelection(newSelection.start, newSelection.end);
    }
  }

  onFocus = (event) => {
    var { beforeMaskedValueChange } = this.props;
    var { mask, prefix } = this.maskOptions;
    this.focused = true;

    // if autoFocus is set, onFocus triggers before componentDidMount
    this.input = event.target;
    this.mounted = true;

    if (mask) {
      if (!this.value) {
        var emptyValue = formatValue(this.maskOptions, prefix);
        var newValue = formatValue(this.maskOptions, emptyValue);
        var filledLength = getFilledLength(this.maskOptions, newValue);
        var cursorPosition = getRightEditablePosition(this.maskOptions, filledLength);
        var newSelection = { start: cursorPosition, end: cursorPosition };

        if (isFunction(beforeMaskedValueChange)) {
          var modifiedValue = beforeMaskedValueChange(
            { value: newValue, selection: newSelection },
            { value: this.value, selection: null },
            null,
            this.getModifyMaskedValueConfig()
          );
          newValue = modifiedValue.value;
          newSelection = modifiedValue.selection;
        }

        // do not use this.getInputValue and this.setInputValue as this.input
        // will be undefined if it's an initial mount of input with autoFocus attribute
        var isInputValueChanged = newValue !== event.target.value;

        if (isInputValueChanged) {
          event.target.value = newValue;
        }

        this.value = newValue;

        if (isInputValueChanged && isFunction(this.props.onChange)) {
          this.props.onChange(event);
        }

        this.setSelection(newSelection.start, newSelection.end);
      } else if (getFilledLength(this.maskOptions, this.value) < this.maskOptions.mask.length) {
        this.setCursorToEnd();
      }
    }

    this.runSaveSelectionLoop();

    if (isFunction(this.props.onFocus)) {
      this.props.onFocus(event);
    }
  }

  onBlur = (event) => {
    var { beforeMaskedValueChange } = this.props;
    var { mask } = this.maskOptions;

    this.stopSaveSelectionLoop();
    this.previousSelection = null;
    this.focused = false;

    if (mask && !this.props.alwaysShowMask && isEmpty(this.maskOptions, this.value)) {
      var newValue = '';

      if (isFunction(beforeMaskedValueChange)) {
        var modifiedValue = beforeMaskedValueChange(
          { value: newValue, selection: null },
          { value: this.value, selection: this.previousSelection },
          null,
          this.getModifyMaskedValueConfig()
        );
        newValue = modifiedValue.value;
      }

      var isInputValueChanged = newValue !== this.getInputValue();

      if (isInputValueChanged) {
        this.setInputValue(newValue);
      }

      if (isInputValueChanged && isFunction(this.props.onChange)) {
        this.props.onChange(event);
      }
    }

    if (isFunction(this.props.onBlur)) {
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

    if (isFunction(this.props.onMouseDown)) {
      this.props.onMouseDown(event);
    }
  }

  onPaste = (event) => {
    if (isFunction(this.props.onPaste)) {
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

    if (isFunction(this.props.inputRef)) {
      this.props.inputRef(ref);
    }
  }

  render() {
    var { mask, alwaysShowMask, maskChar, formatChars, inputRef, beforeMaskedValueChange, ...props } = this.props;

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
