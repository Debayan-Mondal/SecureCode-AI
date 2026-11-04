
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Chip, Skeleton } from "@heroui/react";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Bug,
  CheckCircle2,
  Clock3,
  FileCode2,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

import api from "../lib/axios";





const severityConfig = [
  {
    key: "critical",
    label: "Critical",
    color: "bg-danger-500",
    textColor: "text-danger",
  },
  {
    key: "high",
    label: "High",
    color: "bg-orange-500",
    textColor: "text-orange-500",
  },
  {
    key: "medium",
    label: "Medium",
    color: "bg-warning-500",
    textColor: "text-warning",
  },
  {
    key: "low",
    label: "Low",
    color: "bg-blue-500",
    textColor: "text-blue-500",
  },
  {
    key: "info",
    label: "Informational",
    color: "bg-violet-500",
    textColor: "text-violet-500",
  },
];

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatDuration(duration) {
  if (duration == null) return "—";
  if (duration < 1000) return `${duration} ms`;

  return `${(duration / 1000).toFixed(1)} sec`;
}

function getStatusColor(status) {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "danger";
    case "running":
      return "accent";
    default:
      return "default";
  }
}





function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconStyle,
  chip,
  chipColor,
}) {
  return (
    <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Card.Content className="gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-default-500">
              {title}
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </h2>
          </div>

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconStyle}`}
          >
            <Icon size={21} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-default-500">
            {description}
          </p>

          {chip && (
            <Chip size="sm" variant="soft" color={chipColor}>
              {chip}
            </Chip>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}





function SectionCard({ title, description, children, action }) {
  return (
    <Card className="h-full">
      <Card.Header className="flex flex-row items-center justify-between gap-3 px-5 pt-5">
        <div>
          <Card.Title>{title}</Card.Title>
          {description && (
            <Card.Description>{description}</Card.Description>
          )}
        </div>

        {action}
      </Card.Header>

      <Card.Content className="p-5 pt-4">
        {children}
      </Card.Content>
    </Card>
  );
}





function SeverityOverview({ findings }) {
  const total = findings.total || 0;

  return (
    <SectionCard
      title="Vulnerability Severity"
      description="Breakdown of detected security issues."
    >
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <ShieldCheck size={28} />
          </div>

          <p className="mt-4 text-sm font-semibold text-foreground">
            No vulnerabilities detected
          </p>

          <p className="mt-1 max-w-xs text-xs text-default-500">
            Run a security scan to see your vulnerability distribution.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-3xl font-semibold text-foreground">
              {total}
            </p>
            <p className="mt-1 text-xs text-default-500">
              Total findings across your scans
            </p>
          </div>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-default-200">
            {severityConfig.map((item) => {
              const count = findings[item.key] || 0;

              if (!count) return null;

              return (
                <div
                  key={item.key}
                  className={`${item.color} transition-all duration-500`}
                  style={{ width: `${(count / total) * 100}%` }}
                  title={`${item.label}: ${count}`}
                />
              );
            })}
          </div>

          <div className="space-y-4">
            {severityConfig.map((item) => {
              const count = findings[item.key] || 0;
              const percentage = (count / total) * 100;

              return (
                <div key={item.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                      />
                      <span className="text-xs font-medium text-default-600">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-foreground">
                        {count}
                      </span>
                      <span className="w-10 text-right text-xs text-default-400">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-default-200">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}





function FindingStatus({ findings }) {
  const items = [
    {
      label: "Open",
      value: findings.open || 0,
      icon: AlertCircle,
      color: "text-warning",
      background: "bg-warning/10",
    },
    {
      label: "Fixed",
      value: findings.fixed || 0,
      icon: CheckCircle2,
      color: "text-success",
      background: "bg-success/10",
    },
    {
      label: "Ignored",
      value: findings.ignored || 0,
      icon: XCircle,
      color: "text-default-500",
      background: "bg-default-100",
    },
  ];

  return (
    <SectionCard
      title="Finding Status"
      description="Current state of your findings."
    >
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="bg-default-50">
              <Card.Content className="gap-3 p-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.background} ${item.color}`}
                >
                  <Icon size={18} />
                </div>

                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {item.value}
                  </p>

                  <p className="mt-1 text-xs text-default-500">
                    {item.label}
                  </p>
                </div>
              </Card.Content>
            </Card>
          );
        })}
      </div>
    </SectionCard>
  );
}





function RecentScans({
  scans,
  onViewAll,
  onOpenScan,
  onNewScan,
}) {
  return (
    <Card>
      <Card.Header className="flex flex-row items-center justify-between gap-3 px-5 pt-5">
        <div>
          <Card.Title>Recent Scans</Card.Title>
          <Card.Description>
            Your latest security analysis activity.
          </Card.Description>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onPress={onViewAll}
        >
          View all
          <ArrowUpRight size={14} />
        </Button>
      </Card.Header>

      <Card.Content className="p-0">
        {scans.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <FileCode2 size={27} />
            </div>

            <p className="mt-4 text-sm font-semibold text-foreground">
              No scans yet
            </p>

            <p className="mt-1 max-w-sm text-xs text-default-500">
              Your recent scans will appear here once you analyze your first
              code sample.
            </p>

            <Button
              className="mt-5"
              color="accent"
              onPress={onNewScan}
            >
              <Sparkles size={15} />
              Start your first scan
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {scans.map((scan) => (
              <div
                key={scan._id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-default-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <FileCode2 size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {scan.name || "Untitled Scan"}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-default-500">
                      <span className="capitalize">{scan.language}</span>
                      <span>·</span>
                      <span>{formatDate(scan.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <div className="flex items-center gap-1.5 text-xs text-default-500">
                    <Bug size={14} />
                    <span>
                      {scan.summary?.totalFindings ?? 0} findings
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-default-500">
                    <Clock3 size={14} />
                    <span>{formatDuration(scan.duration)}</span>
                  </div>

                  <Chip
                    size="sm"
                    variant="soft"
                    color={getStatusColor(scan.status)}
                  >
                    {scan.status}
                  </Chip>

                  <Button
                    isIconOnly
                    variant="tertiary"
                    size="sm"
                    aria-label="Open scan details"
                    onPress={() => onOpenScan(scan._id)}
                  >
                    <ArrowUpRight size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}





function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <Card.Content className="gap-4 p-5">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-3 w-36 rounded-lg" />
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <Card.Content className="gap-5 p-5">
            <Skeleton className="h-5 w-40 rounded-lg" />
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-5 w-full rounded-lg" />
            ))}
          </Card.Content>
        </Card>

        <Card className="xl:col-span-2">
          <Card.Content className="gap-5 p-5">
            <Skeleton className="h-5 w-36 rounded-lg" />
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Content className="gap-4 p-5">
          <Skeleton className="h-5 w-36 rounded-lg" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-lg" />
          ))}
        </Card.Content>
      </Card>
    </div>
  );
}





export default function DashboardPage() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/dashboard");
      setDashboard(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <Card.Content className="items-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <AlertCircle size={27} />
            </div>

            <Card.Title>Dashboard unavailable</Card.Title>

            <Card.Description>
              {error || "Something went wrong while loading your dashboard."}
            </Card.Description>

            <Button
              color="accent"
              className="mt-3"
              onPress={() => fetchDashboard()}
            >
              <RefreshCw size={15} />
              Try again
            </Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const stats = dashboard.stats || {};
  const findings = dashboard.findings || {};
  const recentScans = dashboard.recentScans || [];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-6">
      {}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Security Overview
            </h1>

            <p className="text-xs text-default-500">
              Monitor your scans and security findings.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onPress={() => fetchDashboard(true)}
            isDisabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </Button>

          <Button
            color="accent"
            onPress={() => navigate("/scans/new")}
          >
            <Sparkles size={15} />
            New Security Scan
          </Button>
        </div>
      </section>

      {error && (
        <Card className="border border-warning/30 bg-warning/5">
          <Card.Content className="flex flex-row items-center gap-3 p-3">
            <AlertCircle size={17} className="shrink-0 text-warning" />
            <p className="text-xs text-foreground">
              {error} Showing previously loaded information.
            </p>
          </Card.Content>
        </Card>
      )}

      {}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Scans"
          value={stats.totalScans ?? 0}
          description="All submitted scans"
          icon={ScanLine}
          iconStyle="bg-accent/10 text-accent"
        />

        <MetricCard
          title="Completed Scans"
          value={stats.completedScans ?? 0}
          description="Successfully analyzed"
          icon={CheckCircle2}
          iconStyle="bg-success/10 text-success"
          chip="Completed"
          chipColor="success"
        />

        <MetricCard
          title="Total Findings"
          value={findings.total ?? 0}
          description="Detected security issues"
          icon={Bug}
          iconStyle="bg-danger/10 text-danger"
        />

        <MetricCard
          title="Open Findings"
          value={findings.open ?? 0}
          description="Awaiting security review"
          icon={ShieldAlert}
          iconStyle="bg-warning/10 text-warning"
          chip={(findings.open || 0) > 0 ? "Needs review" : "All clear"}
          chipColor={(findings.open || 0) > 0 ? "warning" : "success"}
        />
      </section>

      {}
      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <SeverityOverview findings={findings} />
        </div>

        <div className="space-y-5 xl:col-span-2">
          <FindingStatus findings={findings} />

          <Card>
            <Card.Content className="flex flex-row items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-default-100 text-default-600">
                  <Activity size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Scan Activity
                  </p>

                  <p className="mt-1 text-xs text-default-500">
                    {stats.failedScans ?? 0} failed scans
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onPress={() => navigate("/history")}
              >
                History
                <ArrowRight size={14} />
              </Button>
            </Card.Content>
          </Card>
        </div>
      </section>

      {}
      <RecentScans
        scans={recentScans}
        onViewAll={() => navigate("/history")}
        onNewScan={() => navigate("/scans/new")}
        onOpenScan={(id) => navigate(`/history/${id}`)}
      />

      {}
      <div className="flex items-center justify-center gap-2 pt-2 text-center text-xs text-default-400">
        <ShieldCheck size={13} />
        <span>SecureCode AI · Security Overview</span>
      </div>
    </div>
  );
}
