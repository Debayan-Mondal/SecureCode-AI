
import { useState } from "react";
import {
  UserRound,
  LockKeyhole,
  Palette,
  ShieldCheck,
  LogOut,
  Save,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@heroui/react";
import useAuthStore from "../stores/useAuthStore";
import { useUIStore } from "../stores/useUIStore";

function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

function FormField({ label, value, onChange, type = "text", placeholder, disabled = false }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--foreground)]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function Feedback({ message, type = "success" }) {
  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
        isSuccess
          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
          : "border-red-500/20 bg-red-500/5 text-red-500"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={17} className="mt-0.5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);

  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleProfileUpdate = async (event) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (!name.trim() || !email.trim()) {
      setProfileError("Name and email are required.");
      return;
    }

    setProfileLoading(true);

    try {
      const response = await updateProfile({
        name: name.trim(),
        email: email.trim(),
      });

      setProfileMessage(
        response.message || "Profile updated successfully."
      );
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      const api = (await import("../lib/axios")).default;

      const response = await api.patch("/auth/password", {
        currentPassword,
        newPassword,
      });

      setPasswordMessage(
        response.data.message || "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || "Unable to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);

    try {
      await logout();
    } finally {
      setLogoutLoading(false);
    }
  };

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-10">
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Manage your account, security and application preferences.
        </p>
      </div>

      
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl font-bold text-indigo-500">
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-[var(--foreground)]">
            {user?.name || "User"}
          </h2>
          <p className="truncate text-sm text-[var(--muted-foreground)]">
            {user?.email}
          </p>
        </div>

        <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold capitalize text-emerald-500">
          {user?.role || "User"} account
        </span>
      </div>

      
      <SettingsSection
        icon={UserRound}
        title="Profile Information"
        description="Update the personal information associated with your account."
      >
        <form onSubmit={handleProfileUpdate} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Full Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
            />

            <FormField
              label="Email Address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <Feedback message={profileMessage} />
          <Feedback message={profileError} type="error" />

          <div className="flex justify-end">
            <Button
              type="submit"
              isPending={profileLoading}
              isDisabled={profileLoading}
            >
              <Save size={16} />
              Save Changes
            </Button>
          </div>
        </form>
      </SettingsSection>

      
      <SettingsSection
        icon={LockKeyhole}
        title="Password & Security"
        description="Change your password to keep your account secure."
      >
        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Current Password
              </span>

              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 pr-12 text-sm text-[var(--foreground)] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="Enter current password"
                />

                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  aria-label="Toggle current password visibility"
                >
                  {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                New Password
              </span>

              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 pr-12 text-sm text-[var(--foreground)] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="At least 8 characters"
                />

                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  aria-label="Toggle new password visibility"
                >
                  {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <FormField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              placeholder="Repeat new password"
            />
          </div>

          <p className="text-xs text-[var(--muted-foreground)]">
            Use at least 8 characters. Choose a password you haven't used elsewhere.
          </p>

          <Feedback message={passwordMessage} />
          <Feedback message={passwordError} type="error" />

          <div className="flex justify-end">
            <Button
              type="submit"
              isPending={passwordLoading}
              isDisabled={passwordLoading}
            >
              <LockKeyhole size={16} />
              Change Password
            </Button>
          </div>
        </form>
      </SettingsSection>

      
      <SettingsSection
        icon={Palette}
        title="Appearance"
        description="Choose how SecureCode AI looks on your device."
      >
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--foreground)]">
            Color Theme
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {themes.map((item) => {
              const Icon = item.icon;
              const selected = theme === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTheme(item.value)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/10"
                      : "border-[var(--border)] hover:bg-[var(--surface-container-low)]"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-container-low)] text-[var(--foreground)]">
                    <Icon size={19} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {item.value === "light"
                        ? "Bright interface"
                        : "Dark interface"}
                    </p>
                  </div>

                  <span
                    className={`h-4 w-4 rounded-full border-2 ${
                      selected
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-[var(--muted-foreground)]"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      
      <SettingsSection
        icon={ShieldCheck}
        title="Account Information"
        description="Details about your SecureCode AI account."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Account ID
            </p>
            <p className="mt-1 break-all font-mono text-sm text-[var(--foreground)]">
              {user?.id || "Unavailable"}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Account Role
            </p>
            <p className="mt-1 text-sm capitalize text-[var(--foreground)]">
              {user?.role || "User"}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Authentication
            </p>
            <p className="mt-1 text-sm text-emerald-500">
              HTTP-only cookie session
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Session Status
            </p>
            <p className="mt-1 text-sm text-emerald-500">
              Authenticated
            </p>
          </div>
        </div>
      </SettingsSection>

      
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <LogOut size={19} />
          </div>

          <div>
            <h2 className="font-semibold text-[var(--foreground)]">
              Sign out
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              End your current SecureCode AI session.
            </p>
          </div>
        </div>

        <Button
          variant="danger"
          onPress={handleLogout}
          isPending={logoutLoading}
          isDisabled={logoutLoading}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </section>
    </div>
  );
}
