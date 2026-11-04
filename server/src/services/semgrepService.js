import { execFile } from "child_process";
import { promisify } from "util";
import {
  mkdtemp,
  writeFile,
  rm,
  chmod,
} from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const execFileAsync = promisify(execFile);

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const RULES_PATH = path.resolve(
  currentDirectory,
  "../../semgrep-rules.yml"
);

const SEMGREP_BIN =
  process.env.SEMGREP_BIN ||
  (process.platform === "win32"
    ? "semgrep"
    : path.resolve(currentDirectory, "../../.venv/bin/semgrep"));

const MAX_CODE_SIZE = 100 * 1024;
const MAX_OUTPUT_SIZE = 10 * 1024 * 1024;
const SCAN_TIMEOUT = 30 * 1000;

const LANGUAGE_CONFIG = {
  javascript: "js",
  typescript: "ts",
  python: "py",
};

const SEVERITY_MAP = {
  ERROR: "high",
  WARNING: "medium",
  INFO: "low",
};

const getSummary = (findings) => {
  const summary = {
    totalFindings: findings.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const finding of findings) {
    summary[finding.severity] += 1;
  }

  return summary;
};

const normalizeFinding = (result, sourceCode) => {
  const extra = result.extra || {};
  const metadata = extra.metadata || {};

  const startLine = result.start?.line || 1;
  const endLine = result.end?.line || startLine;

  const sourceLines = sourceCode.split(/\r?\n/);

  const codeSnippet = sourceLines
    .slice(startLine - 1, endLine)
    .join("\n")
    .slice(0, 10000);

  const rawCwe = metadata.cwe || [];
  const rawOwasp = metadata.owasp || [];

  return {
    ruleId: result.check_id || "unknown-rule",

    title: (extra.message || "Security issue detected.")
      .split("\n")[0]
      .slice(0, 200),

    severity: SEVERITY_MAP[extra.severity] || "info",

    category: metadata.category || "Security",

    cwe: Array.isArray(rawCwe) ? rawCwe : [rawCwe],

    owasp: Array.isArray(rawOwasp)
      ? rawOwasp.join(", ")
      : rawOwasp,

    description:
      extra.message || "Semgrep detected a potential security issue.",

    filePath: "input",

    startLine,
    endLine,

    startColumn: result.start?.col || null,
    endColumn: result.end?.col || null,

    codeSnippet,

    recommendation: metadata.remediation || null,

    suggestedFix: extra.fix || null,
  };
};

const runSemgrep = async (sourcePath, workingDirectory) => {
  const args = [
    "scan",
    "--config",
    RULES_PATH,
    "--json",
    "--metrics=off",
    "--disable-version-check",
    "--quiet",
    sourcePath,
  ];

  try {
    const result = await execFileAsync(SEMGREP_BIN, args, {
      cwd: workingDirectory,
      timeout: SCAN_TIMEOUT,
      maxBuffer: MAX_OUTPUT_SIZE,
      windowsHide: true,
      encoding: "utf8",
      killSignal: "SIGTERM",
    });

    return result.stdout;
  } catch (error) {
    
    
    if (
      error.killed ||
      error.code === "ETIMEDOUT"
    ) {
      throw new Error("Semgrep scan exceeded the time limit.");
    }

    
    
    if (error.code === "ENOENT") {
      throw new Error("Semgrep is not installed or unavailable.");
    }

    
    
    if (
      typeof error.stdout === "string" &&
      error.stdout.trim()
    ) {
      return error.stdout;
    }

    throw new Error("Semgrep execution failed.");
  }
};

export const scanSourceCode = async ({ code, language }) => {
  if (typeof code !== "string" || !code.trim()) {
    throw new Error("Source code cannot be empty.");
  }

  if (Buffer.byteLength(code, "utf8") > MAX_CODE_SIZE) {
    throw new Error("Source code cannot exceed 100 KB.");
  }

  const extension = LANGUAGE_CONFIG[language];

  if (!extension) {
    throw new Error("Unsupported programming language.");
  }

  let workingDirectory;

  try {
    
    workingDirectory = await mkdtemp(
      path.join(os.tmpdir(), "securecode-")
    );

    
    await chmod(workingDirectory, 0o700);

    const sourcePath = path.join(
      workingDirectory,
      `input.${extension}`
    );

    
    await writeFile(sourcePath, code, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });

    const output = await runSemgrep(
      sourcePath,
      workingDirectory
    );

    let parsedOutput;

    try {
      parsedOutput = JSON.parse(output);
    } catch {
      throw new Error("Unable to parse Semgrep scan results.");
    }

    if (!Array.isArray(parsedOutput.results)) {
      throw new Error("Invalid Semgrep response format.");
    }

    const findings = parsedOutput.results.map((result) =>
      normalizeFinding(result, code)
    );

    return {
      engine: "Semgrep",
      findings,
      summary: getSummary(findings),
    };
  } finally {
    
    if (workingDirectory) {
      await rm(workingDirectory, {
        recursive: true,
        force: true,
      });
    }
  }
};
