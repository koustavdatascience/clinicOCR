import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const patterns = [
  /AQ\.[A-Za-z0-9_-]{16,}/,
  /npg_[A-Za-z0-9]+/,
  /AIza[A-Za-z0-9_-]{20,}/,
  /postgres(?:ql)?:\/\/[^\s]+@/,
];

const trackedFiles = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter(file => !file.endsWith(".lock"));

const findings = trackedFiles.filter(file => {
  try {
    const content = readFileSync(file, "utf8");
    return patterns.some(pattern => pattern.test(content));
  } catch {
    return false;
  }
});

if (findings.length > 0) {
  console.error(`Credential-shaped content found in tracked file(s): ${findings.join(", ")}`);
  process.exit(1);
}

console.log("Secret scan passed: no credential-shaped values found in tracked source files.");
