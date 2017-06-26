export default function(fn) {
  var defer = window.requestAnimationFrame
              ||
              window.webkitRequestAnimationFrame
              ||
              window.mozRequestAnimationFrame
              ||
              ((fn) => setTimeout(fn, 0));

  return defer(fn);
}
