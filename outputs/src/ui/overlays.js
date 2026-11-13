(() => {
  "use strict";

  const scoring = window.SDWX.scoring;
  const gameOverEl = document.getElementById("gameOver");
  const finalScoreEl = document.getElementById("finalScore");
  const finalBestEl = document.getElementById("finalBest");

  function showGameOver(score, best) {
    finalScoreEl.textContent = scoring.formatScore(score);
    finalBestEl.textContent = `最高纪录 ${scoring.formatScore(best)}`;
    gameOverEl.classList.add("is-visible");
    gameOverEl.setAttribute("aria-hidden", "false");
  }

  function hideGameOver() {
    gameOverEl.classList.remove("is-visible");
    gameOverEl.setAttribute("aria-hidden", "true");
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.overlays = {
    showGameOver,
    hideGameOver
  };
})();
