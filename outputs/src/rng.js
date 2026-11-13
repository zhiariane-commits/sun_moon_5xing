(() => {
  "use strict";

  const config = window.SDWX.config;
  let generator = Math.random;

  function seed(value) {
    let counter = Math.floor(value) >>> 0;
    generator = () => {
      counter = (counter + 0x6d2b79f5) >>> 0;
      let mixed = counter;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  function reset() {
    generator = Math.random;
  }

  function next() {
    return generator();
  }

  function spawnLevel() {
    return config.SPAWN_POOL[Math.floor(next() * config.SPAWN_POOL.length)];
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.rng = {
    seed,
    reset,
    next,
    spawnLevel
  };
})();
