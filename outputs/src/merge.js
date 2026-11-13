(() => {
  "use strict";

  const config = window.SDWX.config;
  const state = window.SDWX.state.state;
  const physics = window.SDWX.physics;
  const scoring = window.SDWX.scoring;

  function getEffects() {
    return window.SDWX.effects;
  }

  function getAudio() {
    return window.SDWX.audio;
  }

  function getHud() {
    return window.SDWX.hud;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
        const touchDistance = config.FRUITS[levelA].radius * 2 + 3.2;
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

  function collectTripleMetrics(triple) {
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

    return { cx, cy, vx, vy };
  }

  function removeTripleBodies(triple, level) {
    for (const body of triple) {
      getEffects().pushGhost({
        level,
        x: body.position.x,
        y: body.position.y,
        angle: body.angle,
        life: 150,
        maxLife: 150
      });
      physics.removeFruit(body);
    }
  }

  function spawnMergedFruit(level, cx, cy, vx, vy) {
    const nextLevel = level + 1;
    const nextFruit = config.FRUITS[nextLevel];
    const newX = clamp(
      cx,
      config.PLAY_LEFT + nextFruit.radius + 2,
      config.PLAY_RIGHT - nextFruit.radius - 2
    );
    const newY = Math.min(cy, config.PLAY_BOTTOM - nextFruit.radius - 2);
    const newBody = physics.createFruit(nextLevel, newX, newY);

    physics.setVelocity(newBody, {
      x: clamp(vx * 0.24, -2.4, 2.4),
      y: clamp(vy * 0.18 - 1.4, -3.2, 1.2)
    });

    getEffects().addRing(newX, newY, nextFruit.main, 46);
    getAudio().playMergeSound(nextLevel);

    if (nextLevel === config.FRUITS.length - 1) {
      getEffects().pushFloat({
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
        getHud().showToast("大西瓜诞生！再合成三颗可触发瓜王暴击。", 2500);
      }
    }
  }

  function mergeTriple(triple) {
    const level = triple[0].plugin.level;
    const fruit = config.FRUITS[level];
    const { cx, cy, vx, vy } = collectTripleMetrics(triple);
    removeTripleBodies(triple, level);

    if (state.now - state.lastMergeAt < 1650) {
      state.combo += 1;
    } else {
      state.combo = 1;
    }
    state.lastMergeAt = state.now;
    state.totalMerges += 1;

    const multiplier = Math.min(8, Math.max(1, state.combo));
    const isFinal = level === config.FRUITS.length - 1;
    const base = isFinal ? 1500 : (level + 1) * 40;
    const points = scoring.award({ base, multiplier });
    getHud().updateComboUI();
    state.shake = Math.min(10, state.shake + (isFinal ? 10 : 3.5 + level * 0.7));

    getEffects().createBurst(cx, cy, fruit.main, isFinal ? 40 : 22, isFinal ? 3.2 : 1.5);
    getEffects().addRing(cx, cy, fruit.main, isFinal ? 108 : 62);
    getEffects().pushFloat({
      x: cx,
      y: cy - config.FRUITS[level].radius * 0.3,
      text: `+${scoring.formatScore(points)}`,
      color: isFinal ? "#fff3a8" : "#fff9dd",
      life: 780,
      maxLife: 780,
      vy: -0.4
    });

    if (isFinal) {
      getEffects().pushFloat({
        x: cx,
        y: cy - 38,
        text: "瓜王暴击！",
        color: "#fff4a8",
        life: 1100,
        maxLife: 1100,
        vy: -0.22,
        large: true
      });
      getHud().showToast("三颗大西瓜触发瓜王暴击，清出大片空间！", 2200);
      getAudio().playFinalSound();
      return;
    }

    spawnMergedFruit(level, cx, cy, vx, vy);
  }

  function processMerges() {
    if (state.gameOver) return;
    const fruits = [...physics.activeFruits.values()].filter(
      (body) => state.now - body.plugin.bornAt >= 105
    );
    if (fruits.length < 3) return;

    const groups = findComponents(fruits);
    for (let i = 0; i < Math.min(groups.length, 4); i += 1) {
      const triple = pickCompactTriple(groups[i]);
      if (triple && triple.length === 3 && triple.every((body) => physics.activeFruits.has(body.id))) {
        mergeTriple(triple);
      }
    }
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.merge = {
    findComponents,
    pickCompactTriple,
    processMerges,
    mergeTriple
  };
})();
