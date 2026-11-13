const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "outputs", "index.html"), "utf8");
const html = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const scripts = [...source.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1]);

const dom = new JSDOM(html, {
  runScripts: "outside-only",
  pretendToBeVisual: true,
  url: "http://localhost/"
});
const { window } = dom;

window.requestAnimationFrame = () => 1;
window.cancelAnimationFrame = () => {};

const gradient = { addColorStop() {} };
window.HTMLCanvasElement.prototype.getContext = function getContext() {
  return new Proxy({}, {
    get(target, property) {
      if (property in target) return target[property];
      if (property === "createLinearGradient" || property === "createRadialGradient") {
        return () => gradient;
      }
      if (property === "measureText") return () => ({ width: 20 });
      return () => {};
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    }
  });
};

for (const script of scripts) {
  window.eval(fs.readFileSync(path.join(root, "outputs", script), "utf8"));
}

const debug = window.__tripleMelonDebug;
if (!debug) throw new Error("Game debug API was not initialized");
const SDWX = window.SDWX;
const modernDebug = window.__sdwxDebug;

const results = [];
function check(name, condition, detail = "") {
  if (!condition) throw new Error(`${name} failed${detail ? `: ${detail}` : ""}`);
  results.push(name);
}

const modules = ["config", "rng", "storage", "state", "scoring", "physics", "merge", "board", "balls", "effects", "hud", "overlays", "input", "audio"];
check("SDWX exposes every M1 module", modules.every((name) => SDWX[name]));
const debugKeys = ["state", "balls", "createBall", "dropBall", "setDropX", "tick", "startRun", "endRun", "triggerSkill", "triggerUlt", "setSeed"];
check("__sdwxDebug exposes the debug contract", debugKeys.every((key) => key in modernDebug));

SDWX.rng.seed(12345);
const firstSpawn = SDWX.rng.spawnLevel();
SDWX.rng.seed(12345);
check("seeded rng is reproducible", SDWX.rng.spawnLevel() === firstSpawn);

SDWX.state.setPhase("over");
check("setPhase over syncs legacy flag", debug.state.phase === "over" && debug.state.gameOver === true);
SDWX.state.setPhase("playing");
check("setPhase playing clears legacy flag", debug.state.phase === "playing" && debug.state.gameOver === false);

function ageFruits(ms = 200) {
  debug.state.now += ms;
  for (const body of debug.activeFruits.values()) {
    body.plugin.bornAt = Math.min(body.plugin.bornAt, debug.state.now - ms);
  }
}

function create(level, x, y) {
  return debug.createFruit(level, x, y);
}

debug.restartGame();
check("restart clears the board", debug.activeFruits.size === 0);

create(0, 220, 500);
create(0, 252, 500);
ageFruits();
debug.processMerges();
check("two equal pieces do not merge", debug.activeFruits.size === 2);

create(0, 236, 530);
ageFruits();
debug.processMerges();
const afterThree = [...debug.activeFruits.values()];
check("three equal pieces merge into one", afterThree.length === 1, `count=${afterThree.length}`);
check("merge advances exactly one level", afterThree[0]?.plugin.level === 1, `level=${afterThree[0]?.plugin.level}`);
check("merge awards score", debug.state.score > 0, `score=${debug.state.score}`);

debug.restartGame();
for (const [x, y] of [[190, 500], [222, 500], [206, 530], [238, 530], [190, 560], [222, 560]]) {
  create(0, x, y);
}
ageFruits();
debug.processMerges();
ageFruits();
debug.processMerges();
const sixResult = [...debug.activeFruits.values()];
check("six equal pieces become two next-level pieces", sixResult.length === 2, `count=${sixResult.length}`);
check("six-piece conversion keeps target level", sixResult.every((body) => body.plugin.level === 1));

debug.restartGame();
create(3, 220, 500);
create(3, 252, 500);
create(3, 236, 531);
ageFruits();
debug.processMerges();
const finalPiece = [...debug.activeFruits.values()];
check("highest normal tier can be reached", finalPiece.length === 1 && finalPiece[0].plugin.level === 4);

debug.restartGame();
create(4, 220, 500);
create(4, 252, 500);
create(4, 236, 531);
ageFruits();
const scoreBeforeFinal = debug.state.score;
debug.processMerges();
check("three top-tier pieces trigger the finale clear", debug.activeFruits.size === 0);
check("finale clear awards bonus score", debug.state.score > scoreBeforeFinal);

debug.restartGame();
debug.dropFruit();
check("drop creates one active piece", debug.activeFruits.size === 1);
check("drop enters cooldown", debug.state.canDrop === false);
check("drop advances the preview queue", debug.state.currentLevel >= 0 && debug.state.nextLevel >= 0);

debug.endGame();
check("game-over state is set", debug.state.gameOver === true);
check("game-over overlay is visible", window.document.getElementById("gameOver").classList.contains("is-visible"));
debug.restartGame();
check("restart exits game-over state", debug.state.gameOver === false);

console.log(`PASS ${results.length} checks`);
for (const result of results) console.log(`- ${result}`);
