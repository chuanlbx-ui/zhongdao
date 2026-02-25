import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const workspaceRoot = process.cwd();

const requiredFiles = [
  "CHANGELOG.md",
  "README.md",
  "SECURITY.md",
  "docs/governance/release-checklist.md",
  "docs/governance/branch-and-release-strategy.md",
  "docs/governance/critical-smoke-checklist.md",
  "docs/governance/stability-playbook.md",
  "docs/governance/adr/README.md",
  "docs/governance/adr/0001-stability-governance.md",
  ".github/pull_request_template.md",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/workflows/ci-quality.yml",
  ".github/workflows/security-guard.yml",
  "apps/api/docs/openapi.yaml",
  "config/env/env.schema.json"
];

function getMissingFiles() {
  return requiredFiles.filter((relativePath) => {
    const fullPath = path.join(workspaceRoot, relativePath);
    return !fs.existsSync(fullPath);
  });
}

function validateChangelog() {
  const changelogPath = path.join(workspaceRoot, "CHANGELOG.md");
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const hasUnreleased = /^## \[Unreleased\]/m.test(changelog);
  const hasVersionSection = /^## \[\d+\.\d+\.\d+\] - \d{4}-\d{2}-\d{2}/m.test(changelog);

  if (!hasUnreleased) {
    throw new Error("CHANGELOG.md must include an [Unreleased] section.");
  }

  if (!hasVersionSection) {
    throw new Error("CHANGELOG.md must include at least one released version entry.");
  }
}

function validateEnvExamples() {
  const schemaPath = path.join(workspaceRoot, "config/env/env.schema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const requiredKeys = schema.required ?? [];

  const envFiles = [
    "config/env/.env.example",
    "config/env/.env.staging.example",
    "config/env/.env.prod.example"
  ];

  for (const file of envFiles) {
    const fullPath = path.join(workspaceRoot, file);
    const content = fs.readFileSync(fullPath, "utf8");
    for (const key of requiredKeys) {
      const exists = new RegExp(`^${key}=`, "m").test(content);
      if (!exists) {
        throw new Error(`${file} is missing required key: ${key}`);
      }
    }
  }
}

function main() {
  const missingFiles = getMissingFiles();
  if (missingFiles.length > 0) {
    console.error("Missing required release-governance files:");
    for (const file of missingFiles) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  }

  validateChangelog();
  validateEnvExamples();
  console.log("Release-readiness checks passed.");
}

main();
