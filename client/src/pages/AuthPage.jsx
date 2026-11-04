
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Code2,
  ArrowRight,
  LockKeyhole,
  ScanSearch,
  CheckCircle2,
} from "lucide-react";

import { Button, Input, Label, TextField } from "@heroui/react";
import useAuthStore from "../stores/useAuthStore";

const AuthPage = ({ mode = "login" }) => {
  const isRegister = mode === "register";
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegister && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      } else {
        await login({
          email: formData.email,
          password: formData.password,
        });
      }

      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    "w-full h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const labelClasses = "mb-2 text-sm font-medium text-zinc-700";

  return (
    <div
      data-theme="light"
      className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#f8faff] px-5 py-12 text-zinc-900"
    >
      
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-indigo-300/30 blur-[120px]" />

        <div className="absolute -right-40 top-20 h-[420px] w-[420px] rounded-full bg-violet-300/30 blur-[120px]" />

        <div className="absolute -bottom-48 left-1/3 h-[450px] w-[450px] rounded-full bg-sky-200/40 blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(#a5b4fc 0.8px, transparent 0.8px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="relative w-full max-w-[460px]">
        
        <Link
          to="/login"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <ShieldCheck size={27} strokeWidth={2.2} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              SecureCode AI
            </h1>
            <p className="text-xs font-medium tracking-wide text-zinc-500">
              INTELLIGENT CODE SECURITY
            </p>
          </div>
        </Link>

        
        <div className="rounded-3xl border border-white/80 bg-white/90 p-7 shadow-[0_24px_80px_-24px_rgba(30,41,90,0.22)] backdrop-blur-xl sm:p-9">
          
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Code2 size={25} />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              {isRegister
                ? "Create an account and start making your code more secure."
                : "Sign in to continue finding and fixing vulnerabilities."}
            </p>
          </div>

          
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <TextField name="name" className="flex flex-col">
                <Label className={labelClasses}>Full name</Label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  minLength={2}
                  maxLength={60}
                  autoComplete="name"
                  className={inputClasses}
                />
              </TextField>
            )}

            <TextField name="email" className="flex flex-col">
              <Label className={labelClasses}>Email address</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={inputClasses}
              />
            </TextField>

            <TextField name="password" className="flex flex-col">
              <Label className={labelClasses}>Password</Label>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  minLength={8}
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  className={`${inputClasses} pr-12`}
                />

                <Button
                  type="button"
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onPress={() => setShowPassword((previous) => !previous)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </TextField>

            {isRegister && (
              <TextField name="confirmPassword" className="flex flex-col">
                <Label className={labelClasses}>Confirm password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  className={inputClasses}
                />
              </TextField>
            )}

            
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isDisabled={isSubmitting}
              isPending={isSubmitting}
              className="mt-2 h-12 rounded-xl bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700"
            >
              <span>
                {isSubmitting
                  ? "Please wait..."
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
              </span>

              {!isSubmitting && <ArrowRight size={18} />}
            </Button>
          </form>

          
          <div className="mt-7 border-t border-zinc-100 pt-6 text-center">
            <p className="text-sm text-zinc-500">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <Link
                to={isRegister ? "/login" : "/register"}
                className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
              >
                {isRegister ? "Sign in" : "Create account"}
              </Link>
            </p>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default AuthPage;
