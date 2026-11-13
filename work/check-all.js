const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "lib") continue;
      files.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}

function run(label, args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NODE_OPTIONS: "" }
  });
  if (result.status !== 0) {
    console.error(`FAIL ${label}`);
    process.exit(result.status || 1);
  }
  console.log(`PASS ${label}`);
}

const sources = walk(path.join(root, "outputs")).concat(walk(path.join(root, "work")));
const uniqueSources = [...new Set(sources)]
  .filter((file) => !file.endsWith(`${path.sep}check-all.js`))
  .sort();

console.log(`Syntax check: ${uniqueSources.length} files`);
for (const file of uniqueSources) {
  const relative = path.relative(root, file);
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    console.error(`FAIL syntax ${relative}`);
    if (result.stderr) console.error(result.stderr.trim());
    process.exit(result.status || 1);
  }
}
console.log("PASS", "syntax");

const verifyDir = path.join(root, "work");
const verifyFiles = fs.readdirSync(verifyDir)
  .filter((name) => name.startsWith("verify-") && name.endsWith(".js"))
  .sort();

for (const name of verifyFiles) {
  run(name, [path.join("work", name)]);
}

console.log(`PASS check-all (${verifyFiles.length} verify scripts)`);

