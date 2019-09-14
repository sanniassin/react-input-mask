import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { defer, cancelDefer } from "./utils/defer";
import {
  setInputSelection,
  getInputSelection,
  isInputFocused,
  isInputAutofilled
} from "./utils/input";
import { formatValue } from "./utils/string";

export function useInputElement(inputRef) {
  return useCallback(() => {
    let input = inputRef.current;
    const isDOMNode =
      typeof window !== "undefined" && input instanceof window.HTMLElement;

    // workaround for react-test-renderer
    // https://github.com/sanniassin/react-input-mask/issues/147
    if (!input || !isDOMNode) {
      return null;
    }

    if (input.nodeName !== "INPUT") {
      input = input.querySelector("input");
    }

    if (!input) {
      throw new Error(
        "react-input-mask: inputComponent doesn't contain input node"
      );
    }

    return input;
  }, [inputRef]);
}

export function useSelection(inputRef, isMasked) {
  const selectionRef = useRef(null);
  const saveSelectionLoopDeferIdRef = useRef(null);
  const getInputElement = useInputElement(inputRef);
  const previousInput = usePrevious(getInputElement());

  const getSelection = useCallback(() => {
    const input = getInputElement();
    return getInputSelection(input);
  }, [getInputElement]);

  const getLastSelection = useCallback(() => selectionRef.current, []);

  const setSelection = useCallback(
    selection => {
      const input = getInputElement();
      // Don't change selection on unfocused input
      // because Safari sets focus on selection change (#154)
      if (!input || !isInputFocused(input)) {
        return;
      }

      setInputSelection(input, selection.start, selection.end);

      // Use actual selection in case the requested one was out of range
      selectionRef.current = getSelection();
    },
    [getInputElement, getSelection]
  );

  const runSaveSelectionLoop = useCallback(() => {
    function saveSelectionLoop() {
      selectionRef.current = getSelection();
      saveSelectionLoopDeferIdRef.current = defer(saveSelectionLoop);
    }

    saveSelectionLoop();
  }, [getSelection]);

  const stopSaveSelectionLoop = useCallback(() => {
    if (selectionRef.current !== null) {
      cancelDefer(saveSelectionLoopDeferIdRef.current);
      saveSelectionLoopDeferIdRef.current = null;
      selectionRef.current = null;
    }
  }, []);

  // We need to track whether the actual DOM node has changed,
  // therefore we should run this effect after each render
  useLayoutEffect(() => {
    if (!isMasked) {
      return;
    }

    const input = getInputElement();

    input.addEventListener("focus", runSaveSelectionLoop);
    input.addEventListener("blur", stopSaveSelectionLoop);

    if (input !== previousInput && isInputFocused(input)) {
      runSaveSelectionLoop();
    }

    return () => {
      input.removeEventListener("focus", runSaveSelectionLoop);
      input.removeEventListener("blur", stopSaveSelectionLoop);

      stopSaveSelectionLoop();
    };
  });

  return { getSelection, getLastSelection, setSelection };
}

export function useValue(
  inputRef,
  maskOptions,
  alwaysShowMask,
  value,
  defaultValue
) {
  const getInputElement = useInputElement(inputRef);
  const isControlled = value !== null && value !== undefined;
  const isMasked = !!maskOptions.mask;
  const valueRef = useRef(isControlled ? value : defaultValue || "");

  if (isControlled) {
    valueRef.current = value;
  }

  if (isMasked && isControlled && (value !== "" || alwaysShowMask)) {
    valueRef.current = formatValue(maskOptions, value);
  }

  const getValue = useCallback(() => {
    const input = getInputElement();
    return input.value;
  }, [getInputElement]);

  const getLastValue = useCallback(() => {
    return valueRef.current;
  }, []);

  const setValue = useCallback(
    newValue => {
      valueRef.current = newValue;

      const input = getInputElement();
      if (input) {
        input.value = newValue;
      }
    },
    [getInputElement]
  );

  return {
    getValue,
    getLastValue,
    setValue
  };
}

export function useInputState(
  inputRef,
  maskOptions,
  alwaysShowMask,
  value,
  defaultValue
) {
  const isMasked = !!maskOptions.mask;
  const isControlledInput = value !== null && value !== undefined;
  const getInputElement = useInputElement(inputRef);
  const { getValue, getLastValue, setValue } = useValue(
    inputRef,
    maskOptions,
    alwaysShowMask,
    value,
    defaultValue
  );
  const { getSelection, getLastSelection, setSelection } = useSelection(
    inputRef,
    isMasked,
    isControlledInput
  );

  function getLastState() {
    return {
      value: getLastValue(),
      selection: getLastSelection()
    };
  }

  function getState() {
    return {
      value: getValue(),
      selection: getSelection()
    };
  }

  function setState({ value, selection }) {
    setValue(value);
    setSelection(selection);
  }

  function getChangeState() {
    const input = getInputElement();
    const currentState = getState();
    const previousState = getLastState();
    const currentValue = currentState.value;
    const currentSelection = currentState.selection;
    let previousValue = previousState.value;
    let previousSelection = previousState.selection;
    let enteredString = "";
    let removedString = "";

    // Autofill replaces entire value, ignore previous one
    // https://github.com/sanniassin/react-input-mask/issues/113
    if (isInputAutofilled(input, currentState, previousState)) {
      previousValue = formatValue(maskOptions, "");
      previousSelection = { start: 0, end: 0, length: 0 };
    }

    const hasEnteredString = currentSelection.end > previousSelection.start;
    const hasRemovedString =
      previousSelection.start < previousSelection.end ||
      currentValue.length < previousValue.length;

    if (hasEnteredString) {
      enteredString = currentValue.slice(
        previousSelection.start,
        currentSelection.end
      );
    }

    if (hasRemovedString) {
      const removedLength =
        previousSelection.end - previousSelection.start ||
        previousValue.length - currentValue.length;
      removedString = hasRemovedString
        ? previousValue.slice(previousSelection.start, previousSelection.end)
        : previousValue.slice(
            currentSelection.start,
            currentSelection.start + removedLength
          );
    }

    return {
      currentState: {
        value: currentValue,
        selection: currentSelection
      },
      previousState: {
        value: previousValue,
        selection: previousSelection
      },
      enteredString,
      removedString
    };
  }

  return {
    getChangeState,
    getLastValue,
    getLastSelection,
    getSelection,
    getValue,
    setValue,
    setSelection,
    getInputState: getState,
    setInputState: setState,
    getLastInputState: getLastState
  };
}

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
