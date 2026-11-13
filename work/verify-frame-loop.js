const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "outputs", "index.html"), "utf8")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true, url: "http://localhost/" });
const { window } = dom;
let queue = [];
window.requestAnimationFrame = (cb) => { queue.push(cb); return queue.length; };
window.cancelAnimationFrame = () => {};
const gradient = { addColorStop() {} };
window.HTMLCanvasElement.prototype.getContext = function getContext() {
  const state = {};
  return new Proxy(state, {
    get(target, property) {
      if (property in target) return target[property];
      if (property === "createLinearGradient" || property === "createRadialGradient") return () => gradient;
      if (property === "measureText") return () => ({ width: 20 });
      return () => {};
    },
    set(target, property, value) { target[property] = value; return true; }
  });
};
window.eval(fs.readFileSync(path.join(root, "outputs", "lib", "matter.min.js"), "utf8"));
window.eval(fs.readFileSync(path.join(root, "outputs", "game.js"), "utf8"));
const debug = window.__tripleMelonDebug;
let now = window.performance.now();
function tick(frames) {
  for (let i = 0; i < frames; i += 1) {
    now += 16.667;
    const callbacks = queue;
    queue = [];
    for (const callback of callbacks) callback(now);
  }
}
tick(2);
for (let i = 0; i < 24; i += 1) {
  debug.setDropX(70 + ((i * 47) % 340));
  debug.state.canDrop = true;
  debug.state.cooldownUntil = 0;
  debug.dropFruit();
  tick(18);
  if (debug.state.gameOver) break;
}
tick(120);
console.log(`PASS frame loop: fruits=${debug.activeFruits.size}, score=${debug.state.score}, gameOver=${debug.state.gameOver}`);