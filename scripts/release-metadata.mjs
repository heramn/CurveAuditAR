import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
let commit = process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
try {
  if (commit === "unknown")
    commit = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
} catch {}
await writeFile(
  "public/release.json",
  JSON.stringify({
    commit,
    builtAt: new Date().toISOString(),
    methodVersion: "1.0.0",
  }),
);
