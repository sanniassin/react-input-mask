export function isDOMElement(element) {
  return element instanceof HTMLElement;
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
