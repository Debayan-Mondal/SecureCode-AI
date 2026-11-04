import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";


import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute";

import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import NewScanPage from "./pages/NewScanPage";
import HistoryPage from "./pages/HistoryPage";
import ScanDetailsPage from "./pages/ScanDetailsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import BackendStatusIndicator from "./components/BackendStatusIndicator";

import useAuthStore from "./stores/useAuthStore";

const App = () => {
  const initializeAuth = useAuthStore(
    (state) => state.initializeAuth
  );

  const authChecked = useAuthStore(
    (state) => state.authChecked
  );

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  
  if (!authChecked) {
  return (
    <>
      <BackendStatusIndicator />

      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm text-zinc-400">
            Loading SecureCode AI...
          </p>
        </div>
      </div>
    </>
  );
}

  return (
    <>
      <BackendStatusIndicator />
    <Routes>

      
      <Route
        path="/login"
        element={
          <GuestRoute>
            <AuthPage mode="login" />
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={
          <GuestRoute>
            <AuthPage mode="register" />
          </GuestRoute>
        }
      />

      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/scans/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <NewScanPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HistoryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/scans/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ScanDetailsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
    </>
  );
};

export default App;
