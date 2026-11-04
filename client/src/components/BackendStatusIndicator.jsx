
import { LoaderCircle, Server } from "lucide-react";
import useBackendStatusStore from "../stores/backendStatusStore.js";

const BackendStatusIndicator = () => {
  const isWakingUp = useBackendStatusStore(
    (state) => state.isWakingUp
  );

  if (!isWakingUp) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
    >
      <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-background p-4 shadow-xl dark:border-warning-900">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300">
          <Server size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Backend is starting
          </p>

          <p className="mt-1 text-xs leading-relaxed text-default-500">
            The server is waking up after a period of inactivity.
            This may take a little while. Please wait.
          </p>
        </div>

        <LoaderCircle
          size={19}
          className="mt-1 shrink-0 animate-spin text-warning-600"
        />
      </div>
    </div>
  );
};

export default BackendStatusIndicator;
