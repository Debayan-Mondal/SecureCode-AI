
import Editor from "@monaco-editor/react";

export default function CodeEditor({
  code,
  onChange,
  language,
  theme,
}) {
  const editorLanguage = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      <Editor
        height="480px"
        language={editorLanguage[language] || "javascript"}
        theme={theme === "dark" ? "vs-dark" : "light"}
        value={code}
        onChange={(value) => onChange(value || "")}
        options={{
          automaticLayout: true,
          minimap: {
            enabled: false,
          },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          padding: {
            top: 18,
            bottom: 18,
          },
          renderLineHighlight: "all",
          roundedSelection: true,
          cursorBlinking: "smooth",
          smoothScrolling: true,
          folding: true,
          contextmenu: true,
        }}
      />
    </div>
  );
}
