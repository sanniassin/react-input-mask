import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { defer, cancelDefer } from "./utils/defer";
import {
  setInputSelection,
  getInputSelection,
  isInputFocused,
  isInputAutofilled
} from "./utils/input";

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
  const selectionRef = useRef({ start: null, end: null });
  const getInputElement = useInputElement(inputRef);

  const getSelection = useCallback(() => {
    const input = getInputElement();
    return getInputSelection(input);
  }, [getInputElement]);

  const getLastSelection = useCallback(() => {
    return selectionRef.current;
  }, []);

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

  // We need to track whether the actual DOM node has changed,
  // therefore we should run this effect after each render
  useLayoutEffect(() => {
    if (!isMasked) {
      return;
    }

    let deferId = null;
    function runSaveSelectionLoop() {
      // If there are simulated focus events, runSaveSelectionLoop,
      // could be called multiple times without blur or re-render
      if (deferId !== null) {
        return;
      }

      function saveSelectionLoop() {
        selectionRef.current = getSelection();
        deferId = defer(saveSelectionLoop);
      }

      saveSelectionLoop();
    }

    function stopSaveSelectionLoop() {
      if (selectionRef.current.start !== null) {
        selectionRef.current = { start: null, end: null };
        cancelDefer(deferId);
        deferId = null;
      }
    }

    const input = getInputElement();
    input.addEventListener("focus", runSaveSelectionLoop);
    input.addEventListener("blur", stopSaveSelectionLoop);

    if (isInputFocused(input)) {
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

function useValue(inputRef, initialValue) {
  const getInputElement = useInputElement(inputRef);
  const valueRef = useRef(initialValue);

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

export function useInputState(initialValue, isMasked) {
  const inputRef = useRef();
  const getInputElement = useInputElement(inputRef);
  const { getSelection, getLastSelection, setSelection } = useSelection(
    inputRef,
    isMasked
  );
  const { getValue, getLastValue, setValue } = useValue(inputRef, initialValue);

  function getLastInputState() {
    return {
      value: getLastValue(),
      selection: getLastSelection()
    };
  }

  function getInputState() {
    return {
      value: getValue(),
      selection: getSelection()
    };
  }

  function setInputState({ value, selection }) {
    setValue(value);
    setSelection(selection);
  }

  function getInputStateChange() {
    const input = getInputElement();
    const currentState = getInputState();
    const previousState = getLastInputState();
    const currentValue = currentState.value;
    const currentSelection = currentState.selection;
    let previousValue = previousState.value;
    let previousSelection = previousState.selection;
    let enteredString = "";
    let removedString = "";

    // Autofill replaces entire value, ignore previous one
    // https://github.com/sanniassin/react-input-mask/issues/113
    if (isInputAutofilled(input, currentState, previousState)) {
      previousValue = "";
      previousSelection = { start: 0, end: 0 };
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
      removedString = previousValue.slice(
        previousSelection.end - removedLength,
        previousSelection.start
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
    inputRef,
    getInputState,
    getLastInputState,
    setInputState,
    getInputStateChange
  };
}

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
