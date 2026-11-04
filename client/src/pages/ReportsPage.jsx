
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  FileCode2,
  FileText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@heroui/react";
import api from "../lib/axios";

const statusStyles = {
  completed: "bg-emerald-500/10 text-emerald-500",
  running: "bg-blue-500/10 text-blue-500",
  pending: "bg-amber-500/10 text-amber-500",
  failed: "bg-red-500/10 text-red-500",
};

const formatDate = (date) => {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (duration) => {
  if (!duration) return "—";
  if (duration < 1000) return `${duration} ms`;

  return `${(duration / 1000).toFixed(2)} sec`;
};

const getLanguageLabel = (language) => {
  const languages = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
  };

  return languages[language] || language;
};

const getDownloadFileName = (contentDisposition, scan) => {
  if (contentDisposition) {
    const match = contentDisposition.match(
      /filename\*?=(?:UTF-8''|")?([^";]+)/i
    );

    if (match?.[1]) {
      return decodeURIComponent(match[1].replace(/"/g, ""));
    }
  }

  const safeName = (scan.name || "security-report")
    .replace(/[^a-z0-9-_]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${safeName || "security-report"}.pdf`;
};

export default function ReportsPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const loadScans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/scans", {
        params: {
          page: 1,
          limit: 50,
        },
      });

      setScans(response.data.scans || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  const handleDownload = async (scan) => {
    if (
      scan.status !== "completed" ||
      downloadingId
    ) {
      return;
    }

    setDownloadingId(scan._id);
    setError("");

    try {
      const response = await api.get(
        `/scans/${scan._id}/report`,
        {
          responseType: "blob",
        }
      );

      const fileName = getDownloadFileName(
        response.headers?.["content-disposition"],
        scan
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      let message =
        "Unable to download this report. Please try again.";

      if (err.response?.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text();
          const errorData = JSON.parse(errorText);

          message = errorData.message || message;
        } catch {
        }
      } else {
        message = err.response?.data?.message || message;
      }

      setError(message);
    } finally {
      setDownloadingId(null);
    }
  };

  const completedScans = scans.filter(
    (scan) => scan.status === "completed"
  );

  const failedScans = scans.filter(
    (scan) => scan.status === "failed"
  );

  const totalFindings = scans.reduce(
    (total, scan) =>
      total + (scan.summary?.totalFindings || 0),
    0
  );

  const totalCritical = scans.reduce(
    (total, scan) =>
      total + (scan.summary?.critical || 0),
    0
  );

  const totalHigh = scans.reduce(
    (total, scan) =>
      total + (scan.summary?.high || 0),
    0
  );

  return (
    <div className="space-y-7 pb-10">
      
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <FileText size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Security Reports
              </h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Generate and download PDF reports from your completed scans.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          onPress={loadScans}
          isPending={loading}
          isDisabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              Total Scans
            </p>
            <FileCode2 size={19} className="text-indigo-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {scans.length}
          </p>

          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Latest 50 scans
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              Reports Ready
            </p>
            <ShieldCheck size={19} className="text-emerald-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {completedScans.length}
          </p>

          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Completed scans
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              Total Findings
            </p>
            <AlertTriangle size={19} className="text-amber-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {totalFindings}
          </p>

          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Across loaded scans
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              Critical / High
            </p>
            <ShieldAlert size={19} className="text-red-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {totalCritical + totalHigh}
          </p>

          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {totalCritical} critical · {totalHigh} high
          </p>
        </div>
      </div>

      
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex flex-col justify-between gap-2 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">
              Available Reports
            </h2>

            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Download PDF security reports for completed scans.
            </p>
          </div>

          <span className="text-xs text-[var(--muted-foreground)]">
            {completedScans.length} available
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <RefreshCw
              size={25}
              className="animate-spin text-indigo-500"
            />

            <p className="text-sm text-[var(--muted-foreground)]">
              Loading reports...
            </p>
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
              <FileText size={25} className="text-indigo-500" />
            </div>

            <h3 className="font-semibold text-[var(--foreground)]">
              No reports available
            </h3>

            <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
              Complete your first code security scan to generate a downloadable PDF report.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {scans.map((scan) => {
              const isCompleted = scan.status === "completed";
              const isDownloading = downloadingId === scan._id;

              return (
                <div
                  key={scan._id}
                  className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-[var(--surface-container-low)] sm:flex-row sm:items-center sm:justify-between"
                >
                  
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isCompleted
                          ? "bg-red-500/10 text-red-500"
                          : "bg-[var(--surface-container-low)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      <FileText size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-[var(--foreground)]">
                          {scan.name || "Untitled Scan"}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            statusStyles[scan.status] ||
                            "bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          {scan.status}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted-foreground)]">
                        <span>
                          {getLanguageLabel(scan.language)}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Clock3 size={13} />
                          {formatDate(scan.createdAt)}
                        </span>

                        <span>
                          Duration: {formatDuration(scan.duration)}
                        </span>
                      </div>

                      {scan.sourceType === "upload" && scan.fileName && (
                        <p className="mt-2 truncate font-mono text-xs text-[var(--muted-foreground)]">
                          Source: {scan.fileName}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-[var(--muted-foreground)]">
                          <strong className="text-[var(--foreground)]">
                            {scan.summary?.totalFindings || 0}
                          </strong>{" "}
                          findings
                        </span>

                        {(scan.summary?.critical || 0) > 0 && (
                          <span className="font-medium text-red-500">
                            {scan.summary.critical} critical
                          </span>
                        )}

                        {(scan.summary?.high || 0) > 0 && (
                          <span className="font-medium text-orange-500">
                            {scan.summary.high} high
                          </span>
                        )}

                        {(scan.summary?.medium || 0) > 0 && (
                          <span className="font-medium text-amber-500">
                            {scan.summary.medium} medium
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  
                  <div className="flex shrink-0 items-center justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      isDisabled={!isCompleted || Boolean(downloadingId)}
                      isPending={isDownloading}
                      onPress={() => handleDownload(scan)}
                    >
                      <Download size={16} />
                      {isCompleted ? "Download PDF" : "Not available"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        
        {!loading && scans.length > 0 && (
          <div className="border-t border-[var(--border)] px-5 py-4">
            <p className="text-xs text-[var(--muted-foreground)]">
              Showing the latest {scans.length} scans. PDF reports are available only for completed scans.
            </p>
          </div>
        )}
      </div>

      
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <h3 className="font-semibold text-[var(--foreground)]">
              About your security reports
            </h3>

            <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Each PDF report contains scan information, detected vulnerabilities,
              severity classifications, code snippets, recommendations and
              AI-generated explanations where available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
