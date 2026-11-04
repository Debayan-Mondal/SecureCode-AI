
import { useRef, useState } from "react";
import {
  Code2,
  FileCode2,
  ShieldCheck,
  Play,
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  Bug,
  Upload,
  X,
  FileText,
} from "lucide-react";

import {
  Button,
  Input,
  Label,
  Select,
  ListBox,
} from "@heroui/react";

import CodeEditor from "../components/scanner/CodeEditor";
import { useUIStore } from "../stores/useUIStore";
import api from "../lib/axios";

const MAX_CODE_SIZE = 100 * 1024;

const starterCode = {
  javascript: `// Welcome to SecureCode AI
// Paste your JavaScript code here to scan for vulnerabilities.

const express = require("express");
const app = express();

app.get("/search", (req, res) => {
  const query = req.query.q;

  // Example: Potentially unsafe SQL query
  const sql = "SELECT * FROM users WHERE name = '" + query + "'";

  res.send(sql);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});`,

  typescript: `// Welcome to SecureCode AI
// Paste your TypeScript code here to scan for vulnerabilities.

import express, { Request, Response } from "express";

const app = express();

app.get("/search", (req: Request, res: Response) => {
  const query = req.query.q;

  // Example: Potentially unsafe SQL query
  const sql = "SELECT * FROM users WHERE name = '" + query + "'";

  res.send(sql);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});`,

  python: `# Welcome to SecureCode AI
# Paste your Python code here to scan for vulnerabilities.

import subprocess
import pickle

def search_user(query):
    # Example: Potentially unsafe command execution
    result = subprocess.run(
        query,
        shell=True,
        capture_output=True,
        text=True
    )

    return result.stdout

def load_data(data):
    # Example: Unsafe deserialization
    return pickle.loads(data)
`,
};

const languages = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
];

const severityStyles = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  info: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const summaryItems = [
  { key: "critical", label: "Critical", color: "text-red-500" },
  { key: "high", label: "High", color: "text-orange-500" },
  { key: "medium", label: "Medium", color: "text-amber-500" },
  { key: "low", label: "Low", color: "text-blue-500" },
  { key: "info", label: "Info", color: "text-gray-500" },
];

export default function NewScanPage() {
  const theme = useUIStore((state) => state.theme);

  const fileInputRef = useRef(null);

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCode.javascript);
  const [scanName, setScanName] = useState("My Security Scan");

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");

  const lineCount = code.split("\n").length;
  const byteCount = new TextEncoder().encode(code).length;

  const getLanguageFromFile = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();

    const extensionMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
    };

    return extensionMap[extension] || null;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    
    event.target.value = "";

    if (!file) return;

    setUploadError("");
    setError("");
    setScanResult(null);

    const detectedLanguage = getLanguageFromFile(file.name);

    if (!detectedLanguage) {
      setUploadError(
        "Unsupported file type. Upload a JavaScript, TypeScript, or Python file."
      );
      return;
    }

    if (file.size > MAX_CODE_SIZE) {
      setUploadError("File exceeds the maximum allowed size of 100 KB.");
      return;
    }

    try {
      const fileContents = await file.text();

      if (!fileContents.trim()) {
        setUploadError("The selected file is empty.");
        return;
      }

      setCode(fileContents);
      setLanguage(detectedLanguage);

      setUploadedFile({
        name: file.name,
        size: file.size,
        language: detectedLanguage,
      });
    } catch {
      setUploadError("Unable to read this file. Please try another file.");
    }
  };

  const handleRemoveUploadedFile = () => {
    
    setUploadedFile(null);
    setUploadError("");
  };

  const handleLanguageChange = (selectedLanguage) => {
    if (!selectedLanguage || selectedLanguage === language) return;

    setLanguage(selectedLanguage);
    setCode(starterCode[selectedLanguage]);
    setUploadedFile(null);
    setUploadError("");
    setScanResult(null);
    setError("");
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setScanResult(null);
    setError("");
  };

  const handleScan = async () => {
    setError("");
    setScanResult(null);

    if (!code.trim()) {
      setError("Please enter some code before starting the scan.");
      return;
    }

    if (byteCount > MAX_CODE_SIZE) {
      setError("Your code exceeds the 100 KB size limit.");
      return;
    }

    setIsScanning(true);

    try {
      const response = await api.post("/scans", {
      name: scanName.trim() || "Untitled Scan",
      language,
      code,
      sourceType: uploadedFile ? "upload" : "editor",
      fileName: uploadedFile?.name || null,
    });

      setScanResult(response.data);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to complete the security scan. Please try again.";

      setError(message);
    } finally {
      setIsScanning(false);
    }
  };

  const summary = scanResult?.scan?.summary || {};
  const findings = scanResult?.findings || [];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">

      {}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Code2 size={19} className="text-[var(--primary)]" />

            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              Code Analysis
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            New Security Scan
          </h1>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Analyze your source code for security vulnerabilities.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>

          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Semgrep Engine Ready
          </span>
        </div>
      </div>

      {}
      <div className="overflow-visible rounded-2xl border border-[var(--border)] bg-[var(--surface)]">

        {}
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] p-4 lg:flex-row lg:items-end">

          <div className="flex flex-1 flex-col gap-2">
            <Label
              htmlFor="scan-name"
              className="text-xs font-medium text-[var(--text-secondary)]"
            >
              Scan Name
            </Label>

            <Input
              id="scan-name"
              value={scanName}
              onChange={(event) => setScanName(event.target.value)}
              placeholder="Enter a name for this scan"
              maxLength={100}
              variant="secondary"
              className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-sm text-[var(--text-primary)]"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileCode2
                size={16}
                className="text-[var(--text-muted)]"
              />

              <Select
                aria-label="Select programming language"
                value={language}
                onChange={handleLanguageChange}
                variant="secondary"
                className="w-[160px]"
              >
                <Select.Trigger
                  className="min-h-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-[var(--text-primary)] shadow-none"
                >
                  <Select.Value className="text-xs font-medium text-[var(--text-primary)]" />
                  <Select.Indicator className="text-[var(--text-muted)]" />
                </Select.Trigger>

                <Select.Popover
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
                >
                  <ListBox className="p-1 text-[var(--text-primary)]">
                    {languages.map((item) => (
                      <ListBox.Item
                        key={item.id}
                        id={item.id}
                        textValue={item.label}
                        className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                      >
                        <Label className="text-[var(--text-primary)]">
                          {item.label}
                        </Label>

                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
        </div>

        {}
        <div className="border-b border-[var(--border)] p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".js,.jsx,.ts,.tsx,.py"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText
                  size={16}
                  className="text-[var(--primary)]"
                />

                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Upload source file
                </p>
              </div>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Supported: JS, JSX, TS, TSX and PY · Maximum 100 KB
              </p>
            </div>

            <Button
              variant="secondary"
              onPress={() => fileInputRef.current?.click()}
              isDisabled={isScanning}
              size="sm"
            >
              <Upload size={15} />
              Choose File
            </Button>
          </div>

          {uploadedFile && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                  <FileCode2
                    size={18}
                    className="text-[var(--primary)]"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {uploadedFile.name}
                  </p>

                  <p className="text-xs text-[var(--text-muted)]">
                    {uploadedFile.language.toUpperCase()} ·{" "}
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              <Button
                isIconOnly
                variant="tertiary"
                size="sm"
                aria-label="Remove uploaded file"
                onPress={handleRemoveUploadedFile}
                isDisabled={isScanning}
              >
                <X size={16} />
              </Button>
            </div>
          )}

          {uploadError && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>{uploadError}</p>
            </div>
          )}
        </div>

        {}
        <div className="p-3 sm:p-4">
          <CodeEditor
            code={code}
            onChange={handleCodeChange}
            language={language}
            theme={theme}
          />
        </div>

        {}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            <span>
              Language:{" "}
              <span className="font-medium text-[var(--text-secondary)]">
                {language.charAt(0).toUpperCase() + language.slice(1)}
              </span>
            </span>

            <span>
              Lines:{" "}
              <span className="font-medium text-[var(--text-secondary)]">
                {lineCount}
              </span>
            </span>

            <span>
              Size:{" "}
              <span className="font-medium text-[var(--text-secondary)]">
                {(byteCount / 1024).toFixed(2)} KB
              </span>
            </span>
          </div>

          <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <ShieldCheck size={14} className="text-emerald-500" />
            Your code is analyzed, never executed
          </span>
        </div>
      </div>

      {}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-[var(--text-muted)]">
          Maximum supported source code size: 100 KB
        </div>

        <Button
          onPress={handleScan}
          isPending={isScanning}
          isDisabled={
            isScanning ||
            !code.trim() ||
            byteCount > MAX_CODE_SIZE
          }
          size="lg"
          className="w-full sm:w-auto"
        >
          {isScanning ? (
            <>
              <LoaderCircle size={17} className="animate-spin" />
              Scanning Code...
            </>
          ) : (
            <>
              <Play size={17} />
              Run Security Scan
            </>
          )}
        </Button>
      </div>

      {}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4"
        >
          <AlertTriangle
            size={19}
            className="mt-0.5 shrink-0 text-red-500"
          />

          <div>
            <p className="text-sm font-semibold text-red-500">
              Scan Failed
            </p>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {error}
            </p>
          </div>
        </div>
      )}

      {}
      {scanResult && (
        <div className="space-y-5">

          {}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={20}
                  className="text-emerald-500"
                />

                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Scan Results
                </h2>
              </div>

              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {scanResult.scan?.name || scanName}
                {" · "}
                {scanResult.scan?.language || language}
              </p>
            </div>

            <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
              {scanResult.scan?.status || "completed"}
            </span>
          </div>

          {}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                <Bug
                  size={20}
                  className="text-[var(--primary)]"
                />
              </div>

              <div>
                <p className="text-xs text-[var(--text-muted)]">
                  Total Vulnerabilities Found
                </p>

                <p className="text-3xl font-bold text-[var(--text-primary)]">
                  {summary.totalFindings ?? findings.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {summaryItems.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3"
                >
                  <p className="text-xs text-[var(--text-muted)]">
                    {item.label}
                  </p>

                  <p className={`mt-1 text-2xl font-bold ${item.color}`}>
                    {summary[item.key] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Detected Vulnerabilities
              </h3>

              <span className="text-xs text-[var(--text-muted)]">
                {findings.length} findings
              </span>
            </div>

            {findings.length === 0 ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                <CheckCircle2
                  size={32}
                  className="mx-auto text-emerald-500"
                />

                <h4 className="mt-3 font-semibold text-[var(--text-primary)]">
                  No vulnerabilities detected
                </h4>

                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Semgrep did not identify any issues using the configured rules.
                </p>
              </div>
            ) : (
              findings.map((finding, index) => {
                const severity = (
                  finding.severity || "info"
                ).toLowerCase();

                return (
                  <div
                    key={finding._id || `${finding.ruleId}-${index}`}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              severityStyles[severity] ||
                              severityStyles.info
                            }`}
                          >
                            {severity}
                          </span>

                          <span className="text-xs text-[var(--text-muted)]">
                            {finding.ruleId}
                          </span>
                        </div>

                        <h4 className="font-semibold text-[var(--text-primary)]">
                          {finding.title}
                        </h4>
                      </div>

                      <span className="w-fit shrink-0 rounded-md bg-[var(--surface-soft)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)]">
                        Line {finding.startLine}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                      <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1">
                        {finding.filePath}
                      </span>

                      {finding.category && (
                        <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1">
                          {finding.category}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {finding.description}
                    </p>

                    {finding.recommendation && (
                      <div className="mt-4 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-3">
                        <p className="mb-1 text-xs font-semibold text-[var(--primary)]">
                          Recommended Remediation
                        </p>

                        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                          {finding.recommendation}
                        </p>
                      </div>
                    )}

                    {finding.suggestedFix && (
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">
                          Suggested Fix
                        </p>

                        <pre className="overflow-x-auto rounded-lg bg-[var(--surface-soft)] p-3 text-xs leading-relaxed text-[var(--text-primary)]">
                          <code>{finding.suggestedFix}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {}
      <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <ShieldCheck
          size={19}
          className="mt-0.5 shrink-0 text-[var(--primary)]"
        />

        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Secure Code Analysis
          </h3>

          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            SecureCode AI uses static analysis to inspect your source code.
            Your submitted code is not executed during the scanning process.
            Avoid including passwords, API keys, or other sensitive credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
