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

export function defer(fn) {
  const hasCancelAnimationFrame = !!getCancelAnimationFrame();
  let deferFn;

  if (hasCancelAnimationFrame) {
    deferFn = getRequestAnimationFrame();
  } else {
    deferFn = (() => setTimeout(fn, 1000 / 60));
  }

  return deferFn(fn);
}

export function cancelDefer(deferId) {
  const cancelFn = getCancelAnimationFrame()
                   ||
                   clearTimeout;

  cancelFn(deferId);
}
