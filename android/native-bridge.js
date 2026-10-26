/* Packaged-only JSON export adapter. Other anchors and the web build are unchanged. */
(() => {
  'use strict';
  // Android emulator WebView is not the same GPU/browser pipeline as Chrome.
  // Prefer the game's already tested Canvas2D renderer in the installed APK;
  // the hosted web/PWA build retains full WebGL2 and automatic fallback.
  const originalContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    if (type === 'webgl2') return null;
    return originalContext.call(this, type, ...args);
  };
  window.__azurNativeCanvasFallback = true;
  const original = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    const name = this.download || '';
    if (typeof AzNative !== 'undefined' && /^ascii-azur-[a-zA-Z0-9_-]{1,48}\.json$/.test(name)
        && this.href.startsWith('blob:')) {
      fetch(this.href).then(r => r.text()).then(body => {
        if (body.length <= 1_000_000) AzNative.exportJson(name, body);
      }).catch(() => { /* Never leak export contents to a remote endpoint. */ });
      return;
    }
    return original.apply(this, arguments);
  };
})();
