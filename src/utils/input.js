export function setInputSelection(input, start, end) {
  if (end === undefined) {
    end = start;
  }
  input.setSelectionRange(start, end);
}

export function getInputSelection(input) {
  const start = input.selectionStart;
  const end = input.selectionEnd;

  return {
    start,
    end,
    length: end - start
  };
}

export function isInputFocused(input) {
  return document.hasFocus() && document.activeElement === input;
}

export function isInputAutofilled(input, currentState, previousState) {
  const currentValue = currentState.value;
  const currentSelection = currentState.selection;
  const previousValue = previousState.value;
  const previousSelection = previousState.selection;

  // only check for positive match because it will be false negative
  // in case of autofill simulation in tests
  //
  // input.matches throws an exception if selector isn't supported
  try {
    if (input.matches(":-webkit-autofill")) {
      return true;
    }
  } catch (e) {} // eslint-disable-line no-empty

  // if input isn't focused then change event must have been triggered
  // either by autofill or event simulation in tests
  if (!isInputFocused(input)) {
    return true;
  }

  // if cursor has moved to the end while previousSelection forbids it
  // then it must be autofill
  return (
    previousSelection.end < previousValue.length &&
    currentSelection.end === currentValue.length
  );
}
