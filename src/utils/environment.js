export function isAndroidBrowser() {
  const windows = new RegExp('windows', 'i');
  const firefox = new RegExp('firefox', 'i');
  const android = new RegExp('android', 'i');
  const ua = navigator.userAgent;
  return !windows.test(ua)
         &&
         !firefox.test(ua)
         &&
         android.test(ua);
}

export function isWindowsPhoneBrowser() {
  const windows = new RegExp('windows', 'i');
  const phone = new RegExp('phone', 'i');
  const ua = navigator.userAgent;
  return windows.test(ua) && phone.test(ua);
}

export function isAndroidFirefox() {
  const windows = new RegExp('windows', 'i');
  const firefox = new RegExp('firefox', 'i');
  const android = new RegExp('android', 'i');
  const ua = navigator.userAgent;
  return !windows.test(ua)
         &&
         firefox.test(ua)
         &&
         android.test(ua);
}

export function isIOS() {
  const windows = new RegExp('windows', 'i');
  const ios = new RegExp('(ipod|iphone|ipad)', 'i');
  const ua = navigator.userAgent;
  return !windows.test(ua) && ios.test(ua);
}
