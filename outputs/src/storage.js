(() => {
  "use strict";

  function readNumber(key, fallback) {
    try {
      const value = Number(window.localStorage.getItem(key));
      return Number.isFinite(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function readString(key, fallback) {
    try {
      return window.localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // The demo also works when file:// storage is disabled.
    }
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.storage = {
    readNumber,
    readString,
    write
  };
})();
