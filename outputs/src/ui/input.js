(() => {
  "use strict";

  const config = window.SDWX.config;
  const state = window.SDWX.state.state;
  let bound = false;

  function pointerToCanvasX(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * config.W;
  }

  /**
   * Binds pointer, keyboard, and control buttons to game actions.
   * @param {{canvas: HTMLCanvasElement, setDropX: Function, dropFruit: Function,
   * restartGame: Function, ensureAudio: Function, toggleSound: Function,
   * resizeCanvas: Function}} actions
   */
  function bind(actions) {
    if (bound) return;
    bound = true;
    const { canvas } = actions;

    canvas.addEventListener("pointermove", (event) => {
      if (state.gameOver) return;
      actions.setDropX(pointerToCanvasX(canvas, event));
    });

    canvas.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (state.gameOver) return;
      actions.setDropX(pointerToCanvasX(canvas, event));
      actions.ensureAudio();
      actions.dropFruit();
    });

    document.addEventListener("keydown", (event) => {
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        actions.setDropX(state.dropX - 24);
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        actions.setDropX(state.dropX + 24);
      } else if (event.code === "Space") {
        event.preventDefault();
        actions.dropFruit();
      } else if (event.code === "Enter" && state.gameOver) {
        event.preventDefault();
        actions.restartGame();
      }
    });

    document.getElementById("playAgain").addEventListener("click", actions.restartGame);
    document.getElementById("restartButton").addEventListener("click", actions.restartGame);
    document.getElementById("soundToggle").addEventListener("click", actions.toggleSound);
    window.addEventListener("resize", actions.resizeCanvas);
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.input = {
    bind
  };
})();
