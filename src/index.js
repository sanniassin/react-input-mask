import React, { useLayoutEffect, forwardRef } from "react";
import { findDOMNode } from "react-dom";
import PropTypes from "prop-types";

import { CONTROLLED_PROPS } from "./constants";

import { useInputState, useInputElement, usePrevious } from "./hooks";
import { validateMaxLength, validateChildren } from "./validate-props";

import { defer, cancelDefer } from "./utils/defer";
import { isInputFocused } from "./utils/input";
import MaskUtils from "./utils/mask";
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
    maskPlaceholder,
    beforeMaskedStateChange,
    ...restProps
  } = props;
  const maskUtils = new MaskUtils({ mask, maskPlaceholder });

  validateMaxLength(props);

  const isMasked = !!mask;
  const isEditable = !restProps.disabled && !restProps.readOnly;
  const isControlled = props.value !== null && props.value !== undefined;
  const previousIsMasked = usePrevious(isMasked);

  const {
    inputRef,
    getInputState,
    setInputState,
    getLastInputState
  } = useInputState(
    (isControlled ? props.value : props.defaultValue) || "",
    isMasked
  );
  const getInputElement = useInputElement(inputRef);

  if (isMasked && isControlled) {
    const input = getInputElement();
    const isFocused = input && isInputFocused(input);
    const newValue =
      isFocused || alwaysShowMask || props.value
        ? maskUtils.formatValue(props.value)
        : props.value;
    setInputState({
      ...getLastInputState(),
      value: newValue
    });
  }

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

  let focusDeferId;
  function onFocus(event) {
    // If autoFocus property is set, focus event fires before the ref handler gets called
    inputRef.current = event.target;

    const { value } = getInputState();

    if (isMasked && !maskUtils.isValueFilled(value)) {
      const newValue = maskUtils.formatValue(value);
      const newSelection = maskUtils.getDefaultSelectionForValue(newValue);
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

      focusDeferId = defer(() => {
        focusDeferId = null;
        setInputState({
          ...getLastInputState(),
          selection: newInputState.selection
        });
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
      const newValue = "";
      const isInputValueChanged = newValue !== currentValue;
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
    const { value } = getInputState();

    if (!isInputFocused(input) && !maskUtils.isValueFilled(value)) {
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

      document.addEventListener("mouseup", mouseUpHandler);
    }

    if (props.onMouseDown) {
      props.onMouseDown(event);
    }
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
    const newInputState = getInputState();
    const previousSelection = lastSelection;

    // Update value for uncontrolled inputs to make sure
    // it's always in sync with mask props
    if (!isControlled) {
      const currentValue = getInputState().value;
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

    // TODO: Call beforeMaskedStateChange before
    setInputState(newInputState);

    return () => {
      if (focusDeferId) {
        cancelDefer(focusDeferId);
      }
    };
  });

  let value = isMasked && isControlled ? lastValue : props.value;
  if (isMasked && beforeMaskedStateChange) {
    value = beforeMaskedStateChange({
      nextState: { value }
    }).value;

    setInputState({ value, selection: lastSelection });
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
  maskPlaceholder: "_"
};

InputMask.propTypes = {
  alwaysShowMask: PropTypes.bool,
  beforeMaskedStateChange: PropTypes.func,
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
  onMouseDown: PropTypes.func,
  children: PropTypes.func
};

export default InputMask;
