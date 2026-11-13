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

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.config = {
    W,
    H,
    DANGER_Y,
    DROP_Y,
    FIXED_STEP,
    PLAY_LEFT,
    PLAY_RIGHT,
    PLAY_BOTTOM,
    MAX_EFFECTS,
    FRUITS,
    SPAWN_POOL
  };
})();
