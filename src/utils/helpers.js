function isObjectLike(value) {
  return typeof value === "object" && value !== null;
}
export function isDOMElement(element) {
  return isObjectLike(element) && element.nodeType === 1;
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
