(() => {
  "use strict";

  const config = window.SDWX.config;
  const state = window.SDWX.state.state;
  const rng = window.SDWX.rng;
  const physics = window.SDWX.physics;
  const merge = window.SDWX.merge;
  const scoring = window.SDWX.scoring;
  const effects = window.SDWX.effects;
  const board = window.SDWX.board;
  const balls = window.SDWX.balls;
  const hud = window.SDWX.hud;
  const overlays = window.SDWX.overlays;
  const audio = window.SDWX.audio;
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  let lastFrame = window.performance.now();
  let accumulator = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function resizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(config.W * dpr);
    canvas.height = Math.round(config.H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function dropFruit() {
    if (state.gameOver || !state.canDrop) return;

    audio.ensureAudio();
    const level = state.currentLevel;
    const radius = config.FRUITS[level].radius;
    const x = clamp(state.dropX, config.PLAY_LEFT + radius + 4, config.PLAY_RIGHT - radius - 4);
    const body = physics.createFruit(level, x, config.DROP_Y + 1);
    physics.setVelocity(body, { x: 0, y: 1.2 });

    state.currentLevel = state.nextLevel;
    state.nextLevel = rng.spawnLevel();
    state.canDrop = false;
    state.cooldownUntil = state.now + 390;
    state.shake = Math.max(state.shake, 1.4);
    hud.updateNextUI();
    audio.playDropSound();
  }

  function updateHazard(dt) {
    if (state.gameOver) return;

    let dangerous = false;
    for (const body of physics.activeFruits.values()) {
      if (state.now - body.plugin.bornAt < 1200) continue;
      const radius = config.FRUITS[body.plugin.level].radius;
      if (body.position.y - radius < config.DANGER_Y && body.speed < 2.6) {
        dangerous = true;
        break;
      }
    }

    if (dangerous) {
      state.hazard = Math.min(1, state.hazard + dt / 2200);
    } else {
      state.hazard = Math.max(0, state.hazard - dt / 760);
    }

    hud.updateDanger(state.hazard);
    if (state.hazard >= 1) {
      endGame();
    }
  }

  function endGame() {
    if (state.gameOver) return;
    window.SDWX.state.setPhase("over");
    state.canDrop = false;
    scoring.updateScoreUI(true);
    overlays.showGameOver(state.score, state.best);
    hud.hideAlerts();
    audio.playGameOverSound();
  }

  function render(now) {
    ctx.clearRect(0, 0, config.W, config.H);
    board.drawBoardBackground();

    ctx.save();
    if (state.shake > 0.03) {
      ctx.translate(
        (Math.random() - 0.5) * state.shake,
        (Math.random() - 0.5) * state.shake
      );
    }

    board.drawWallsAndFloor();
    board.drawDangerLine();
    board.drawDropGuide();
    balls.drawGhosts();
    balls.drawFruits();
    board.drawPreview(now);
    effects.draw();
    ctx.restore();
    board.drawVignette();
  }

  function frame(now) {
    const dt = Math.min(50, Math.max(0, now - lastFrame));
    lastFrame = now;
    state.now = now;

    if (!state.gameOver) {
      accumulator = Math.min(accumulator + dt, 100);
      let steps = 0;
      while (accumulator >= config.FIXED_STEP && steps < 6) {
        physics.step(config.FIXED_STEP);
        merge.processMerges();
        accumulator -= config.FIXED_STEP;
        steps += 1;
      }

      if (!state.canDrop && now >= state.cooldownUntil) {
        state.canDrop = true;
      }

      updateHazard(dt);
    }

    effects.update(dt);
    scoring.updateDisplayedScore(dt);
    hud.updateComboUI();
    render(now);
    window.requestAnimationFrame(frame);
  }

  function tick(ms = 0) {
    const duration = Math.max(0, ms);
    const end = state.now + duration;
    let remaining = duration;
    let steps = 0;
    while (remaining >= config.FIXED_STEP && steps < 600 && !state.gameOver) {
      state.now += config.FIXED_STEP;
      physics.step(config.FIXED_STEP);
      merge.processMerges();
      remaining -= config.FIXED_STEP;
      steps += 1;
    }
    state.now = end;
    if (!state.canDrop && state.now >= state.cooldownUntil) {
      state.canDrop = true;
    }
    if (!state.gameOver) updateHazard(duration);
    effects.update(duration);
    scoring.updateDisplayedScore(duration);
    hud.updateComboUI();
    return state.now;
  }

  function init() {
    if (!physics.isAvailable()) {
      const stage = document.getElementById("boardStage");
      stage.innerHTML = '<div style="display:grid;height:100%;place-items:center;padding:30px;color:#26462f;font:700 14px sans-serif;text-align:center">物理引擎加载失败，请确认 lib/matter.min.js 与 index.html 在同一目录。</div>';
      return;
    }

    resizeCanvas();
    physics.setupPhysics();
    effects.init(ctx);
    board.init(ctx);
    balls.init(ctx);
    hud.buildLadder();
    hud.setRuleFruits();
    window.SDWX.input.bind({
      canvas,
      setDropX: physics.setDropX,
      dropFruit,
      restartGame: window.SDWX.state.restartGame,
      ensureAudio: audio.ensureAudio,
      toggleSound: audio.toggleSound,
      resizeCanvas
    });
    hud.updateSoundButton();

    state.currentLevel = rng.spawnLevel();
    state.nextLevel = rng.spawnLevel();
    physics.setDropX(config.W / 2);
    hud.updateNextUI();
    scoring.updateScoreUI(true);

    window.requestAnimationFrame((now) => {
      lastFrame = now;
      window.requestAnimationFrame(frame);
    });
  }

  window.__tripleMelonDebug = {
    state,
    activeFruits: physics.activeFruits,
    createFruit: physics.createFruit,
    dropFruit,
    processMerges: merge.processMerges,
    setDropX: physics.setDropX,
    restartGame: window.SDWX.state.restartGame,
    endGame
  };

  window.__sdwxDebug = {
    state,
    balls: physics.activeFruits,
    createBall: physics.createFruit,
    dropBall: dropFruit,
    setDropX: physics.setDropX,
    tick,
    startRun() {
      window.SDWX.state.restartGame();
      return true;
    },
    endRun(reason) {
      endGame(reason);
      return state.phase;
    },
    triggerSkill() {
      return false;
    },
    triggerUlt() {
      return false;
    },
    setSeed: rng.seed
  };

  init();
})();
