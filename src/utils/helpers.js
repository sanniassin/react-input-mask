// Element's window may differ from the one within React instance
// if element rendered within iframe.
// See https://github.com/sanniassin/react-input-mask/issues/182
export function getElementDocument(element) {
  return element?.ownerDocument;
}

export function getElementWindow(element) {
  return getElementDocument(element)?.defaultView;
}

export function isDOMElement(element) {
  const elementWindow = getElementWindow(element);
  return !!elementWindow && element instanceof elementWindow.HTMLElement;
}

export function isFunction(value) {
  return typeof value === "function";
}

export function findLastIndex(array, predicate) {
  for (let i = array.length - 1; i >= 0; i--) {
    const x = array[i];
    if (predicate(x, i)) {
      return i;
    }
  }
  return -1;
}

export function repeat(string, n = 1) {
  let result = "";
  for (let i = 0; i < n; i++) {
    result += string;
  }
  return result;
}

export function toString(value) {
  return `${value}`;
}
