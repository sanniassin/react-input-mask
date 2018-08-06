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

    const { mask, maskChar, formatChars, alwaysShowMask, beforeMaskedValueChange } = props;
    let { defaultValue, value } = props;

    this.maskOptions = parseMask(mask, maskChar, formatChars);

    if (defaultValue == null) {
      defaultValue = '';
    }
    if (value == null) {
      value = defaultValue;
    }

    let newValue = getStringValue(value);

    if (this.maskOptions.mask && (alwaysShowMask || newValue)) {
      newValue = formatValue(this.maskOptions, newValue);

      if (isFunction(beforeMaskedValueChange)) {
        let oldValue = props.value;
        if (props.value == null) {
          oldValue = defaultValue;
        }
        oldValue = getStringValue(oldValue);

        const modifiedValue = beforeMaskedValueChange(
          { value: newValue, selection: null },
          { value: oldValue, selection: null },
          null,
          this.getBeforeMaskedValueChangeConfig()
        );

        newValue = modifiedValue.value;
      }
    }

    this.value = newValue;
  }

  componentDidMount() {
    this.mounted = true;

    this.isWindowsPhoneBrowser = isWindowsPhoneBrowser();

    if (this.maskOptions.mask && this.getInputValue() !== this.value) {
      this.setInputValue(this.value);
    }
  }

  componentDidUpdate() {
    const { previousSelection } = this;
    const { beforeMaskedValueChange, alwaysShowMask, mask, maskChar, formatChars } = this.props;
    const previousMaskOptions = this.maskOptions;
    const showEmpty = alwaysShowMask || this.isFocused();
    const hasValue = this.props.value != null;
    let newValue = hasValue
      ? getStringValue(this.props.value)
      : this.value;
    let cursorPosition = previousSelection
      ? previousSelection.start
      : null;

    this.maskOptions = parseMask(mask, maskChar, formatChars);

    if (!this.maskOptions.mask) {
      if (previousMaskOptions.mask) {
        this.stopSaveSelectionLoop();

        // render depends on this.maskOptions and this.value,
        // call forceUpdate to keep it in sync
        this.forceUpdate();
      }
      return;
    } else if (!previousMaskOptions.mask && this.isFocused()) {
      this.runSaveSelectionLoop();
    }

    const isMaskChanged = this.maskOptions.mask && this.maskOptions.mask !== previousMaskOptions.mask;

    if (!previousMaskOptions.mask && !hasValue) {
      newValue = this.getInputValue();
    }

    if (isMaskChanged || (this.maskOptions.mask && (newValue || showEmpty))) {
      newValue = formatValue(this.maskOptions, newValue);
    }

    if (isMaskChanged) {
      const filledLength = getFilledLength(this.maskOptions, newValue);
      if (cursorPosition === null || filledLength < cursorPosition) {
        if (isFilled(this.maskOptions, newValue)) {
          cursorPosition = filledLength;
        } else {
          cursorPosition = getRightEditablePosition(this.maskOptions, filledLength);
        }
      }
    }

    if (this.maskOptions.mask && isEmpty(this.maskOptions, newValue) && !showEmpty && (!hasValue || !this.props.value)) {
      newValue = '';
    }

    let newSelection = { start: cursorPosition, end: cursorPosition };

    if (isFunction(beforeMaskedValueChange)) {
      const modifiedValue = beforeMaskedValueChange(
        { value: newValue, selection: newSelection },
        { value: this.value, selection: this.previousSelection },
        null,
        this.getBeforeMaskedValueChangeConfig()
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

    let isSelectionChanged = false;
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

    let input = findDOMNode(this);

    if (input.nodeName !== 'INPUT') {
      input = input.querySelector('input');
    }

    if (!input) {
      throw new Error('react-input-mask: inputComponent doesn\'t contain input node');
    }

    return input;
  }

  getInputValue = () => {
    const input = this.getInputDOMNode();
    if (!input) {
      return null;
    }

    return input.value;
  }

  setInputValue = (value) => {
    const input = this.getInputDOMNode();
    if (!input) {
      return;
    }

    this.value = value;
    input.value = value;
  }

  setCursorToEnd = () => {
    const filledLength = getFilledLength(this.maskOptions, this.value);
    const pos = getRightEditablePosition(this.maskOptions, filledLength);
    if (pos !== null) {
      this.setCursorPosition(pos);
    }
  }

  setSelection = (start, end, options = {}) => {
    const input = this.getInputDOMNode();
    if (!input) {
      return;
    }

    const { deferred } = options;

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
    const input = this.getInputDOMNode();

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

  getBeforeMaskedValueChangeConfig = () => {
    const { mask, maskChar, permanents, formatChars } = this.maskOptions;
    const { alwaysShowMask } = this.props;

    return {
      mask,
      maskChar,
      permanents,
      alwaysShowMask: !!alwaysShowMask,
      formatChars
    };
  }

  isInputAutofilled = (value, selection, previousValue, previousSelection) => {
    const input = this.getInputDOMNode();

    // only check for positive match because it will be false negative
    // in case of autofill simulation in tests
    //
    // input.matches throws an exception if selector isn't supported
    try {
      if (input.matches(':-webkit-autofill')) {
        return true;
      }
    } catch (e) {}

    // if input isn't focused then change event must have been triggered
    // either by autofill or event simulation in tests
    if (!this.focused) {
      return true;
    }

    // if cursor has moved to the end while previousSelection forbids it
    // then it must be autofill
    return previousSelection.end < previousValue.length
           &&
           selection.end === value.length;
  }

  onChange = (event) => {
    const { beforePasteState } = this;
    let { previousSelection } = this;
    const { beforeMaskedValueChange } = this.props;
    let value = this.getInputValue();
    let previousValue = this.value;
    let selection = this.getSelection();

    // autofill replaces entire value, ignore old one
    // https://github.com/sanniassin/react-input-mask/issues/113
    if (this.isInputAutofilled(value, selection, previousValue, previousSelection)) {
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

    const changedState = processChange(this.maskOptions, value, selection, previousValue, previousSelection);
    const enteredString = changedState.enteredString;
    let newSelection = changedState.selection;
    let newValue = changedState.value;

    if (isFunction(beforeMaskedValueChange)) {
      const modifiedValue = beforeMaskedValueChange(
        { value: newValue, selection: newSelection },
        { value: previousValue, selection: previousSelection },
        enteredString,
        this.getBeforeMaskedValueChangeConfig()
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
    const { beforeMaskedValueChange } = this.props;
    const { mask, prefix } = this.maskOptions;
    this.focused = true;

    // if autoFocus is set, onFocus triggers before componentDidMount
    this.mounted = true;

    if (mask) {
      if (!this.value) {
        const emptyValue = formatValue(this.maskOptions, prefix);
        let newValue = formatValue(this.maskOptions, emptyValue);
        const filledLength = getFilledLength(this.maskOptions, newValue);
        const cursorPosition = getRightEditablePosition(this.maskOptions, filledLength);
        let newSelection = { start: cursorPosition, end: cursorPosition };

        if (isFunction(beforeMaskedValueChange)) {
          const modifiedValue = beforeMaskedValueChange(
            { value: newValue, selection: newSelection },
            { value: this.value, selection: null },
            null,
            this.getBeforeMaskedValueChangeConfig()
          );
          newValue = modifiedValue.value;
          newSelection = modifiedValue.selection;
        }

        const isInputValueChanged = newValue !== this.getInputValue();

        if (isInputValueChanged) {
          this.setInputValue(newValue);
        }

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
    const { beforeMaskedValueChange } = this.props;
    const { mask } = this.maskOptions;

    this.stopSaveSelectionLoop();
    this.focused = false;

    if (mask && !this.props.alwaysShowMask && isEmpty(this.maskOptions, this.value)) {
      let newValue = '';

      if (isFunction(beforeMaskedValueChange)) {
        const modifiedValue = beforeMaskedValueChange(
          { value: newValue, selection: null },
          { value: this.value, selection: this.previousSelection },
          null,
          this.getBeforeMaskedValueChangeConfig()
        );
        newValue = modifiedValue.value;
      }

      const isInputValueChanged = newValue !== this.getInputValue();

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

      const mouseUpHandler = (mouseUpEvent) => {
        document.removeEventListener('mouseup', mouseUpHandler);

        if (!this.focused) {
          return;
        }

        const deltaX = Math.abs(mouseUpEvent.clientX - this.mouseDownX);
        const deltaY = Math.abs(mouseUpEvent.clientY - this.mouseDownY);
        const axisDelta = Math.max(deltaX, deltaY);
        const timeDelta = (new Date()).getTime() - this.mouseDownTime;

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
    if (this.props.children == null && isFunction(this.props.inputRef)) {
      this.props.inputRef(ref);
    }
  }

  render() {
    const { mask, alwaysShowMask, maskChar, formatChars, inputRef, beforeMaskedValueChange, children, ...restProps } = this.props;
    let inputElement;

    warning(
      // parse mask to test against actual mask prop as this.maskOptions
      // will be updated later in componentDidUpdate
      !restProps.maxLength || !parseMask(mask, maskChar, formatChars).mask,
      'react-input-mask: maxLength property shouldn\'t be passed to the masked input. It breaks masking and unnecessary because length is limited by the mask length.'
    );

    if (children) {
      invariant(
        isFunction(children),
        'react-input-mask: children must be a function'
      );

      const controlledProps = ['onChange', 'onPaste', 'onMouseDown', 'onFocus', 'onBlur', 'value', 'disabled', 'readOnly'];
      const childrenProps = { ...restProps };
      controlledProps.forEach((propId) => delete childrenProps[propId]);

      inputElement = children(childrenProps);

      const conflictProps = controlledProps
        .filter((propId) => inputElement.props[propId] != null && inputElement.props[propId] !== restProps[propId]);

      invariant(
        !conflictProps.length,
        `react-input-mask: the following props should be passed to the react-input-mask's component and should not be altered in children's function: ${conflictProps.join(', ')}`
      );

      warning(
        !inputRef,
        'react-input-mask: inputRef is ignored when children is passed, attach ref to the children instead'
      );
    } else {
      inputElement = <input ref={this.handleRef} {...restProps} />;
    }

    const changedProps = {
      onFocus: this.onFocus,
      onBlur: this.onBlur
    };

    if (this.maskOptions.mask) {
      if (!restProps.disabled && !restProps.readOnly) {
        changedProps.onChange = this.onChange;
        changedProps.onPaste = this.onPaste;
        changedProps.onMouseDown = this.onMouseDown;
      }

      if (restProps.value != null) {
        changedProps.value = this.value;
      }
    }

    inputElement = React.cloneElement(inputElement, changedProps);

    return inputElement;
  }
}

export default InputElement;
