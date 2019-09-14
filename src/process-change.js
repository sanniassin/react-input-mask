import {
  clearRange,
  formatValue,
  getInsertStringLength,
  insertString,
  getLeftEditablePosition,
  getRightEditablePosition
} from "./utils/string";

export default function processChange(
  maskOptions,
  currentState,
  previousState
) {
  const { mask, prefix, lastEditablePosition } = maskOptions;
  const { value, selection } = currentState;
  const previousValue = previousState.value;
  const previousSelection = previousState.selection;
  let newValue = value;
  let enteredString = "";
  let formattedEnteredStringLength = 0;
  let removedLength = 0;
  let cursorPosition = Math.min(previousSelection.start, selection.start);

  if (selection.end > previousSelection.start) {
    enteredString = newValue.slice(previousSelection.start, selection.end);
    formattedEnteredStringLength = getInsertStringLength(
      maskOptions,
      previousValue,
      enteredString,
      cursorPosition
    );
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
      const deleteFromRight = previousSelection.start === selection.start;
      cursorPosition = deleteFromRight
        ? getRightEditablePosition(maskOptions, selection.start)
        : getLeftEditablePosition(maskOptions, selection.start);
    }
    newValue = clearRange(maskOptions, newValue, cursorPosition, removedLength);
  }

  newValue = insertString(maskOptions, newValue, enteredString, cursorPosition);

  cursorPosition += formattedEnteredStringLength;
  if (cursorPosition >= mask.length) {
    cursorPosition = mask.length;
  } else if (cursorPosition < prefix.length && !formattedEnteredStringLength) {
    cursorPosition = prefix.length;
  } else if (
    cursorPosition >= prefix.length &&
    cursorPosition < lastEditablePosition &&
    formattedEnteredStringLength
  ) {
    cursorPosition = getRightEditablePosition(maskOptions, cursorPosition);
  }

  newValue = formatValue(maskOptions, newValue);

  return {
    value: newValue,
    enteredString,
    selection: { start: cursorPosition, end: cursorPosition }
  };
}
