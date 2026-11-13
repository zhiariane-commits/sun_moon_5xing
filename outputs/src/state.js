(() => {
  "use strict";

  const config = window.SDWX.config;
  const rng = window.SDWX.rng;
  const storage = window.SDWX.storage;
  const PHASES = ["menu", "playing", "targeting", "paused", "over"];

  const state = {
    now: window.performance.now(),
    score: 0,
    best: storage.readNumber("tripleMelonBest", 0),
    combo: 0,
    lastMergeAt: -9999,
    currentLevel: 0,
    nextLevel: 1,
    dropX: config.W / 2,
    canDrop: true,
    cooldownUntil: 0,
    gameOver: false,
    phase: "playing",
    hazard: 0,
    shake: 0,
    firstWatermelon: false,
    soundOn: storage.readString("tripleMelonSound", "on") !== "off",
    totalMerges: 0
  };

  /**
   * Switches the logical phase and keeps the legacy gameOver flag in sync.
   * M1 only enters playing/over; the full enum is reserved for later milestones.
   * @param {"menu"|"playing"|"targeting"|"paused"|"over"} next
   */
  function setPhase(next) {
    if (!PHASES.includes(next)) {
      throw new Error(`Unknown phase: ${next}`);
    }
    state.phase = next;
    state.gameOver = next === "over";
  }

  function resetRunValues() {
    state.score = 0;
    state.combo = 0;
    state.lastMergeAt = -9999;
    state.currentLevel = rng.spawnLevel();
    state.nextLevel = rng.spawnLevel();
    state.dropX = config.W / 2;
    state.canDrop = true;
    state.cooldownUntil = 0;
    state.hazard = 0;
    state.shake = 0;
    state.firstWatermelon = false;
    state.totalMerges = 0;
  }

  function restartGame() {
    window.SDWX.physics.clearFruits();
    window.SDWX.effects.clear();
    resetRunValues();
    setPhase("playing");
    window.SDWX.scoring.resetDisplayedScore();
    window.SDWX.hud.reset();
    window.SDWX.overlays.hideGameOver();
    window.SDWX.physics.setDropX(config.W / 2);
    window.SDWX.hud.updateNextUI();
    window.SDWX.scoring.updateScoreUI(true);
    window.SDWX.audio.ensureAudio();
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.state = {
    state,
    setPhase,
    restartGame
  };
})();
