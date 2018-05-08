export default function(fn, timeoutDelay = 0) {
  var defer = window.requestAnimationFrame
              ||
              window.webkitRequestAnimationFrame
              ||
              window.mozRequestAnimationFrame
              ||
              (() => setTimeout(fn, timeoutDelay));

  return defer(fn);
}
