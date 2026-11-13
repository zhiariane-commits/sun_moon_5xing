(() => {
  "use strict";

  const state = window.SDWX.state.state;
  const storage = window.SDWX.storage;
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  let displayedScore = 0;

  function formatScore(value) {
    return Math.max(0, Math.round(value)).toLocaleString("zh-CN");
  }

  function updateScoreUI(force = false) {
    const score = state.score;
    if (force) displayedScore = score;
    scoreEl.textContent = formatScore(displayedScore);
    if (score > state.best) {
      state.best = score;
      storage.write("tripleMelonBest", state.best);
    }
    bestEl.textContent = formatScore(state.best);
  }

  function bumpScore() {
    scoreEl.classList.remove("bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("bump");
  }

  /**
   * Adds one scoring event. M1 keeps the prototype formula; later milestones
   * extend this entry point with faction and fever multipliers.
   * @param {{base?: number, multiplier?: number}} event
   * @returns {number} awarded points
   */
  function award(event = {}) {
    const base = Number(event.base) || 0;
    const multiplier = Number(event.multiplier) || 1;
    const points = Math.max(0, Math.round(base * multiplier));
    state.score += points;
    bumpScore();
    updateScoreUI();
    return points;
  }

  function updateDisplayedScore(dt) {
    displayedScore += (state.score - displayedScore) * Math.min(1, dt / 85);
    if (Math.abs(displayedScore - state.score) < 1) displayedScore = state.score;
    scoreEl.textContent = formatScore(displayedScore);
  }

  function resetDisplayedScore() {
    displayedScore = 0;
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.scoring = {
    formatScore,
    updateScoreUI,
    bumpScore,
    award,
    updateDisplayedScore,
    resetDisplayedScore
  };
})();
