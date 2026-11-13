(() => {
  "use strict";

  const config = window.SDWX.config;
  const state = window.SDWX.state.state;
  let ctx = null;

  function init(context) {
    ctx = context;
  }

  function drawBoardBackground() {
    const gradient = ctx.createLinearGradient(0, 0, config.W * 0.22, config.H);
    gradient.addColorStop(0, "#fff8dc");
    gradient.addColorStop(0.42, "#eef4db");
    gradient.addColorStop(1, "#d8edd1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.W, config.H);

    const aura = ctx.createRadialGradient(
      config.W * 0.5,
      190,
      0,
      config.W * 0.5,
      190,
      config.W * 0.82
    );
    aura.addColorStop(0, "rgba(255, 255, 255, 0.64)");
    aura.addColorStop(0.5, "rgba(255, 255, 255, 0.16)");
    aura.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, config.W, 440);

    ctx.fillStyle = "rgba(29, 80, 52, 0.075)";
    for (let y = 30; y < config.H; y += 34) {
      for (let x = 24 + (Math.floor(y / 34) % 2) * 17; x < config.W; x += 34) {
        ctx.beginPath();
        ctx.arc(x, y, 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const topShade = ctx.createLinearGradient(0, 0, 0, 118);
    topShade.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    topShade.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, config.W, 118);

    if (!state.gameOver) {
      const glow = ctx.createRadialGradient(
        state.dropX,
        config.DROP_Y,
        2,
        state.dropX,
        config.DROP_Y,
        78
      );
      glow.addColorStop(0, "rgba(255, 247, 183, 0.22)");
      glow.addColorStop(1, "rgba(255, 247, 183, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(state.dropX - 80, config.DROP_Y - 80, 160, 160);
    }
  }

  function drawWallsAndFloor() {
    const wallGradient = ctx.createLinearGradient(0, 0, 0, config.H);
    wallGradient.addColorStop(0, "rgba(50, 112, 76, 0.09)");
    wallGradient.addColorStop(1, "rgba(34, 91, 57, 0.24)");
    ctx.fillStyle = wallGradient;
    ctx.fillRect(0, 0, 7, config.H);
    ctx.fillRect(config.W - 7, 0, 7, config.H);

    const floorGradient = ctx.createLinearGradient(0, config.H - 20, 0, config.H);
    floorGradient.addColorStop(0, "rgba(44, 115, 68, 0.15)");
    floorGradient.addColorStop(1, "rgba(31, 92, 53, 0.43)");
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, config.H - 17, config.W, 17);

    ctx.strokeStyle = "rgba(29, 90, 51, 0.42)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, config.H - 12);
    ctx.lineTo(config.W, config.H - 12);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8, config.H - 15);
    ctx.lineTo(config.W - 8, config.H - 15);
    ctx.stroke();
  }

  function drawDangerLine() {
    const urgent = state.hazard > 0.04;
    ctx.save();
    ctx.setLineDash([7, 8]);
    ctx.lineDashOffset = -((state.now / 80) % 15);
    ctx.strokeStyle = urgent ? "rgba(216, 55, 82, 0.72)" : "rgba(200, 104, 88, 0.36)";
    ctx.lineWidth = urgent ? 2 : 1.4;
    ctx.beginPath();
    ctx.moveTo(10, config.DANGER_Y);
    ctx.lineTo(config.W - 10, config.DANGER_Y);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = urgent ? "rgba(158, 35, 55, 0.72)" : "rgba(130, 94, 68, 0.46)";
    ctx.font = '700 9px Trebuchet MS, Microsoft YaHei, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("警戒线", 13, config.DANGER_Y - 7);
    ctx.restore();
  }

  function drawDropGuide() {
    if (state.gameOver) return;
    const radius = config.FRUITS[state.currentLevel].radius;
    const alpha = state.canDrop ? 0.23 : 0.09;
    ctx.save();
    ctx.setLineDash([5, 9]);
    ctx.strokeStyle = `rgba(44, 92, 57, ${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(state.dropX, config.DROP_Y + radius + 13);
    ctx.lineTo(state.dropX, config.H - 28);
    ctx.stroke();
    ctx.restore();
  }

  function drawPreview(now) {
    if (state.gameOver) return;
    const level = state.currentLevel;
    const fruit = config.FRUITS[level];
    const bob = Math.sin(now / 430) * 2.4;
    const scale = state.canDrop ? 1 : 0.82;
    const alpha = state.canDrop ? 1 : 0.4;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(34, 67, 44, 0.12)";
    ctx.beginPath();
    ctx.ellipse(state.dropX, config.DROP_Y + 35, fruit.radius * 0.82, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    window.SDWX.balls.drawFruit(level, state.dropX, config.DROP_Y + bob, scale, 0, now);

    if (state.canDrop) {
      ctx.fillStyle = "rgba(38, 81, 49, 0.42)";
      ctx.beginPath();
      ctx.moveTo(state.dropX - 5, config.DROP_Y - fruit.radius - 18);
      ctx.lineTo(state.dropX + 5, config.DROP_Y - fruit.radius - 18);
      ctx.lineTo(state.dropX, config.DROP_Y - fruit.radius - 11);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    const vignette = ctx.createRadialGradient(
      config.W / 2,
      config.H / 2,
      config.W * 0.3,
      config.W / 2,
      config.H / 2,
      config.W * 0.83
    );
    vignette.addColorStop(0, "rgba(26, 68, 38, 0)");
    vignette.addColorStop(1, "rgba(22, 63, 35, 0.08)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, config.W, config.H);
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.board = {
    init,
    drawBoardBackground,
    drawWallsAndFloor,
    drawDangerLine,
    drawDropGuide,
    drawPreview,
    drawVignette
  };
})();
