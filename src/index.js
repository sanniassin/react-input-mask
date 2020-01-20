import React, { useLayoutEffect, forwardRef } from "react";
import { findDOMNode } from "react-dom";
import PropTypes from "prop-types";

import { useInputState, useInputElement, usePrevious } from "./hooks";
import {
  validateMaxLength,
  validateChildren,
  validateMaskPlaceholder
} from "./validate-props";

import { defer } from "./utils/defer";
import { isInputFocused } from "./utils/input";
import { isFunction, toString, getElementDocument } from "./utils/helpers";
import MaskUtils from "./utils/mask";
import ChildrenWrapper from "./children-wrapper";

const InputMask = forwardRef(function InputMask(props, forwardedRef) {
  const {
    alwaysShowMask,
    children,
    mask,
    maskPlaceholder,
    beforeMaskedStateChange,
    ...restProps
  } = props;

  validateMaxLength(props);
  validateMaskPlaceholder(props);

  const maskUtils = new MaskUtils({ mask, maskPlaceholder });

  const isMasked = !!mask;
  const isEditable = !restProps.disabled && !restProps.readOnly;
  const isControlled = props.value !== null && props.value !== undefined;
  const previousIsMasked = usePrevious(isMasked);
  const initialValue = toString(
    (isControlled ? props.value : props.defaultValue) || ""
  );

  const {
    inputRef,
    getInputState,
    setInputState,
    getLastInputState
  } = useInputState(initialValue, isMasked);
  const getInputElement = useInputElement(inputRef);

  function onChange(event) {
    const currentState = getInputState();
    const previousState = getLastInputState();
    let newInputState = maskUtils.processChange(currentState, previousState);

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

    const currentValue = getInputState().value;

    if (isMasked && !maskUtils.isValueFilled(currentValue)) {
      let newValue = maskUtils.formatValue(currentValue);
      let newSelection = maskUtils.getDefaultSelectionForValue(newValue);
      let newInputState = {
        value: newValue,
        selection: newSelection
      };

      if (beforeMaskedStateChange) {
        newInputState = beforeMaskedStateChange({
          currentState: getInputState(),
          nextState: newInputState
        });
        newValue = newInputState.value;
        newSelection = newInputState.selection;
      }

      setInputState(newInputState);

      if (newValue !== currentValue && props.onChange) {
        props.onChange(event);
      }

      // Chrome resets selection after focus event,
      // so we want to restore it later
      defer(() => {
        setInputState(getLastInputState());
      });
    }

    if (props.onFocus) {
      props.onFocus(event);
    }
  }

  function onBlur(event) {
    const currentValue = getInputState().value;
    const lastValue = getLastInputState().value;

    if (isMasked && !alwaysShowMask && maskUtils.isValueEmpty(lastValue)) {
      let newValue = "";
      let newInputState = {
        value: newValue,
        selection: { start: null, end: null }
      };

      if (beforeMaskedStateChange) {
        newInputState = beforeMaskedStateChange({
          currentState: getInputState(),
          nextState: newInputState
        });
        newValue = newInputState.value;
      }

      setInputState(newInputState);

      if (newValue !== currentValue && props.onChange) {
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
    const { value } = getInputState();
    const inputDocument = getElementDocument(input);

    if (!isInputFocused(input) && !maskUtils.isValueFilled(value)) {
      const mouseDownX = event.clientX;
      const mouseDownY = event.clientY;
      const mouseDownTime = new Date().getTime();

      const mouseUpHandler = mouseUpEvent => {
        inputDocument.removeEventListener("mouseup", mouseUpHandler);

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
          const lastState = getLastInputState();
          const newSelection = maskUtils.getDefaultSelectionForValue(
            lastState.value
          );
          const newState = {
            ...lastState,
            selection: newSelection
          };
          setInputState(newState);
        }
      };

      inputDocument.addEventListener("mouseup", mouseUpHandler);
    }

    if (props.onMouseDown) {
      props.onMouseDown(event);
    }
  }

  // For controlled inputs we want to provide properly formatted
  // value prop
  if (isMasked && isControlled) {
    const input = getInputElement();
    const isFocused = input && isInputFocused(input);
    let newValue =
      isFocused || alwaysShowMask || props.value
        ? maskUtils.formatValue(props.value)
        : props.value;

    if (beforeMaskedStateChange) {
      newValue = beforeMaskedStateChange({
        nextState: { value: newValue, selection: { start: null, end: null } }
      }).value;
    }

    setInputState({
      ...getLastInputState(),
      value: newValue
    });
  }

  const lastState = getLastInputState();
  const lastSelection = lastState.selection;
  const lastValue = lastState.value;

  useLayoutEffect(() => {
    if (!isMasked) {
      return;
    }

    const input = getInputElement();
    const isFocused = isInputFocused(input);
    const previousSelection = lastSelection;
    const currentState = getInputState();
    let newInputState = { ...currentState };

    // Update value for uncontrolled inputs to make sure
    // it's always in sync with mask props
    if (!isControlled) {
      const currentValue = currentState.value;
      const formattedValue = maskUtils.formatValue(currentValue);
      const isValueEmpty = maskUtils.isValueEmpty(formattedValue);
      const shouldFormatValue = !isValueEmpty || isFocused || alwaysShowMask;
      if (shouldFormatValue) {
        newInputState.value = formattedValue;
      } else if (isValueEmpty && !isFocused) {
        newInputState.value = "";
      }
    }

    if (isFocused && !previousIsMasked) {
      // Adjust selection if input got masked while being focused
      newInputState.selection = maskUtils.getDefaultSelectionForValue(
        newInputState.value
      );
    } else if (isControlled && isFocused && previousSelection) {
      // Restore cursor position if value has changed outside change event
      if (previousSelection.start !== null && previousSelection.end !== null) {
        newInputState.selection = previousSelection;
      }
    }

    if (beforeMaskedStateChange) {
      newInputState = beforeMaskedStateChange({
        currentState,
        nextState: newInputState
      });
    }

    setInputState(newInputState);
  });

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
    value: isMasked && isControlled ? lastValue : props.value
  };

  if (children) {
    validateChildren(props, children);

    // We wrap children into a class component to be able to find
    // their input element using findDOMNode
    return <ChildrenWrapper {...inputProps}>{children}</ChildrenWrapper>;
  }

  return <input {...inputProps} />;
});

InputMask.displayName = "InputMask";

InputMask.defaultProps = {
  alwaysShowMask: false,
  maskPlaceholder: "_"
};

InputMask.propTypes = {
  alwaysShowMask: PropTypes.bool,
  beforeMaskedStateChange: PropTypes.func,
  children: PropTypes.element,
  mask: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(RegExp)])
    )
  ]),
  maskPlaceholder: PropTypes.string,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onMouseDown: PropTypes.func
};

export default InputMask;
