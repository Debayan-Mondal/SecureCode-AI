import "dotenv/config";
import { explainFindingWithAI } from "./src/services/geminiService.js";

const testFinding = {
  ruleId: "securecode.javascript.dynamic-eval",
  title: "Dynamic code execution using eval()",
  severity: "high",
  category: "Code Injection",
  cwe: ["CWE-95"],
  owasp: "A03:2021 - Injection",
  description: "Using eval() with potentially untrusted input can allow arbitrary code execution.",
  filePath: "test.js",
  startLine: 5,
  endLine: 5,
  codeSnippet: `
const expression = req.query.expression;
const result = eval(expression);
res.send(String(result));
`,
  recommendation: "Avoid eval() and use a safe alternative.",
};

try {
  console.log("Testing Gemini API connection...\n");

  const result = await explainFindingWithAI(
    testFinding,
    "javascript"
  );

  console.log("Gemini analysis successful!\n");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Gemini test failed:", error.message);
  process.exitCode = 1;
}