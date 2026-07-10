#!/usr/bin/env node
/**
 * Copies static assets into the Next.js standalone output folder.
 * Run after `next build` when deploying to Namecheap VPS / self-hosted Node.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = path.join(root, ".next", "standalone");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");

if (!existsSync(standaloneDir)) {
  console.error("Missing .next/standalone — run `npm run build` first.");
  process.exit(1);
}

if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true });
  console.log("✓ Copied public/ → .next/standalone/public/");
}

if (existsSync(staticDir)) {
  const target = path.join(standaloneDir, ".next", "static");
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(staticDir, target, { recursive: true });
  console.log("✓ Copied .next/static → .next/standalone/.next/static/");
}

console.log("Standalone bundle ready:", standaloneDir);
