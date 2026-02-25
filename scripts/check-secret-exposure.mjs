import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const blockedFilenames = [
  "cookies.txt",
  "temp_token.txt",
  ".env",
  ".env.local",
  ".env.production",
  ".env.staging"
];

const blockedPatterns = [
  /AKIA[0-9A-Z]{16}/, // aws access key id
  /-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----/,
  /(postgres|mysql|mongodb|redis):\/\/[^\s'"]+/i,
  /(password|passwd|pwd|token|secret)\s*[:=]\s*["']?[^\s"']{8,}/i
];

const excludedDirs = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage"
]);

const allowlistedFiles = new Set([
  "apps/api/src/config/env.ts"
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".git")) continue;
    if (excludedDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return [
    ".ts",
    ".js",
    ".json",
    ".yml",
    ".yaml",
    ".md",
    ".txt",
    ".env",
    ".sh",
    ".ps1"
  ].includes(ext) || path.basename(filePath).startsWith(".env");
}

function main() {
  const allFiles = walk(root);
  const violations = [];

  for (const file of allFiles) {
    const relative = path.relative(root, file).replace(/\\/g, "/");
    const base = path.basename(file);

    if (allowlistedFiles.has(relative)) {
      continue;
    }

    if (blockedFilenames.includes(base)) {
      violations.push(`Blocked file name detected: ${relative}`);
      continue;
    }

    if (!isTextFile(file)) continue;

    const content = fs.readFileSync(file, "utf8");
    for (const pattern of blockedPatterns) {
      if (pattern.test(content)) {
        if (relative.startsWith("config/env/.env") && relative.endsWith(".example")) {
          continue;
        }
        violations.push(`Sensitive pattern matched in ${relative}: ${pattern}`);
      }
    }
  }

  if (violations.length > 0) {
    console.error("Secret exposure scan failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Secret exposure scan passed.");
}

main();
