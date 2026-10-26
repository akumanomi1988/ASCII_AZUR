/* Packaged-only JSON export adapter. Other anchors and the web build are unchanged. */
(() => {
  'use strict';
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
