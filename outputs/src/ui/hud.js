(() => {
  "use strict";

  const config = window.SDWX.config;
  const state = window.SDWX.state.state;
  const nextFruitEl = document.getElementById("nextFruit");
  const nextNameEl = document.getElementById("nextName");
  const comboBadgeEl = document.getElementById("comboBadge");
  const dangerPillEl = document.getElementById("dangerPill");
  const dangerTextEl = document.getElementById("dangerText");
  const toastEl = document.getElementById("toast");
  const soundToggleEl = document.getElementById("soundToggle");
  const mergeLadderEl = document.getElementById("mergeLadder");
  let toastTimer = 0;

  function setMiniFruit(el, level) {
    if (!el || !config.FRUITS[level]) return;
    el.style.setProperty("--fruit-light", config.FRUITS[level].light);
    el.style.setProperty("--fruit-main", config.FRUITS[level].main);
    el.style.setProperty("--fruit-dark", config.FRUITS[level].dark);
    el.style.setProperty("--fruit-glow", config.FRUITS[level].glow);
    el.dataset.level = String(level);
  }

  function buildLadder() {
    mergeLadderEl.innerHTML = "";
    config.FRUITS.forEach((fruit, index) => {
      const row = document.createElement("div");
      row.className = "ladder-step" + (index === config.FRUITS.length - 1 ? " is-final" : "");

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
      mult.textContent = index === config.FRUITS.length - 1 ? "终点" : "×3 →";

      row.append(number, mini, name, mult);
      mergeLadderEl.append(row);
    });
  }

  function setRuleFruits() {
    const triple = document.querySelectorAll(".rule-fruit-1, .rule-fruit-2, .rule-fruit-3");
    triple.forEach((el) => {
      el.style.setProperty("--fruit-light", config.FRUITS[1].light);
      el.style.setProperty("--fruit-main", config.FRUITS[1].main);
      el.style.setProperty("--fruit-dark", config.FRUITS[1].dark);
      el.style.setProperty("--fruit-glow", config.FRUITS[1].glow);
    });
    const next = document.querySelector(".rule-fruit-next");
    if (next) {
      next.style.setProperty("--fruit-light", config.FRUITS[2].light);
      next.style.setProperty("--fruit-main", config.FRUITS[2].main);
      next.style.setProperty("--fruit-dark", config.FRUITS[2].dark);
      next.style.setProperty("--fruit-glow", config.FRUITS[2].glow);
    }
  }

  function updateNextUI() {
    const fruit = config.FRUITS[state.nextLevel];
    setMiniFruit(nextFruitEl, state.nextLevel);
    nextNameEl.textContent = fruit.name;
  }

  function updateComboUI() {
    if (state.combo >= 2 && state.now - state.lastMergeAt < 1700) {
      comboBadgeEl.textContent = `连锁 ×${Math.min(8, state.combo)}`;
      comboBadgeEl.classList.add("is-active");
    } else {
      comboBadgeEl.classList.remove("is-active");
    }
  }

  function updateDanger(hazard) {
    if (hazard > 0.045) {
      dangerPillEl.classList.add("is-active");
      dangerTextEl.textContent = `红线告急 ${Math.round(hazard * 100)}%`;
    } else {
      dangerPillEl.classList.remove("is-active");
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

  function updateSoundButton() {
    soundToggleEl.classList.toggle("is-muted", !state.soundOn);
    soundToggleEl.setAttribute("aria-pressed", String(state.soundOn));
    const label = soundToggleEl.querySelector(".button-label");
    if (label) label.textContent = state.soundOn ? "音效开" : "音效关";
  }

  function reset() {
    dangerPillEl.classList.remove("is-active");
    comboBadgeEl.classList.remove("is-active");
    toastEl.classList.remove("is-visible");
  }

  function hideAlerts() {
    dangerPillEl.classList.remove("is-active");
    comboBadgeEl.classList.remove("is-active");
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.hud = {
    setMiniFruit,
    buildLadder,
    setRuleFruits,
    updateNextUI,
    updateComboUI,
    updateDanger,
    showToast,
    updateSoundButton,
    reset,
    hideAlerts
  };
})();
