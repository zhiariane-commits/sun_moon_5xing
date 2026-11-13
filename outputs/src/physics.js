(() => {
  "use strict";

  const config = window.SDWX.config;
  const state = window.SDWX.state.state;
  const rng = window.SDWX.rng;
  const { Engine, Bodies, Body, Composite } = window.Matter || {};
  const activeFruits = new Map();
  let engine = null;
  let world = null;

  function isAvailable() {
    return Boolean(window.Matter && Engine && Bodies && Body && Composite);
  }

  function setupPhysics() {
    engine = Engine.create({
      gravity: { x: 0, y: 1.05 },
      positionIterations: 8,
      velocityIterations: 5,
      constraintIterations: 2
    });
    world = engine.world;
    engine.timing.timeScale = 1;

    const wallOptions = {
      isStatic: true,
      friction: 0.22,
      frictionStatic: 0.4,
      restitution: 0.08,
      label: "boundary"
    };

    Composite.add(world, [
      Bodies.rectangle(config.PLAY_LEFT - 40, config.H / 2, 80, config.H + 320, wallOptions),
      Bodies.rectangle(config.PLAY_RIGHT + 40, config.H / 2, 80, config.H + 320, wallOptions),
      Bodies.rectangle(config.W / 2, config.PLAY_BOTTOM + 40, config.W + 260, 80, wallOptions)
    ]);
  }

  function createFruit(level, x, y) {
    const fruit = config.FRUITS[level];
    const radius = fruit.radius;
    const body = Bodies.circle(x, y, radius, {
      restitution: 0.13,
      friction: 0.055,
      frictionStatic: 0.34,
      frictionAir: 0.009,
      density: 0.0012,
      slop: 0.02,
      sleepThreshold: 55,
      label: "fruit"
    });

    body.plugin = {
      isFruit: true,
      level,
      bornAt: state.now,
      seed: rng.next() * Math.PI * 2
    };
    Body.setAngularVelocity(body, (rng.next() - 0.5) * 0.045);
    Composite.add(world, body);
    activeFruits.set(body.id, body);
    return body;
  }

  function removeFruit(body) {
    if (!activeFruits.has(body.id)) return;
    activeFruits.delete(body.id);
    Composite.remove(world, body);
  }

  function clearFruits() {
    for (const body of [...activeFruits.values()]) removeFruit(body);
    activeFruits.clear();
  }

  function setDropX(x) {
    const radius = config.FRUITS[state.currentLevel].radius;
    state.dropX = Math.max(
      config.PLAY_LEFT + radius + 5,
      Math.min(config.PLAY_RIGHT - radius - 5, x)
    );
  }

  function setVelocity(body, velocity) {
    Body.setVelocity(body, velocity);
  }

  function step(dt) {
    if (engine) Engine.update(engine, dt);
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.physics = {
    activeFruits,
    isAvailable,
    setupPhysics,
    createFruit,
    removeFruit,
    clearFruits,
    setDropX,
    setVelocity,
    step
  };
})();
