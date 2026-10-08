#!/usr/bin/env node
/**
 * Manual helper (not a build step).
 * Usage: node scripts/set-base-url.mjs https://synlig14.no
 * Replaces the site base URL in HTML, sitemap.xml, robots.txt, llms.txt and JSON-LD.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const next = (process.argv[2] || "").replace(/\/$/, "");
if (!/^https:\/\/[^\s/]+/.test(next)) {
  console.error("Usage: node scripts/set-base-url.mjs https://example.com");
  process.exit(1);
}

const configPath = path.join(root, "site.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const prev = String(config.BASE_URL || "").replace(/\/$/, "");
if (!prev) {
  console.error("BASE_URL missing in site.config.json");
  process.exit(1);
}

config.BASE_URL = next;
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");

const targets = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(html|xml|txt)$/i.test(name)) targets.push(full);
  }
}
walk(root);

let changed = 0;
for (const file of targets) {
  const before = fs.readFileSync(file, "utf8");
  if (!before.includes(prev)) continue;
  const after = before.split(prev).join(next);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
  }
}

console.log(`BASE_URL: ${prev} → ${next}`);
console.log(`Updated ${changed} file(s) + site.config.json`);
