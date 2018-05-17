import React from 'react';
import { findDOMNode } from 'react-dom';
import invariant from 'invariant';
import warning from 'warning';

import { setInputSelection, getInputSelection } from './utils/selection';
import parseMask from './parseMask';
import processChange from './processChange';
import { isWindowsPhoneBrowser } from './utils/environment';
import {
  formatValue,
  getFilledLength,
  isFilled,
  isEmpty,
  getRightEditablePosition,
  getStringValue
} from './utils/string';
import { isFunction } from './utils/helpers';
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
  }

  componentDidUpdate() {
    var { previousSelection } = this;
    var { beforeMaskedValueChange } = this.props;
    var oldMaskOptions = this.maskOptions;

    this.hasValue = this.props.value != null;
    this.maskOptions = parseMask(this.props.mask, this.props.maskChar, this.props.formatChars);

    var cursorPosition = previousSelection ? previousSelection.start : null;

    if (!this.maskOptions.mask) {
      if (oldMaskOptions.mask) {
        this.stopSaveSelectionLoop();

        // render depends on this.maskOptions and this.value,
        // call forceUpdate to keep it in sync
        this.forceUpdate();
      }
      return;
    } else if (!oldMaskOptions.mask && this.isFocused()) {
      this.runSaveSelectionLoop();
    }

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

    // render depends on this.maskOptions and this.value,
    // call forceUpdate to keep it in sync
    if (this.getInputValue() !== this.value) {
      this.setInputValue(this.value);
      this.forceUpdate();
    } else if (isMaskChanged) {
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
      this.previousSelection = null;
    }
  }

  getInputDOMNode = () => {
    if (!this.mounted) {
      return null;
    }

    if (this.input) {
      return this.input;
    }

    var input = findDOMNode(this);

    if (input.nodeName !== 'INPUT') {
      input = input.querySelector('input');
    }

    if (!input) {
      throw new Error('react-input-mask: inputComponent doesn\'t contain input node');
    }

    return input;
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
    var value = this.getInputValue();
    var previousValue = this.value;
    var selection = this.getSelection();

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
      selection = {
        start: previousSelection.start + value.length,
        end: previousSelection.start + value.length,
        length: 0
      };
      value = previousValue.slice(0, previousSelection.start) + value + previousValue.slice(previousSelection.end);
      this.beforePasteState = null;
    }

    var { enteredString, selection: newSelection, value: newValue } = processChange(this.maskOptions, value, selection, previousValue, previousSelection);

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

      this.runSaveSelectionLoop();
    }

    if (isFunction(this.props.onFocus)) {
      this.props.onFocus(event);
    }
  }

  onBlur = (event) => {
    var { beforeMaskedValueChange } = this.props;
    var { mask } = this.maskOptions;

    this.stopSaveSelectionLoop();
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
    this.input = this.getInputDOMNode();

    if (this.props.children == null && isFunction(this.props.inputRef)) {
      this.props.inputRef(ref);
    }
  }

  render() {
    var { mask, alwaysShowMask, maskChar, formatChars, inputRef, beforeMaskedValueChange, children, ...props } = this.props;

    warning(
      // parse mask to test against actual mask prop as this.maskOptions
      // will be updated later in componentDidUpdate
      !props.maxLength || !parseMask(mask, maskChar, formatChars).mask,
      'react-input-mask: maxLength property shouldn\'t be passed to the masked input. It breaks masking and unnecessary because length is limited by the mask length.'
    );

    var inputElement;
    if (children) {
      invariant(
        isFunction(children),
        'react-input-mask: children must be a function'
      );

      var controlledProps = ['onChange', 'onPaste', 'onMouseDown', 'onFocus', 'onBlur', 'value', 'disabled', 'readOnly'];
      var childrenProps = { ...props };
      controlledProps.forEach((propId) => delete childrenProps[propId]);

      children = children(childrenProps);

      var conflictProps = controlledProps
        .filter((propId) => children.props[propId] != null && children.props[propId] !== props[propId]);

      invariant(
        !conflictProps.length,
        `react-input-mask: the following props should be passed to the react-input-mask's component and should not be altered in children's function: ${conflictProps.join(', ')}`
      );

      warning(
        !inputRef,
        'react-input-mask: inputRef is ignored when children is passed, attach ref to the children instead'
      );

      inputElement = children;
    } else {
      inputElement = <input ref={this.handleRef} {...props} />;
    }

    var changedProps = {
      onFocus: this.onFocus,
      onBlur: this.onBlur
    };

    if (this.maskOptions.mask) {
      if (!props.disabled && !props.readOnly) {
        changedProps.onChange = this.onChange;
        changedProps.onPaste = this.onPaste;
        changedProps.onMouseDown = this.onMouseDown;
      }

      if (props.value != null) {
        changedProps.value = this.value;
      }
    }

    inputElement = React.cloneElement(inputElement, changedProps);

    return inputElement;
  }
}

export default InputElement;
