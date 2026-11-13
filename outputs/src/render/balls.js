(() => {
  "use strict";

  const config = window.SDWX.config;
  const state = window.SDWX.state.state;
  let ctx = null;

  function init(context) {
    ctx = context;
  }

  function drawGhosts() {
    for (const ghost of window.SDWX.effects.ghosts) {
      const progress = 1 - ghost.life / ghost.maxLife;
      const scale = Math.max(0.05, 1 - progress * 0.72);
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.58;
      drawFruit(ghost.level, ghost.x, ghost.y, scale, ghost.angle, state.now, true);
      ctx.restore();
    }
  }

  function drawFruits() {
    for (const body of window.SDWX.physics.activeFruits.values()) {
      const level = body.plugin.level;
      const age = state.now - body.plugin.bornAt;
      let pop = 1;
      if (age < 190) {
        const t = Math.max(0, Math.min(1, age / 190));
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        pop = Math.max(0.1, Math.min(1.09, 0.62 + (eased - 0.62) * 0.92));
      }
      drawFruit(level, body.position.x, body.position.y, pop, body.angle, state.now);
    }
  }

  function drawFruitSurface(level, fruit, radius) {
    const bodyGradient = ctx.createRadialGradient(
      -radius * 0.34,
      -radius * 0.42,
      radius * 0.08,
      0,
      0,
      radius * 1.08
    );
    bodyGradient.addColorStop(0, fruit.light);
    bodyGradient.addColorStop(0.4, fruit.main);
    bodyGradient.addColorStop(1, fruit.dark);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = bodyGradient;
    ctx.fill();

    if (level === 4) drawWatermelonStripes(radius);
    if (level === 3) drawPeachCleft(radius);
    if (level === 2) drawOrangeDimples(radius);
    if (level === 0) drawBlueberryDust(radius);

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();

    const shade = ctx.createRadialGradient(
      radius * 0.4,
      radius * 0.48,
      radius * 0.18,
      radius * 0.25,
      radius * 0.43,
      radius * 1.04
    );
    shade.addColorStop(0, "rgba(0, 0, 0, 0)");
    shade.addColorStop(1, "rgba(24, 12, 34, 0.18)");
    ctx.fillStyle = shade;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

    const gloss = ctx.createRadialGradient(
      -radius * 0.36,
      -radius * 0.42,
      0,
      -radius * 0.36,
      -radius * 0.42,
      radius * 0.74
    );
    gloss.addColorStop(0, "rgba(255, 255, 255, 0.46)");
    gloss.addColorStop(0.5, "rgba(255, 255, 255, 0.07)");
    gloss.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gloss;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = Math.max(1, radius * 0.045);
    ctx.beginPath();
    ctx.arc(-radius * 0.005, -radius * 0.01, radius * 0.962, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawFruit(level, x, y, scale, angle, now, isGhost = false) {
    const fruit = config.FRUITS[level];
    const radius = fruit.radius;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    if (!isGhost) {
      ctx.save();
      ctx.translate(1.5, radius * 0.86);
      ctx.scale(1, 0.24);
      ctx.fillStyle = "rgba(25, 67, 38, 0.13)";
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.rotate(angle * 0.18);
    drawFruitSurface(level, fruit, radius);

    drawLeaf(level, radius, fruit, now);
    drawFace(level, radius);

    ctx.restore();
    ctx.restore();
  }

  function drawFace(level, radius) {
    const eyeY = radius * 0.015;
    const eyeX = radius * 0.285;
    const eyeRadius = Math.max(1.5, radius * 0.062);

    ctx.fillStyle = "rgba(49, 28, 48, 0.82)";
    ctx.beginPath();
    ctx.ellipse(-eyeX, eyeY, eyeRadius, eyeRadius * 1.18, 0, 0, Math.PI * 2);
    ctx.ellipse(eyeX, eyeY, eyeRadius, eyeRadius * 1.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.beginPath();
    ctx.arc(
      -eyeX + eyeRadius * 0.27,
      eyeY - eyeRadius * 0.33,
      Math.max(0.55, eyeRadius * 0.28),
      0,
      Math.PI * 2
    );
    ctx.arc(
      eyeX + eyeRadius * 0.27,
      eyeY - eyeRadius * 0.33,
      Math.max(0.55, eyeRadius * 0.28),
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = "rgba(49, 28, 48, 0.62)";
    ctx.lineWidth = Math.max(1, radius * 0.035);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, radius * 0.1, radius * 0.11, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 100, 128, 0.18)";
    ctx.beginPath();
    ctx.ellipse(-radius * 0.49, radius * 0.22, radius * 0.1, radius * 0.055, 0, 0, Math.PI * 2);
    ctx.ellipse(radius * 0.49, radius * 0.22, radius * 0.1, radius * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLeaf(level, radius, fruit, now) {
    const sway = Math.sin(now / 900 + level) * 0.07;
    ctx.save();
    ctx.translate(radius * 0.07, -radius * 0.93);
    ctx.rotate(-0.46 + sway);

    ctx.strokeStyle = level === 0 ? "rgba(42, 70, 34, 0.8)" : "rgba(61, 94, 39, 0.74)";
    ctx.lineWidth = Math.max(1.2, radius * 0.055);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.05, radius * 0.2);
    ctx.quadraticCurveTo(radius * 0.01, radius * 0.02, radius * 0.08, -radius * 0.05);
    ctx.stroke();

    ctx.fillStyle = fruit.accent;
    ctx.beginPath();
    ctx.moveTo(radius * 0.03, -radius * 0.04);
    ctx.quadraticCurveTo(radius * 0.38, -radius * 0.28, radius * 0.5, -radius * 0.01);
    ctx.quadraticCurveTo(radius * 0.28, radius * 0.14, radius * 0.03, -radius * 0.04);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = Math.max(0.7, radius * 0.022);
    ctx.beginPath();
    ctx.moveTo(radius * 0.1, -radius * 0.03);
    ctx.quadraticCurveTo(radius * 0.28, -radius * 0.08, radius * 0.42, -radius * 0.02);
    ctx.stroke();
    ctx.restore();
  }

  function drawWatermelonStripes(radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(8, 90, 51, 0.43)";
    ctx.lineWidth = Math.max(2.4, radius * 0.075);
    ctx.lineCap = "round";
    const stripes = [-0.64, -0.26, 0.17, 0.58];
    for (const offset of stripes) {
      ctx.beginPath();
      ctx.moveTo(radius * offset, -radius);
      ctx.bezierCurveTo(
        radius * (offset - 0.22),
        -radius * 0.22,
        radius * (offset + 0.2),
        radius * 0.34,
        radius * (offset + 0.04),
        radius
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPeachCleft(radius) {
    ctx.save();
    ctx.strokeStyle = "rgba(176, 47, 91, 0.25)";
    ctx.lineWidth = Math.max(1.4, radius * 0.046);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.05, -radius * 0.57);
    ctx.quadraticCurveTo(radius * 0.2, -radius * 0.1, radius * 0.02, radius * 0.17);
    ctx.stroke();
    ctx.restore();
  }

  function drawOrangeDimples(radius) {
    ctx.save();
    ctx.fillStyle = "rgba(166, 68, 12, 0.17)";
    const dots = [
      [-0.52, -0.24], [0.46, -0.3], [-0.35, 0.48], [0.48, 0.35], [0.12, -0.55]
    ];
    for (const [x, y] of dots) {
      ctx.beginPath();
      ctx.arc(radius * x, radius * y, Math.max(0.7, radius * 0.022), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBlueberryDust(radius) {
    ctx.save();
    ctx.fillStyle = "rgba(219, 216, 255, 0.3)";
    const dots = [[-0.46, -0.2], [0.45, -0.29], [-0.3, 0.45], [0.5, 0.38]];
    for (const [x, y] of dots) {
      ctx.beginPath();
      ctx.arc(radius * x, radius * y, Math.max(0.6, radius * 0.026), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.balls = {
    init,
    drawGhosts,
    drawFruits,
    drawFruit
  };
})();
