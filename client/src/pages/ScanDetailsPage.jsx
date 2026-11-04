
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  Download,
  FileCode2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button, Card, Chip } from "@heroui/react";

import api from "../lib/axios";

const severityColors = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "accent",
  info: "default",
};

const statusColors = {
  completed: "success",
  running: "accent",
  pending: "warning",
  failed: "danger",
};

const findingStatusColors = {
  open: "danger",
  fixed: "success",
  ignored: "default",
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (duration) => {
  if (!duration) return "—";

  return duration < 1000
    ? `${duration} ms`
    : `${(duration / 1000).toFixed(2)} seconds`;
};

const getLanguageLabel = (language) => {
  const languages = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
  };

  return languages[language] || language || "Unknown";
};

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <Card className="min-w-0">
      <Card.Content className="flex flex-row items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">
            {label}
          </p>

          <p className={`mt-2 text-3xl font-bold ${color}`}>
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-[var(--surface-container)] p-3">
          <Icon size={21} className={color} />
        </div>
      </Card.Content>
    </Card>
  );
}

export default function ScanDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [copiedFinding, setCopiedFinding] = useState(null);

  const [aiLoadingFinding, setAiLoadingFinding] = useState(null);
  const [fixLoadingFinding, setFixLoadingFinding] = useState(null);

  const [aiErrors, setAiErrors] = useState({});
  const [fixErrors, setFixErrors] = useState({});

  const [statusLoadingFinding, setStatusLoadingFinding] = useState(null);
  const [statusErrors, setStatusErrors] = useState({});

  const [reportDownloading, setReportDownloading] = useState(false);
  const [reportError, setReportError] = useState("");

  
  const loadScanDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const [scanResponse, findingsResponse] = await Promise.all([
        api.get(`/scans/${id}`),
        api.get(`/scans/${id}/findings`),
      ]);

      setScan(scanResponse.data.scan || scanResponse.data);

      setFindings(
        findingsResponse.data.findings ||
          findingsResponse.data.results ||
          []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load scan details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScanDetails();
  }, [id]);

  
  const handleDownloadReport = async () => {
    if (reportDownloading || scan?.status !== "completed") return;

    setReportDownloading(true);
    setReportError("");

    try {
      const response = await api.get(`/scans/${id}/report`, {
        responseType: "blob",
      });

      const disposition = response.headers["content-disposition"];

      const filenameMatch = disposition?.match(
        /filename="?([^";]+)"?/i
      );

      const filename =
        filenameMatch?.[1] || `securecode-report-${id}.pdf`;

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (err) {
      let message =
        "Unable to download the security report. Please try again.";

      if (err.response?.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text();
          const parsedError = JSON.parse(errorText);

          message = parsedError.message || message;
        } catch {
        }
      } else {
        message = err.response?.data?.message || message;
      }

      setReportError(message);
      console.error("Report download error:", err);
    } finally {
      setReportDownloading(false);
    }
  };

  const copyCode = async (code, findingId) => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);

      setCopiedFinding(findingId);

      setTimeout(() => {
        setCopiedFinding(null);
      }, 2000);
    } catch {
      setError("Unable to copy code to clipboard.");
    }
  };

  const updateFindingStatus = async (findingId, status) => {
    if (!findingId || statusLoadingFinding) return;

    setStatusLoadingFinding(findingId);

    setStatusErrors((previous) => ({
      ...previous,
      [findingId]: "",
    }));

    try {
      const response = await api.patch(
        `/scans/${id}/findings/${findingId}/status`,
        { status }
      );

      const updatedStatus = response.data.finding.status;

      setFindings((previous) =>
        previous.map((finding) =>
          finding._id === findingId
            ? {
                ...finding,
                status: updatedStatus,
              }
            : finding
        )
      );
    } catch (err) {
      setStatusErrors((previous) => ({
        ...previous,
        [findingId]:
          err.response?.data?.message ||
          "Unable to update finding status. Please try again.",
      }));
    } finally {
      setStatusLoadingFinding(null);
    }
  };

  const analyzeFinding = async (findingId) => {
    if (!findingId || aiLoadingFinding || fixLoadingFinding) return;

    setAiLoadingFinding(findingId);

    setAiErrors((previous) => ({
      ...previous,
      [findingId]: "",
    }));

    try {
      const response = await api.post(`/ai/explain/${findingId}`);

      const analysis = response.data.analysis;

      if (!analysis) {
        throw new Error("Gemini returned an incomplete analysis.");
      }

      setFindings((previous) =>
        previous.map((finding) =>
          finding._id === findingId
            ? {
                ...finding,
                aiExplanation:
                  analysis.explanation || finding.aiExplanation,
                aiImpact:
                  analysis.impact || finding.aiImpact,
                recommendation:
                  analysis.recommendation || finding.recommendation,
                suggestedFix:
                  analysis.suggestedFix || finding.suggestedFix,
                aiAnalyzedAt: new Date().toISOString(),
              }
            : finding
        )
      );
    } catch (err) {
      setAiErrors((previous) => ({
        ...previous,
        [findingId]:
          err.response?.data?.message ||
          err.message ||
          "Unable to generate AI analysis. Please try again.",
      }));
    } finally {
      setAiLoadingFinding(null);
    }
  };

  const generateAIFix = async (findingId) => {
    if (!findingId || fixLoadingFinding || aiLoadingFinding) return;

    setFixLoadingFinding(findingId);

    setFixErrors((previous) => ({
      ...previous,
      [findingId]: "",
    }));

    try {
      const response = await api.post(`/ai/fix/${findingId}`, {
        regenerate: true,
      });

      const analysis = response.data.analysis;

      if (!analysis) {
        throw new Error("Gemini returned an incomplete fix response.");
      }

      const suggestedFix = analysis.suggestedFix?.trim();

      if (!suggestedFix) {
        throw new Error(
          "Gemini could not generate a reliable secure replacement. Review the remediation recommendation or try again."
        );
      }

      setFindings((previous) =>
        previous.map((finding) =>
          finding._id === findingId
            ? {
                ...finding,
                recommendation:
                  analysis.recommendation || finding.recommendation,
                suggestedFix,
              }
            : finding
        )
      );
    } catch (err) {
      setFixErrors((previous) => ({
        ...previous,
        [findingId]:
          err.response?.data?.message ||
          err.message ||
          "Unable to generate a secure code replacement.",
      }));
    } finally {
      setFixLoadingFinding(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw
          size={28}
          className="animate-spin text-indigo-500"
        />

        <p className="text-sm text-[var(--muted-foreground)]">
          Loading scan details...
        </p>
      </div>
    );
  }

  if (error && !scan) {
    return (
      <div className="space-y-5">
        <Button
          variant="secondary"
          onPress={() => navigate("/history")}
        >
          <ArrowLeft size={16} />
          Back to History
        </Button>

        <Card>
          <Card.Content className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertTriangle size={30} className="text-red-500" />

            <Card.Title>Unable to load scan</Card.Title>

            <Card.Description>{error}</Card.Description>

            <Button
              variant="secondary"
              onPress={loadScanDetails}
            >
              <RefreshCw size={16} />
              Try Again
            </Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  if (!scan) return null;

  const summary = scan.summary || {};
  const totalFindings = summary.totalFindings ?? findings.length;

  return (
    <div className="space-y-7 pb-10">
      
      <div className="space-y-4">
        <Button
          variant="tertiary"
          className="-ml-3"
          onPress={() => navigate("/history")}
        >
          <ArrowLeft size={16} />
          Back to Scan History
        </Button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-words text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {scan.name || "Untitled Scan"}
              </h1>

              <Chip
                size="sm"
                color={statusColors[scan.status] || "default"}
                variant="soft"
              >
                {scan.status}
              </Chip>
            </div>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Complete security analysis and vulnerability report.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onPress={handleDownloadReport}
              isPending={reportDownloading}
              isDisabled={
                reportDownloading || scan.status !== "completed"
              }
            >
              <Download size={16} />
              {reportDownloading
                ? "Generating PDF..."
                : "Download PDF Report"}
            </Button>

            <Button
              variant="secondary"
              onPress={loadScanDetails}
              isPending={loading}
              isDisabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </div>

        {reportError && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <p>{reportError}</p>
            </div>
          </div>
        )}
      </div>

      
      <Card>
        <Card.Header>
          <Card.Title>Scan Information</Card.Title>

          <Card.Description>
            General information about this security analysis.
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Language
              </p>

              <p className="mt-1 flex items-center gap-2 font-medium">
                <Code2 size={16} className="text-indigo-500" />
                {getLanguageLabel(scan.language)}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Created
              </p>

              <p className="mt-1 font-medium">
                {formatDate(scan.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Duration
              </p>

              <p className="mt-1 flex items-center gap-2 font-medium">
                <Clock3 size={16} className="text-indigo-500" />
                {formatDuration(scan.duration)}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Source
              </p>

              <p className="mt-1 font-medium capitalize">
                {scan.sourceType || "Editor"}
              </p>
            </div>

            {scan.fileName && (
              <div className="sm:col-span-2">
                <p className="text-xs text-[var(--muted-foreground)]">
                  File name
                </p>

                <p className="mt-1 flex items-center gap-2 font-medium">
                  <FileCode2 size={16} />
                  {scan.fileName}
                </p>
              </div>
            )}

            {scan.completedAt && (
              <div className="sm:col-span-2">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Completed at
                </p>

                <p className="mt-1 font-medium">
                  {formatDate(scan.completedAt)}
                </p>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      
      {scan.status === "failed" && scan.errorMessage && (
        <Card className="border-red-500/30">
          <Card.Content className="flex items-start gap-3 p-5">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <div>
              <p className="font-semibold text-red-500">
                Scan failed
              </p>

              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {scan.errorMessage}
              </p>
            </div>
          </Card.Content>
        </Card>
      )}

      
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          Vulnerability Summary
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            label="Total Findings"
            value={totalFindings}
            color="text-[var(--foreground)]"
            icon={ShieldAlert}
          />

          <StatCard
            label="Critical"
            value={summary.critical || 0}
            color="text-red-600"
            icon={AlertTriangle}
          />

          <StatCard
            label="High"
            value={summary.high || 0}
            color="text-orange-500"
            icon={AlertTriangle}
          />

          <StatCard
            label="Medium"
            value={summary.medium || 0}
            color="text-amber-500"
            icon={ShieldAlert}
          />

          <StatCard
            label="Low"
            value={summary.low || 0}
            color="text-blue-500"
            icon={CheckCircle2}
          />
        </div>
      </div>

      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Detected Vulnerabilities
          </h2>

          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Detailed information and remediation guidance for each finding.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {findings.length === 0 ? (
          <Card>
            <Card.Content className="flex flex-col items-center gap-3 p-10 text-center">
              <CheckCircle2
                size={32}
                className="text-emerald-500"
              />

              <Card.Title>No vulnerabilities found</Card.Title>

              <Card.Description>
                No findings were returned for this scan.
              </Card.Description>
            </Card.Content>
          </Card>
        ) : (
          findings.map((finding, index) => {
            const hasAIAnalysis = Boolean(
              finding.aiExplanation ||
                finding.aiImpact ||
                finding.recommendation
            );

            const isAnalyzing =
              aiLoadingFinding === finding._id;

            const isGeneratingFix =
              fixLoadingFinding === finding._id;

            const isUpdatingStatus =
              statusLoadingFinding === finding._id;

            const findingStatus = finding.status || "open";

            return (
              <Card key={finding._id || index}>
                <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip
                        size="sm"
                        color={
                          severityColors[finding.severity] || "default"
                        }
                        variant="soft"
                      >
                        {finding.severity}
                      </Chip>

                      <Chip
                        size="sm"
                        color={
                          findingStatusColors[findingStatus] || "default"
                        }
                        variant="secondary"
                      >
                        {findingStatus}
                      </Chip>
                    </div>

                    <Card.Title>
                      {finding.title || "Untitled vulnerability"}
                    </Card.Title>

                    <Card.Description>
                      {finding.ruleId}
                    </Card.Description>

                    
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {findingStatus === "open" ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            color="success"
                            onPress={() =>
                              updateFindingStatus(finding._id, "fixed")
                            }
                            isPending={isUpdatingStatus}
                            isDisabled={statusLoadingFinding !== null}
                          >
                            <CheckCircle2 size={14} />
                            Mark Fixed
                          </Button>

                          <Button
                            size="sm"
                            variant="tertiary"
                            onPress={() =>
                              updateFindingStatus(finding._id, "ignored")
                            }
                            isDisabled={statusLoadingFinding !== null}
                          >
                            Ignore
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() =>
                            updateFindingStatus(finding._id, "open")
                          }
                          isPending={isUpdatingStatus}
                          isDisabled={statusLoadingFinding !== null}
                        >
                          <RefreshCw size={14} />
                          Reopen Finding
                        </Button>
                      )}
                    </div>

                    {findingStatus === "fixed" && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Marked as fixed by you. This has not been independently
                        verified by a new security scan.
                      </p>
                    )}

                    {findingStatus === "ignored" && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        This finding has been intentionally ignored. You can
                        reopen it at any time.
                      </p>
                    )}

                    {statusErrors[finding._id] && (
                      <p className="text-sm text-red-500">
                        {statusErrors[finding._id]}
                      </p>
                    )}
                  </div>

                  <Chip size="sm" variant="secondary">
                    {finding.category || "General"}
                  </Chip>
                </Card.Header>

                <Card.Content className="space-y-5">
                  
                  <div className="rounded-xl bg-[var(--surface-container-low)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      Location
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="break-all font-mono text-sm text-[var(--foreground)]">
                        {finding.filePath}
                      </p>

                      <Chip size="sm" variant="soft" color="accent">
                        Line {finding.startLine}
                        {finding.endLine &&
                        finding.endLine !== finding.startLine
                          ? `–${finding.endLine}`
                          : ""}
                      </Chip>
                    </div>
                  </div>

                  
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-[var(--foreground)]">
                      Description
                    </h3>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted-foreground)]">
                      {finding.description}
                    </p>
                  </div>

                  
                  <div className="overflow-hidden rounded-xl border border-violet-500/20">
                    <div className="flex flex-col justify-between gap-3 bg-violet-500/5 p-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-violet-500/10 p-2">
                          <Sparkles
                            size={19}
                            className="text-violet-600 dark:text-violet-400"
                          />
                        </div>

                        <div>
                          <h3 className="font-semibold text-[var(--foreground)]">
                            AI Security Analysis
                          </h3>

                          <p className="text-xs text-[var(--muted-foreground)]">
                            {hasAIAnalysis
                              ? "Gemini analysis available"
                              : "Get an AI-powered explanation and suggested fix"}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => analyzeFinding(finding._id)}
                        isPending={isAnalyzing}
                        isDisabled={
                          isAnalyzing ||
                          isGeneratingFix ||
                          Boolean(aiLoadingFinding || fixLoadingFinding)
                        }
                      >
                        {isAnalyzing ? (
                          <RefreshCw size={15} className="animate-spin" />
                        ) : (
                          <WandSparkles size={15} />
                        )}

                        {isAnalyzing
                          ? "Analyzing..."
                          : hasAIAnalysis
                            ? "Regenerate Analysis"
                            : "Explain with AI"}
                      </Button>
                    </div>

                    {aiErrors[finding._id] && (
                      <div className="border-t border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                        {aiErrors[finding._id]}
                      </div>
                    )}

                    {hasAIAnalysis ? (
                      <div className="space-y-5 p-4">
                        {finding.aiExplanation && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-violet-600 dark:text-violet-400">
                              Understanding the Vulnerability
                            </h4>

                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted-foreground)]">
                              {finding.aiExplanation}
                            </p>
                          </div>
                        )}

                        {finding.aiImpact && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-[var(--foreground)]">
                              Potential Security Impact
                            </h4>

                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted-foreground)]">
                              {finding.aiImpact}
                            </p>
                          </div>
                        )}

                        {finding.recommendation && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-[var(--foreground)]">
                              Recommended Remediation
                            </h4>

                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted-foreground)]">
                              {finding.recommendation}
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-[var(--muted-foreground)]">
                          AI-generated code is a suggestion. Review and test
                          it before using it in your application.
                        </p>

                        {finding.aiAnalyzedAt && (
                          <p className="border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
                            AI analysis generated:{" "}
                            {formatDate(finding.aiAnalyzedAt)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-5 text-center">
                        <p className="text-sm text-[var(--muted-foreground)]">
                          No AI analysis has been generated for this
                          vulnerability yet.
                        </p>
                      </div>
                    )}
                  </div>

                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--foreground)]">
                        Code Fix Comparison
                      </h3>

                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Compare the detected code with the AI-generated
                        secure alternative.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      
                      <div className="min-w-0 overflow-hidden rounded-xl border border-red-500/20">
                        <div className="flex items-center justify-between gap-2 bg-red-500/5 p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle
                              size={16}
                              className="text-red-500"
                            />

                            <span className="text-sm font-semibold">
                              Vulnerable Code
                            </span>
                          </div>

                          <Chip size="sm" color="danger" variant="soft">
                            Before
                          </Chip>
                        </div>

                        <div className="p-3">
                          {finding.codeSnippet ? (
                            <>
                              <pre className="max-h-[360px] overflow-auto rounded-lg bg-[var(--surface-container-low)] p-4 font-mono text-xs leading-6 text-[var(--foreground)]">
                                <code>{finding.codeSnippet}</code>
                              </pre>

                              <Button
                                className="mt-3"
                                size="sm"
                                variant="tertiary"
                                onPress={() =>
                                  copyCode(
                                    finding.codeSnippet,
                                    finding._id
                                  )
                                }
                              >
                                <Copy size={14} />

                                {copiedFinding === finding._id
                                  ? "Copied"
                                  : "Copy Original"}
                              </Button>
                            </>
                          ) : (
                            <p className="text-sm text-[var(--muted-foreground)]">
                              No original code snippet is available.
                            </p>
                          )}
                        </div>
                      </div>

                      
                      <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-500/20">
                        <div className="flex items-center justify-between gap-2 bg-emerald-500/5 p-3">
                          <div className="flex items-center gap-2">
                            <ShieldAlert
                              size={16}
                              className="text-emerald-500"
                            />

                            <span className="text-sm font-semibold">
                              AI Suggested Fix
                            </span>
                          </div>

                          <Chip size="sm" color="success" variant="soft">
                            After
                          </Chip>
                        </div>

                        <div className="space-y-3 p-3">
                          {finding.suggestedFix ? (
                            <>
                              <pre className="max-h-[360px] overflow-auto rounded-lg bg-[var(--surface-container-low)] p-4 font-mono text-xs leading-6 text-[var(--foreground)]">
                                <code>{finding.suggestedFix}</code>
                              </pre>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onPress={() =>
                                    copyCode(
                                      finding.suggestedFix,
                                      `${finding._id}-fix`
                                    )
                                  }
                                >
                                  <Copy size={14} />

                                  {copiedFinding === `${finding._id}-fix`
                                    ? "Copied"
                                    : "Copy Suggested Fix"}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="tertiary"
                                  onPress={() => generateAIFix(finding._id)}
                                  isPending={isGeneratingFix}
                                  isDisabled={
                                    isGeneratingFix ||
                                    isAnalyzing ||
                                    Boolean(aiLoadingFinding || fixLoadingFinding)
                                  }
                                >
                                  <RefreshCw size={14} />

                                  Regenerate Fix
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                              <Sparkles
                                size={24}
                                className="text-violet-500"
                              />

                              <div>
                                <p className="text-sm font-medium text-[var(--foreground)]">
                                  No secure replacement generated yet
                                </p>

                                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                  Ask Gemini to generate a defensive
                                  replacement for this vulnerability.
                                </p>
                              </div>

                              <Button
                                size="sm"
                                variant="secondary"
                                onPress={() => generateAIFix(finding._id)}
                                isPending={isGeneratingFix}
                                isDisabled={
                                  isGeneratingFix ||
                                  isAnalyzing ||
                                  Boolean(aiLoadingFinding || fixLoadingFinding)
                                }
                              >
                                <WandSparkles size={15} />

                                {isGeneratingFix
                                  ? "Generating Fix..."
                                  : "Generate AI Fix"}
                              </Button>
                            </div>
                          )}

                          {fixErrors[finding._id] && (
                            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs leading-relaxed text-red-500">
                              {fixErrors[finding._id]}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {finding.suggestedFix && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        AI-generated code is not automatically verified.
                        Review, adapt, and test the suggested changes before
                        using them.
                      </p>
                    )}
                  </div>

                  
                  {(finding.cwe?.length > 0 || finding.owasp) && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
                      {finding.cwe?.map((cwe) => (
                        <Chip
                          key={cwe}
                          size="sm"
                          variant="secondary"
                        >
                          {cwe}
                        </Chip>
                      ))}

                      {finding.owasp && (
                        <Chip size="sm" variant="secondary">
                          {finding.owasp}
                        </Chip>
                      )}
                    </div>
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
