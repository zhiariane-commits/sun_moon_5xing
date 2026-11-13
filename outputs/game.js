(() => {
  "use strict";

  const W = 480;
  const H = 700;
  const DANGER_Y = 150;
  const DROP_Y = 72;
  const FIXED_STEP = 1000 / 60;
  const PLAY_LEFT = 3;
  const PLAY_RIGHT = W - 3;
  const PLAY_BOTTOM = H - 3;
  const MAX_EFFECTS = 260;

  const FRUITS = [
    {
      name: "小莓莓",
      radius: 20,
      light: "#d2ceff",
      main: "#7868ff",
      dark: "#2f238b",
      accent: "#a8ef8e",
      glow: "rgba(120, 104, 255, 0.32)"
    },
    {
      name: "樱桃",
      radius: 26,
      light: "#ffc6cd",
      main: "#ff5873",
      dark: "#a71b3f",
      accent: "#8edc72",
      glow: "rgba(255, 88, 115, 0.3)"
    },
    {
      name: "橙子",
      radius: 34,
      light: "#ffe0a5",
      main: "#ff9b2d",
      dark: "#bf4d0e",
      accent: "#86ce69",
      glow: "rgba(255, 155, 45, 0.3)"
    },
    {
      name: "蜜桃",
      radius: 43,
      light: "#ffd5dc",
      main: "#ff95b2",
      dark: "#d14d7b",
      accent: "#86cc6a",
      glow: "rgba(255, 149, 178, 0.34)"
    },
    {
      name: "大西瓜",
      radius: 57,
      light: "#b8f5b8",
      main: "#43c975",
      dark: "#087047",
      accent: "#78d65f",
      glow: "rgba(67, 201, 117, 0.34)"
    }
  ];

  const SPAWN_POOL = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2];
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const nextFruitEl = document.getElementById("nextFruit");
  const nextNameEl = document.getElementById("nextName");
  const comboBadgeEl = document.getElementById("comboBadge");
  const dangerPillEl = document.getElementById("dangerPill");
  const dangerTextEl = document.getElementById("dangerText");
  const toastEl = document.getElementById("toast");
  const gameOverEl = document.getElementById("gameOver");
  const finalScoreEl = document.getElementById("finalScore");
  const finalBestEl = document.getElementById("finalBest");
  const playAgainEl = document.getElementById("playAgain");
  const restartButtonEl = document.getElementById("restartButton");
  const soundToggleEl = document.getElementById("soundToggle");
  const mergeLadderEl = document.getElementById("mergeLadder");

  const { Engine, Bodies, Body, Composite } = window.Matter || {};
  let engine;
  let world;
  let lastFrame = performance.now();
  let accumulator = 0;
  let toastTimer = 0;
  let audioContext = null;
  let displayedScore = 0;

  const activeFruits = new Map();
  const particles = [];
  const rings = [];
  const floats = [];
  const ghosts = [];

  const state = {
    now: performance.now(),
    score: 0,
    best: readNumber("tripleMelonBest", 0),
    combo: 0,
    lastMergeAt: -9999,
    currentLevel: 0,
    nextLevel: 1,
    dropX: W / 2,
    canDrop: true,
    cooldownUntil: 0,
    gameOver: false,
    hazard: 0,
    shake: 0,
    firstWatermelon: false,
    soundOn: readString("tripleMelonSound", "on") !== "off",
    totalMerges: 0
  };

  function readNumber(key, fallback) {
    try {
      const value = Number(localStorage.getItem(key));
      return Number.isFinite(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function readString(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // The demo also works when file:// storage is disabled.
    }
  }

  function randomSpawn() {
    return SPAWN_POOL[Math.floor(Math.random() * SPAWN_POOL.length)];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatScore(value) {
    return Math.max(0, Math.round(value)).toLocaleString("zh-CN");
  }

  function setMiniFruit(el, level) {
    if (!el || !FRUITS[level]) return;
    el.style.setProperty("--fruit-light", FRUITS[level].light);
    el.style.setProperty("--fruit-main", FRUITS[level].main);
    el.style.setProperty("--fruit-dark", FRUITS[level].dark);
    el.style.setProperty("--fruit-glow", FRUITS[level].glow);
    el.dataset.level = String(level);
  }

  function buildLadder() {
    mergeLadderEl.innerHTML = "";
    FRUITS.forEach((fruit, index) => {
      const row = document.createElement("div");
      row.className = "ladder-step" + (index === FRUITS.length - 1 ? " is-final" : "");

      const number = document.createElement("span");
      number.className = "ladder-index";
      number.textContent = String(index + 1).padStart(2, "0");

      const mini = document.createElement("span");
      mini.className = "mini-fruit";
      setMiniFruit(mini, index);

      const name = document.createElement("span");
      name.className = "ladder-name";
      name.textContent = fruit.name;

      const mult = document.createElement("span");
      mult.className = "ladder-mult";
      mult.textContent = index === FRUITS.length - 1 ? "终点" : "×3 →";

      row.append(number, mini, name, mult);
      mergeLadderEl.append(row);
    });
  }

  function setRuleFruits() {
    const triple = document.querySelectorAll(".rule-fruit-1, .rule-fruit-2, .rule-fruit-3");
    triple.forEach((el) => {
      el.style.setProperty("--fruit-light", FRUITS[1].light);
      el.style.setProperty("--fruit-main", FRUITS[1].main);
      el.style.setProperty("--fruit-dark", FRUITS[1].dark);
      el.style.setProperty("--fruit-glow", FRUITS[1].glow);
    });
    const next = document.querySelector(".rule-fruit-next");
    if (next) {
      next.style.setProperty("--fruit-light", FRUITS[2].light);
      next.style.setProperty("--fruit-main", FRUITS[2].main);
      next.style.setProperty("--fruit-dark", FRUITS[2].dark);
      next.style.setProperty("--fruit-glow", FRUITS[2].glow);
    }
  }

  function resizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      Bodies.rectangle(PLAY_LEFT - 40, H / 2, 80, H + 320, wallOptions),
      Bodies.rectangle(PLAY_RIGHT + 40, H / 2, 80, H + 320, wallOptions),
      Bodies.rectangle(W / 2, PLAY_BOTTOM + 40, W + 260, 80, wallOptions)
    ]);
  }

  function createFruit(level, x, y) {
    const fruit = FRUITS[level];
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
      seed: Math.random() * Math.PI * 2
    };
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.045);
    Composite.add(world, body);
    activeFruits.set(body.id, body);
    return body;
  }

  function removeFruit(body) {
    if (!activeFruits.has(body.id)) return;
    activeFruits.delete(body.id);
    Composite.remove(world, body);
  }

  function setDropX(x) {
    const radius = FRUITS[state.currentLevel].radius;
    state.dropX = clamp(x, PLAY_LEFT + radius + 5, PLAY_RIGHT - radius - 5);
  }

  function dropFruit() {
    if (state.gameOver || !state.canDrop) return;

    ensureAudio();
    const level = state.currentLevel;
    const radius = FRUITS[level].radius;
    const x = clamp(state.dropX, PLAY_LEFT + radius + 4, PLAY_RIGHT - radius - 4);
    const body = createFruit(level, x, DROP_Y + 1);
    Body.setVelocity(body, { x: 0, y: 1.2 });

    state.currentLevel = state.nextLevel;
    state.nextLevel = randomSpawn();
    state.canDrop = false;
    state.cooldownUntil = state.now + 390;
    state.shake = Math.max(state.shake, 1.4);
    updateNextUI();
    playDropSound();
  }

  function updateNextUI() {
    const fruit = FRUITS[state.nextLevel];
    setMiniFruit(nextFruitEl, state.nextLevel);
    nextNameEl.textContent = fruit.name;
  }

  function updateScoreUI(force = false) {
    const score = state.score;
    if (force) displayedScore = score;
    scoreEl.textContent = formatScore(displayedScore);
    if (score > state.best) {
      state.best = score;
      writeStorage("tripleMelonBest", state.best);
    }
    bestEl.textContent = formatScore(state.best);
  }

  function bumpScore() {
    scoreEl.classList.remove("bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("bump");
  }

  function updateComboUI() {
    if (state.combo >= 2 && state.now - state.lastMergeAt < 1700) {
      comboBadgeEl.textContent = `连锁 ×${Math.min(8, state.combo)}`;
      comboBadgeEl.classList.add("is-active");
    } else {
      comboBadgeEl.classList.remove("is-active");
    }
  }

  function showToast(text, duration = 1900) {
    toastEl.textContent = text;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove("is-visible");
    }, duration);
  }

  function findComponents(fruits) {
    const parent = new Map();
    const rank = new Map();

    for (const body of fruits) {
      parent.set(body.id, body.id);
      rank.set(body.id, 0);
    }

    function find(id) {
      let root = id;
      while (parent.get(root) !== root) root = parent.get(root);
      while (parent.get(id) !== id) {
        const next = parent.get(id);
        parent.set(id, root);
        id = next;
      }
      return root;
    }

    function union(a, b) {
      const rootA = find(a);
      const rootB = find(b);
      if (rootA === rootB) return;
      const rankA = rank.get(rootA) || 0;
      const rankB = rank.get(rootB) || 0;
      if (rankA < rankB) {
        parent.set(rootA, rootB);
      } else if (rankA > rankB) {
        parent.set(rootB, rootA);
      } else {
        parent.set(rootB, rootA);
        rank.set(rootA, rankA + 1);
      }
    }

    for (let i = 0; i < fruits.length; i += 1) {
      const a = fruits[i];
      const levelA = a.plugin.level;
      for (let j = i + 1; j < fruits.length; j += 1) {
        const b = fruits[j];
        if (levelA !== b.plugin.level) continue;
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const touchDistance = FRUITS[levelA].radius * 2 + 3.2;
        if (dx * dx + dy * dy <= touchDistance * touchDistance) {
          union(a.id, b.id);
        }
      }
    }

    const groups = new Map();
    for (const body of fruits) {
      const root = find(body.id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(body);
    }
    return [...groups.values()].filter((group) => group.length >= 3);
  }

  function pickCompactTriple(group) {
    if (group.length === 3) return group;

    let bestSeed = group[0];
    let bestNeighbors = [];
    let bestDistance = Infinity;

    for (const body of group) {
      const nearest = group
        .filter((other) => other !== body)
        .map((other) => {
          const dx = body.position.x - other.position.x;
          const dy = body.position.y - other.position.y;
          return { other, distance: dx * dx + dy * dy };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);

      if (nearest.length < 2) continue;
      const total = nearest[0].distance + nearest[1].distance;
      if (total < bestDistance) {
        bestDistance = total;
        bestSeed = body;
        bestNeighbors = nearest.map((item) => item.other);
      }
    }

    return [bestSeed, ...bestNeighbors];
  }

  function processMerges() {
    if (state.gameOver) return;
    const fruits = [...activeFruits.values()].filter(
      (body) => state.now - body.plugin.bornAt >= 105
    );
    if (fruits.length < 3) return;

    const groups = findComponents(fruits);
    for (let i = 0; i < Math.min(groups.length, 4); i += 1) {
      const triple = pickCompactTriple(groups[i]);
      if (triple && triple.length === 3 && triple.every((body) => activeFruits.has(body.id))) {
        mergeTriple(triple);
      }
    }
  }

  function mergeTriple(triple) {
    const level = triple[0].plugin.level;
    const fruit = FRUITS[level];
    let cx = 0;
    let cy = 0;
    let vx = 0;
    let vy = 0;

    for (const body of triple) {
      cx += body.position.x / 3;
      cy += body.position.y / 3;
      vx += body.velocity.x / 3;
      vy += body.velocity.y / 3;
    }

    for (const body of triple) {
      ghosts.push({
        level,
        x: body.position.x,
        y: body.position.y,
        angle: body.angle,
        life: 150,
        maxLife: 150
      });
      removeFruit(body);
    }

    if (state.now - state.lastMergeAt < 1650) {
      state.combo += 1;
    } else {
      state.combo = 1;
    }
    state.lastMergeAt = state.now;
    state.totalMerges += 1;

    const multiplier = Math.min(8, Math.max(1, state.combo));
    const isFinal = level === FRUITS.length - 1;
    const points = isFinal ? 1500 * multiplier : (level + 1) * 40 * multiplier;

    state.score += points;
    bumpScore();
    updateScoreUI();
    updateComboUI();
    state.shake = Math.min(10, state.shake + (isFinal ? 10 : 3.5 + level * 0.7));

    createBurst(cx, cy, fruit.main, isFinal ? 40 : 22, isFinal ? 3.2 : 1.5);
    addRing(cx, cy, fruit.main, isFinal ? 108 : 62);
    floats.push({
      x: cx,
      y: cy - FRUITS[level].radius * 0.3,
      text: `+${formatScore(points)}`,
      color: isFinal ? "#fff3a8" : "#fff9dd",
      life: 780,
      maxLife: 780,
      vy: -0.4
    });

    if (isFinal) {
      floats.push({
        x: cx,
        y: cy - 38,
        text: "瓜王暴击！",
        color: "#fff4a8",
        life: 1100,
        maxLife: 1100,
        vy: -0.22,
        large: true
      });
      showToast("三颗大西瓜触发瓜王暴击，清出大片空间！", 2200);
      playFinalSound();
      return;
    }

    const nextLevel = level + 1;
    const nextFruit = FRUITS[nextLevel];
    const newX = clamp(
      cx,
      PLAY_LEFT + nextFruit.radius + 2,
      PLAY_RIGHT - nextFruit.radius - 2
    );
    const newY = Math.min(cy, PLAY_BOTTOM - nextFruit.radius - 2);
    const newBody = createFruit(nextLevel, newX, newY);

    Body.setVelocity(newBody, {
      x: clamp(vx * 0.24, -2.4, 2.4),
      y: clamp(vy * 0.18 - 1.4, -3.2, 1.2)
    });

    addRing(newX, newY, nextFruit.main, 46);
    playMergeSound(nextLevel);

    if (nextLevel === FRUITS.length - 1) {
      floats.push({
        x: newX,
        y: newY - nextFruit.radius - 12,
        text: "大西瓜！",
        color: "#d9ff95",
        life: 1200,
        maxLife: 1200,
        vy: -0.25,
        large: true
      });
      if (!state.firstWatermelon) {
        state.firstWatermelon = true;
        showToast("大西瓜诞生！再合成三颗可触发瓜王暴击。", 2500);
      }
    }
  }

  function updateHazard(dt) {
    if (state.gameOver) return;

    let dangerous = false;
    for (const body of activeFruits.values()) {
      if (state.now - body.plugin.bornAt < 1200) continue;
      const radius = FRUITS[body.plugin.level].radius;
      if (body.position.y - radius < DANGER_Y && body.speed < 2.6) {
        dangerous = true;
        break;
      }
    }

    if (dangerous) {
      state.hazard = Math.min(1, state.hazard + dt / 2200);
    } else {
      state.hazard = Math.max(0, state.hazard - dt / 760);
    }

    if (state.hazard > 0.045) {
      dangerPillEl.classList.add("is-active");
      dangerTextEl.textContent = `红线告急 ${Math.round(state.hazard * 100)}%`;
    } else {
      dangerPillEl.classList.remove("is-active");
    }

    if (state.hazard >= 1) {
      endGame();
    }
  }

  function endGame() {
    if (state.gameOver) return;
    state.gameOver = true;
    state.canDrop = false;
    if (state.score > state.best) {
      state.best = state.score;
      writeStorage("tripleMelonBest", state.best);
    }
    updateScoreUI(true);
    finalScoreEl.textContent = formatScore(state.score);
    finalBestEl.textContent = `最高纪录 ${formatScore(state.best)}`;
    gameOverEl.classList.add("is-visible");
    gameOverEl.setAttribute("aria-hidden", "false");
    comboBadgeEl.classList.remove("is-active");
    dangerPillEl.classList.remove("is-active");
    playGameOverSound();
  }

  function restartGame() {
    for (const body of [...activeFruits.values()]) removeFruit(body);
    activeFruits.clear();
    particles.length = 0;
    rings.length = 0;
    floats.length = 0;
    ghosts.length = 0;
    state.score = 0;
    state.combo = 0;
    state.lastMergeAt = -9999;
    state.currentLevel = randomSpawn();
    state.nextLevel = randomSpawn();
    state.dropX = W / 2;
    state.canDrop = true;
    state.cooldownUntil = 0;
    state.gameOver = false;
    state.hazard = 0;
    state.shake = 0;
    state.firstWatermelon = false;
    state.totalMerges = 0;
    displayedScore = 0;
    gameOverEl.classList.remove("is-visible");
    gameOverEl.setAttribute("aria-hidden", "true");
    dangerPillEl.classList.remove("is-active");
    comboBadgeEl.classList.remove("is-active");
    toastEl.classList.remove("is-visible");
    setDropX(W / 2);
    updateNextUI();
    updateScoreUI(true);
    ensureAudio();
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
    if (particles.length > MAX_EFFECTS) {
      particles.splice(0, particles.length - MAX_EFFECTS);
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

  function updateEffects(dt) {
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
    displayedScore += (state.score - displayedScore) * Math.min(1, dt / 85);
    if (Math.abs(displayedScore - state.score) < 1) displayedScore = state.score;
    scoreEl.textContent = formatScore(displayedScore);
    updateComboUI();
  }

  function drawBoardBackground() {
    const gradient = ctx.createLinearGradient(0, 0, W * 0.22, H);
    gradient.addColorStop(0, "#fff8dc");
    gradient.addColorStop(0.42, "#eef4db");
    gradient.addColorStop(1, "#d8edd1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    const aura = ctx.createRadialGradient(W * 0.5, 190, 0, W * 0.5, 190, W * 0.82);
    aura.addColorStop(0, "rgba(255, 255, 255, 0.64)");
    aura.addColorStop(0.5, "rgba(255, 255, 255, 0.16)");
    aura.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, 440);

    ctx.fillStyle = "rgba(29, 80, 52, 0.075)";
    for (let y = 30; y < H; y += 34) {
      for (let x = 24 + (Math.floor(y / 34) % 2) * 17; x < W; x += 34) {
        ctx.beginPath();
        ctx.arc(x, y, 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const topShade = ctx.createLinearGradient(0, 0, 0, 118);
    topShade.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    topShade.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, W, 118);

    if (!state.gameOver) {
      const glow = ctx.createRadialGradient(
        state.dropX,
        DROP_Y,
        2,
        state.dropX,
        DROP_Y,
        78
      );
      glow.addColorStop(0, "rgba(255, 247, 183, 0.22)");
      glow.addColorStop(1, "rgba(255, 247, 183, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(state.dropX - 80, DROP_Y - 80, 160, 160);
    }
  }

  function drawWallsAndFloor() {
    const wallGradient = ctx.createLinearGradient(0, 0, 0, H);
    wallGradient.addColorStop(0, "rgba(50, 112, 76, 0.09)");
    wallGradient.addColorStop(1, "rgba(34, 91, 57, 0.24)");
    ctx.fillStyle = wallGradient;
    ctx.fillRect(0, 0, 7, H);
    ctx.fillRect(W - 7, 0, 7, H);

    const floorGradient = ctx.createLinearGradient(0, H - 20, 0, H);
    floorGradient.addColorStop(0, "rgba(44, 115, 68, 0.15)");
    floorGradient.addColorStop(1, "rgba(31, 92, 53, 0.43)");
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, H - 17, W, 17);

    ctx.strokeStyle = "rgba(29, 90, 51, 0.42)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 12);
    ctx.lineTo(W, H - 12);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8, H - 15);
    ctx.lineTo(W - 8, H - 15);
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
    ctx.moveTo(10, DANGER_Y);
    ctx.lineTo(W - 10, DANGER_Y);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = urgent ? "rgba(158, 35, 55, 0.72)" : "rgba(130, 94, 68, 0.46)";
    ctx.font = '700 9px Trebuchet MS, Microsoft YaHei, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("警戒线", 13, DANGER_Y - 7);
    ctx.restore();
  }

  function drawDropGuide() {
    if (state.gameOver) return;
    const radius = FRUITS[state.currentLevel].radius;
    const alpha = state.canDrop ? 0.23 : 0.09;
    ctx.save();
    ctx.setLineDash([5, 9]);
    ctx.strokeStyle = `rgba(44, 92, 57, ${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(state.dropX, DROP_Y + radius + 13);
    ctx.lineTo(state.dropX, H - 28);
    ctx.stroke();
    ctx.restore();
  }

  function drawPreview(now) {
    if (state.gameOver) return;
    const level = state.currentLevel;
    const fruit = FRUITS[level];
    const bob = Math.sin(now / 430) * 2.4;
    const scale = state.canDrop ? 1 : 0.82;
    const alpha = state.canDrop ? 1 : 0.4;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(34, 67, 44, 0.12)";
    ctx.beginPath();
    ctx.ellipse(state.dropX, DROP_Y + 35, fruit.radius * 0.82, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    drawFruit(level, state.dropX, DROP_Y + bob, scale, 0, now);

    if (state.canDrop) {
      ctx.fillStyle = "rgba(38, 81, 49, 0.42)";
      ctx.beginPath();
      ctx.moveTo(state.dropX - 5, DROP_Y - fruit.radius - 18);
      ctx.lineTo(state.dropX + 5, DROP_Y - fruit.radius - 18);
      ctx.lineTo(state.dropX, DROP_Y - fruit.radius - 11);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGhosts() {
    for (const ghost of ghosts) {
      const progress = 1 - ghost.life / ghost.maxLife;
      const scale = Math.max(0.05, 1 - progress * 0.72);
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.58;
      drawFruit(ghost.level, ghost.x, ghost.y, scale, ghost.angle, state.now, true);
      ctx.restore();
    }
  }

  function drawFruits() {
    for (const body of activeFruits.values()) {
      const level = body.plugin.level;
      const age = state.now - body.plugin.bornAt;
      let pop = 1;
      if (age < 190) {
        const t = clamp(age / 190, 0, 1);
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        pop = clamp(0.62 + (eased - 0.62) * 0.92, 0.1, 1.09);
      }
      drawFruit(level, body.position.x, body.position.y, pop, body.angle, state.now);
    }
  }

  function drawFruit(level, x, y, scale, angle, now, isGhost = false) {
    const fruit = FRUITS[level];
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
    ctx.arc(-eyeX + eyeRadius * 0.27, eyeY - eyeRadius * 0.33, Math.max(0.55, eyeRadius * 0.28), 0, Math.PI * 2);
    ctx.arc(eyeX + eyeRadius * 0.27, eyeY - eyeRadius * 0.33, Math.max(0.55, eyeRadius * 0.28), 0, Math.PI * 2);
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

  function drawEffects() {
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

  function render(now) {
    ctx.clearRect(0, 0, W, H);
    drawBoardBackground(now);

    ctx.save();
    if (state.shake > 0.03) {
      ctx.translate(
        (Math.random() - 0.5) * state.shake,
        (Math.random() - 0.5) * state.shake
      );
    }

    drawWallsAndFloor();
    drawDangerLine();
    drawDropGuide();
    drawGhosts();
    drawFruits();
    drawPreview(now);
    drawEffects();
    ctx.restore();

    const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.83);
    vignette.addColorStop(0, "rgba(26, 68, 38, 0)");
    vignette.addColorStop(1, "rgba(22, 63, 35, 0.08)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function frame(now) {
    const dt = Math.min(50, Math.max(0, now - lastFrame));
    lastFrame = now;
    state.now = now;

    if (!state.gameOver) {
      accumulator = Math.min(accumulator + dt, 100);
      let steps = 0;
      while (accumulator >= FIXED_STEP && steps < 6) {
        Engine.update(engine, FIXED_STEP);
        processMerges();
        accumulator -= FIXED_STEP;
        steps += 1;
      }

      if (!state.canDrop && now >= state.cooldownUntil) {
        state.canDrop = true;
      }

      updateHazard(dt);
    }

    updateEffects(dt);
    render(now);
    requestAnimationFrame(frame);
  }

  function pointerToCanvasX(event) {
    const rect = canvas.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * W;
  }

  function ensureAudio() {
    if (!state.soundOn) return;
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) audioContext = new AudioCtor();
    }
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  }

  function tone(frequency, duration, volume, type = "sine", endFrequency = null, delay = 0) {
    if (!state.soundOn || !audioContext) return;
    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }

  function playDropSound() {
    ensureAudio();
    tone(180, 0.1, 0.028, "triangle", 118);
  }

  function playMergeSound(level) {
    ensureAudio();
    const base = 260 + level * 48;
    tone(base, 0.17, 0.038, "sine", base * 1.25);
    tone(base * 1.5, 0.12, 0.022, "triangle", base * 1.8, 0.035);
  }

  function playFinalSound() {
    ensureAudio();
    [261.6, 329.6, 392, 523.2].forEach((frequency, index) => {
      tone(frequency, 0.36, 0.045, "triangle", frequency * 1.01, index * 0.055);
    });
    tone(95, 0.5, 0.055, "sine", 58);
  }

  function playGameOverSound() {
    ensureAudio();
    [330, 262, 196].forEach((frequency, index) => {
      tone(frequency, 0.24, 0.03, "sine", frequency * 0.95, index * 0.13);
    });
  }

  function updateSoundButton() {
    soundToggleEl.classList.toggle("is-muted", !state.soundOn);
    soundToggleEl.setAttribute("aria-pressed", String(state.soundOn));
    const label = soundToggleEl.querySelector(".button-label");
    if (label) label.textContent = state.soundOn ? "音效开" : "音效关";
  }

  function bindEvents() {
    canvas.addEventListener("pointermove", (event) => {
      if (state.gameOver) return;
      setDropX(pointerToCanvasX(event));
    });

    canvas.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (state.gameOver) return;
      setDropX(pointerToCanvasX(event));
      ensureAudio();
      dropFruit();
    });

    document.addEventListener("keydown", (event) => {
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        setDropX(state.dropX - 24);
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        setDropX(state.dropX + 24);
      } else if (event.code === "Space") {
        event.preventDefault();
        dropFruit();
      } else if (event.code === "Enter" && state.gameOver) {
        event.preventDefault();
        restartGame();
      }
    });

    playAgainEl.addEventListener("click", restartGame);
    restartButtonEl.addEventListener("click", restartGame);

    soundToggleEl.addEventListener("click", () => {
      state.soundOn = !state.soundOn;
      writeStorage("tripleMelonSound", state.soundOn ? "on" : "off");
      updateSoundButton();
      if (state.soundOn) {
        ensureAudio();
        tone(520, 0.09, 0.025, "sine");
      }
    });

    window.addEventListener("resize", resizeCanvas);
  }

  function init() {
    if (!window.Matter || !Engine || !Bodies || !Body || !Composite) {
      const stage = document.getElementById("boardStage");
      stage.innerHTML = '<div style="display:grid;height:100%;place-items:center;padding:30px;color:#26462f;font:700 14px sans-serif;text-align:center">物理引擎加载失败，请确认 lib/matter.min.js 与 index.html 在同一目录。</div>';
      return;
    }

    resizeCanvas();
    setupPhysics();
    buildLadder();
    setRuleFruits();
    bindEvents();
    updateSoundButton();

    state.currentLevel = randomSpawn();
    state.nextLevel = randomSpawn();
    setDropX(W / 2);
    updateNextUI();
    updateScoreUI(true);
    requestAnimationFrame((now) => {
      lastFrame = now;
      requestAnimationFrame(frame);
    });
  }

  window.__tripleMelonDebug = {
    state,
    activeFruits,
    createFruit,
    dropFruit,
    processMerges,
    setDropX,
    restartGame,
    endGame
  };

  init();
})();
