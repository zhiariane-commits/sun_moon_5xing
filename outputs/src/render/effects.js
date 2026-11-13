(() => {
  "use strict";

  const config = window.SDWX.config;
  const state = window.SDWX.state.state;
  const particles = [];
  const rings = [];
  const floats = [];
  const ghosts = [];
  let ctx = null;

  function init(context) {
    ctx = context;
  }

  function createBurst(x, y, color, count, power) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.7 + Math.random() * 2.3) * power;
      const life = 420 + Math.random() * 460;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: 2 + Math.random() * 5.5,
        life,
        maxLife: life,
        color: Math.random() < 0.28 ? "#fff8dc" : color,
        square: Math.random() < 0.2
      });
    }
    if (particles.length > config.MAX_EFFECTS) {
      particles.splice(0, particles.length - config.MAX_EFFECTS);
    }
  }

  function addRing(x, y, color, maxRadius) {
    rings.push({
      x,
      y,
      radius: 8,
      maxRadius,
      color,
      life: 500,
      maxLife: 500
    });
  }

  function pushFloat(float) {
    floats.push(float);
  }

  function pushGhost(ghost) {
    ghosts.push(ghost);
  }

  function clear() {
    particles.length = 0;
    rings.length = 0;
    floats.length = 0;
    ghosts.length = 0;
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      particle.vy += 0.085 * dt * 0.06;
      particle.vx *= 0.992;
      particle.x += particle.vx * dt * 0.06;
      particle.y += particle.vy * dt * 0.06;
    }

    for (let i = rings.length - 1; i >= 0; i -= 1) {
      const ring = rings[i];
      ring.life -= dt;
      if (ring.life <= 0) {
        rings.splice(i, 1);
        continue;
      }
      const progress = 1 - ring.life / ring.maxLife;
      ring.radius = 8 + (ring.maxRadius - 8) * (1 - Math.pow(1 - progress, 3));
    }

    for (let i = floats.length - 1; i >= 0; i -= 1) {
      const float = floats[i];
      float.life -= dt;
      if (float.life <= 0) {
        floats.splice(i, 1);
        continue;
      }
      float.y += float.vy * dt * 0.06;
    }

    for (let i = ghosts.length - 1; i >= 0; i -= 1) {
      ghosts[i].life -= dt;
      if (ghosts[i].life <= 0) ghosts.splice(i, 1);
    }

    state.shake *= Math.pow(0.86, dt / 16.667);
    if (state.shake < 0.05) state.shake = 0;
  }

  function draw() {
    for (const ring of rings) {
      const alpha = ring.life / ring.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha * 0.52;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const particle of particles) {
      const alpha = Math.min(1, particle.life / (particle.maxLife * 0.38));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      if (particle.square) {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.life * 0.015);
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const float of floats) {
      const alpha = Math.min(1, float.life / 300);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = float.color;
      ctx.strokeStyle = "rgba(30, 66, 36, 0.28)";
      ctx.lineWidth = float.large ? 4 : 3;
      ctx.font = float.large
        ? '900 22px Trebuchet MS, Microsoft YaHei, sans-serif'
        : '900 15px Trebuchet MS, Microsoft YaHei, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(float.text, float.x, float.y);
      ctx.fillText(float.text, float.x, float.y);
      ctx.restore();
    }
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.effects = {
    particles,
    rings,
    floats,
    ghosts,
    init,
    createBurst,
    addRing,
    pushFloat,
    pushGhost,
    clear,
    update,
    draw
  };
})();
