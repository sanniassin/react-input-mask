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
  const inputDocument = input.ownerDocument;
  return inputDocument.hasFocus() && inputDocument.activeElement === input;
}
