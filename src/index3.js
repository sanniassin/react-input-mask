import React, { useRef, useLayoutEffect, forwardRef } from "react";
import { findDOMNode } from "react-dom";
import PropTypes from "prop-types";

import { CONTROLLED_PROPS } from "./constants";

import parseMask from "./parse-mask";
import processChange from "./process-change";
import { useInputState, useInputElement, usePrevious } from "./hooks";
import { validateMaxLength, validateChildren } from "./validate-props";

import { defer } from "./utils/defer";
import { isInputFocused } from "./utils/input";
import {
  formatValue,
  getFilledLength,
  isEmpty,
  isFilled,
  getRightEditablePosition
} from "./utils/string";
import { isFunction } from "./utils/helpers";

class InputMaskChildrenWrapper extends React.Component {
  render() {
    // eslint-disable-next-line react/prop-types
    const { children, ...props } = this.props;
    return React.cloneElement(children, props);
  }
}

const InputMask = forwardRef(function InputMask(props, forwardedRef) {
  const {
    alwaysShowMask,
    children,
    mask,
    maskChar,
    formatChars,
    beforeMaskedStateChange,
    ...restProps
  } = props;
  const maskOptions = parseMask(mask, maskChar, formatChars);

  validateMaxLength(props, maskOptions);

  const isMasked = !!maskOptions.mask;
  const isEditable = !restProps.disabled && !restProps.readOnly;
  const isControlled = props.value !== null && props.value !== undefined;
  const previousIsMasked = usePrevious(isMasked);

  // TODO: Return ref from useInputState
  const inputRef = useRef();
  const getInputElement = useInputElement(inputRef);
  const {
    getChangeState,
    getLastValue,
    getLastSelection,
    getValue,
    setValue,
    setSelection,
    getInputState,
    setInputState,
    getLastInputState
  } = useInputState(
    inputRef,
    maskOptions,
    alwaysShowMask,
    props.value,
    props.defaultValue
  );

  function getDefaultSelectionForValue(value) {
    const filledLength = getFilledLength(maskOptions, value);
    const cursorPosition = getRightEditablePosition(maskOptions, filledLength);
    return { start: cursorPosition, end: cursorPosition };
  }

  function onChange(event) {
    const { currentState, previousState } = getChangeState();
    let newInputState = processChange(maskOptions, currentState, previousState);

    if (beforeMaskedStateChange) {
      newInputState = beforeMaskedStateChange({
        currentState,
        previousState,
        nextState: newInputState
      });
    }

    setInputState(newInputState);

    if (props.onChange) {
      props.onChange(event);
    }
  }

  function onFocus(event) {
    // If autoFocus property is set, focus event fires before the ref handler gets called
    inputRef.current = event.target;

    const value = getValue();

    if (isMasked && !isFilled(maskOptions, value)) {
      const newValue = formatValue(maskOptions, value);
      const newSelection = getDefaultSelectionForValue(newValue);
      let newInputState = { value: newValue, selection: newSelection };

      if (beforeMaskedStateChange) {
        newInputState = beforeMaskedStateChange({
          currentState: getInputState(),
          previousState: getLastInputState(),
          nextState: newInputState
        });
      }

      setInputState(newInputState);

      if (value !== newValue && props.onChange) {
        props.onChange(event);
      }

      defer(() => setSelection(newSelection));
    }

    if (props.onFocus) {
      props.onFocus(event);
    }
  }

  function onBlur(event) {
    if (isMasked && !alwaysShowMask && isEmpty(maskOptions, getLastValue())) {
      const newValue = "";
      const isInputValueChanged = newValue !== getValue();
      let newInputState = {
        value: newValue,
        selection: { start: null, end: null }
      };

      if (beforeMaskedStateChange) {
        newInputState = beforeMaskedStateChange({
          currentState: getInputState(),
          previousState: getLastInputState(),
          nextState: newInputState
        });
      }

      setInputState(newInputState);

      if (isInputValueChanged && props.onChange) {
        props.onChange(event);
      }
    }

    if (props.onBlur) {
      props.onBlur(event);
    }
  }

  // Tiny unintentional mouse movements can break cursor
  // position on focus, so we have to restore it in that case
  //
  // https://github.com/sanniassin/react-input-mask/issues/108
  function onMouseDown(event) {
    const input = getInputElement();

    if (!isInputFocused(input)) {
      const mouseDownX = event.clientX;
      const mouseDownY = event.clientY;
      const mouseDownTime = new Date().getTime();

      const mouseUpHandler = mouseUpEvent => {
        document.removeEventListener("mouseup", mouseUpHandler);

        if (!isInputFocused(input)) {
          return;
        }

        const deltaX = Math.abs(mouseUpEvent.clientX - mouseDownX);
        const deltaY = Math.abs(mouseUpEvent.clientY - mouseDownY);
        const axisDelta = Math.max(deltaX, deltaY);
        const timeDelta = new Date().getTime() - mouseDownTime;

        if (
          (axisDelta <= 10 && timeDelta <= 200) ||
          (axisDelta <= 5 && timeDelta <= 300)
        ) {
          const newSelection = getDefaultSelectionForValue(getLastValue());
          setSelection(newSelection);
        }
      };

      document.addEventListener("mouseup", mouseUpHandler);
    }

    if (props.onMouseDown) {
      props.onMouseDown(event);
    }
  }

  // Last selection will get updated after render, so we grab its value before
  const lastSelection = getLastSelection();
  useLayoutEffect(() => {
    if (!isMasked) {
      return;
    }

    const input = getInputElement();
    const isFocused = isInputFocused(input);
    const newInputState = getInputState();

    // Update value for uncontrolled inputs to make sure
    // it's always in sync with mask props
    if (!isControlled) {
      const formattedValue = formatValue(maskOptions, getValue());
      const isValueEmpty = isEmpty(maskOptions, formattedValue);
      const shouldFormatValue = !isValueEmpty || isFocused || alwaysShowMask;
      if (shouldFormatValue) {
        newInputState.value = formattedValue;
      } else if (isValueEmpty && !isFocused) {
        newInputState.value = "";
      }
    }

    if (isFocused && !previousIsMasked) {
      // Adjust selection if input got masked while being focused
      newInputState.selection = getDefaultSelectionForValue(
        newInputState.value
      );
    } else if (isControlled && isFocused && lastSelection) {
      // Restore cursor position if value has changed outside change event
      if (lastSelection.start !== null && lastSelection.end !== null) {
        newInputState.selection = lastSelection;
      }
    }

    // TODO: Call beforeMaskedStateChange before
    setInputState(newInputState);
  });

  let value = isMasked && isControlled ? getLastValue() : props.value;
  if (isMasked && beforeMaskedStateChange) {
    value = beforeMaskedStateChange({
      nextState: { value }
    }).value;

    setValue(value);
  }

  const inputProps = {
    ...restProps,
    onFocus,
    onBlur,
    onChange: isMasked && isEditable ? onChange : props.onChange,
    onMouseDown: isMasked && isEditable ? onMouseDown : props.onMouseDown,
    ref: ref => {
      inputRef.current = findDOMNode(ref);

      if (isFunction(forwardedRef)) {
        forwardedRef(ref);
      } else if (forwardedRef !== null && typeof forwardedRef === "object") {
        forwardedRef.current = ref;
      }
    },
    value
  };

  if (children) {
    const childrenProps = { ...restProps };
    CONTROLLED_PROPS.forEach(propId => delete childrenProps[propId]);
    const childrenComponent = children(childrenProps);
    validateChildren(props, childrenComponent);

    return (
      <InputMaskChildrenWrapper {...inputProps}>
        {childrenComponent}
      </InputMaskChildrenWrapper>
    );
  }

  return <input {...inputProps} />;
});

InputMask.displayName = "InputMask";

InputMask.defaultProps = {
  alwaysShowMask: false,
  maskChar: "_"
};

InputMask.propTypes = {
  alwaysShowMask: PropTypes.bool,
  beforeMaskedStateChange: PropTypes.func,
  formatChars: PropTypes.objectOf(PropTypes.string),
  mask: PropTypes.string,
  maskChar: PropTypes.string,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onMouseDown: PropTypes.func,
  children: PropTypes.func
};

export default InputMask;
