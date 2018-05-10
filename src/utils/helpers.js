export function isDOMElement(element) {
  return typeof HTMLElement === 'object'
    ? element instanceof HTMLElement // DOM2
    : element.nodeType === 1 && typeof element.nodeName === 'string';
}

export function isFunction(value) {
  return typeof value === 'function';
}
