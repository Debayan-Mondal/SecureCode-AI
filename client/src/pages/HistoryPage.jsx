
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  FileCode2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { Button, Modal } from "@heroui/react";
import api from "../lib/axios";

const statusStyles = {
  completed: "bg-emerald-500/10 text-emerald-500",
  running: "bg-blue-500/10 text-blue-500",
  pending: "bg-amber-500/10 text-amber-500",
  failed: "bg-red-500/10 text-red-500",
};

const severityStyles = {
  critical: "text-red-500",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-blue-500",
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

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalScans: 0,
    limit: 8,
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  const loadScans = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/scans", {
        params: {
          page: pageNumber,
          limit: 8,
        },
      });

      setScans(response.data.scans || []);

      setPagination(
        response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalScans: 0,
          limit: 8,
        }
      );

      setPage(pageNumber);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load scan history. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScans(1);
  }, [loadScans]);

  const handleDeleteScan = async () => {
    if (!selectedScan || isDeleting) return;

    setIsDeleting(true);
    setError("");

    try {
      await api.delete(`/scans/${selectedScan._id}`);

      setSelectedScan(null);

      const nextPage =
        scans.length === 1 && page > 1 ? page - 1 : page;

      await loadScans(nextPage);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete scan."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const completedScans = scans.filter(
    (scan) => scan.status === "completed"
  ).length;

  const failedScans = scans.filter(
    (scan) => scan.status === "failed"
  ).length;

  const totalFindings = scans.reduce(
    (total, scan) => total + (scan.summary?.totalFindings || 0),
    0
  );

  return (
    <div className="space-y-7 pb-10">
      
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Scan History
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Review and manage your previous code security scans.
          </p>
        </div>

        <Button
          variant="secondary"
          onPress={() => loadScans(page)}
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
            {pagination.totalScans}
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Across your account
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              Completed
            </p>
            <ShieldCheck size={19} className="text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {completedScans}
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            On this page
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              Failed
            </p>
            <XCircle size={19} className="text-red-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {failedScans}
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            On this page
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              Findings
            </p>
            <AlertTriangle size={19} className="text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {totalFindings}
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            On this page
          </p>
        </div>
      </div>

      
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">
              Previous Scans
            </h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Your latest code analysis activity
            </p>
          </div>

          <span className="text-xs text-[var(--muted-foreground)]">
            {pagination.totalScans} total
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <RefreshCw
              size={25}
              className="animate-spin text-indigo-500"
            />
            <p className="text-sm text-[var(--muted-foreground)]">
              Loading scan history...
            </p>
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
              <FileCode2 size={25} className="text-indigo-500" />
            </div>

            <h3 className="font-semibold text-[var(--foreground)]">
              No scans yet
            </h3>

            <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
              Your previous code security scans will appear here once
              you analyze your first piece of code.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)]">
              {scans.map((scan) => {
                const isUploaded = scan.sourceType === "upload";

                return (
                  <div
                    key={scan._id}
                    className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-[var(--surface-container-low)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    
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
                        <span className="flex items-center gap-1.5">
                          <FileCode2 size={14} />
                          {getLanguageLabel(scan.language)}
                        </span>

                        <span className="flex items-center gap-1.5">
                          {isUploaded ? (
                            <Upload size={14} />
                          ) : (
                            <Code2 size={14} />
                          )}
                          {isUploaded ? "Uploaded file" : "Editor"}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {formatDate(scan.createdAt)}
                        </span>

                        <span>
                          Duration: {formatDuration(scan.duration)}
                        </span>
                      </div>

                      
                      {isUploaded && scan.fileName && (
                        <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-container-low)] px-3 py-2">
                          <FileCode2
                            size={14}
                            className="shrink-0 text-indigo-500"
                          />
                          <span className="truncate font-mono text-xs text-[var(--foreground)]">
                            {scan.fileName}
                          </span>
                        </div>
                      )}

                      
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          <strong className="text-[var(--foreground)]">
                            {scan.summary?.totalFindings || 0}
                          </strong>{" "}
                          findings
                        </span>

                        {["critical", "high", "medium", "low"].map(
                          (severity) => {
                            const count =
                              scan.summary?.[severity] || 0;

                            if (!count) return null;

                            return (
                              <span
                                key={severity}
                                className={`text-xs font-medium ${severityStyles[severity]}`}
                              >
                                {count} {severity}
                              </span>
                            );
                          }
                        )}
                      </div>
                    </div>

                    
                    <div className="flex shrink-0 items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => navigate(`/scans/${scan._id}`)}
                      >
                        View Details
                      </Button>

                      <Button
                        isIconOnly
                        size="sm"
                        variant="tertiary"
                        aria-label={`Delete ${scan.name || "scan"}`}
                        className="text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-500"
                        onPress={() => setSelectedScan(scan)}
                      >
                        <Trash2 size={17} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            
            <div className="flex flex-col gap-3 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[var(--muted-foreground)]">
                Page {pagination.currentPage} of{" "}
                {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={page <= 1 || loading}
                  onPress={() => loadScans(page - 1)}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={
                    page >= pagination.totalPages || loading
                  }
                  onPress={() => loadScans(page + 1)}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      
      <Modal>
        <Modal.Backdrop
          isOpen={Boolean(selectedScan)}
          variant="blur"
          isDismissable={!isDeleting}
          isKeyboardDismissDisabled={isDeleting}
          onOpenChange={(isOpen) => {
            if (!isOpen && !isDeleting) {
              setSelectedScan(null);
            }
          }}
        >
          <Modal.Container size="sm" placement="center">
            <Modal.Dialog aria-label="Confirm scan deletion">
              <Modal.Header>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                    <Trash2 size={20} />
                  </div>

                  <div>
                    <Modal.Heading>
                      Delete scan?
                    </Modal.Heading>

                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </Modal.Header>

              <Modal.Body>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {selectedScan?.name || "this scan"}
                  </span>
                  ? All vulnerability findings associated with
                  this scan will also be deleted.
                </p>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="secondary"
                  onPress={() => setSelectedScan(null)}
                  isDisabled={isDeleting}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onPress={handleDeleteScan}
                  isPending={isDeleting}
                  isDisabled={isDeleting}
                >
                  Delete scan
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
