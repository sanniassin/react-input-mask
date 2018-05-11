function getRequestAnimationFrame() {
  return window.requestAnimationFrame
         ||
         window.webkitRequestAnimationFrame
         ||
         window.mozRequestAnimationFrame;
}

function getCancelAnimationFrame() {
  return window.cancelAnimationFrame
         ||
         window.webkitCancelRequestAnimationFrame
         ||
         window.webkitCancelAnimationFrame
         ||
         window.mozCancelAnimationFrame;
}

export function defer(fn, timeoutDelay = 0) {
  var deferFn;

  var hasCancelAnimationFrame = !!getCancelAnimationFrame();
  if (hasCancelAnimationFrame) {
    deferFn = getRequestAnimationFrame();
  } else {
    deferFn = (() => setTimeout(fn, timeoutDelay));
  }

  return deferFn(fn);
}

export function cancelDefer(deferId) {
  var cancelFn = getCancelAnimationFrame()
                 ||
                 clearTimeout;

  cancelFn(deferId);
}
