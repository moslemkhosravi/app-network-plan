import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Network, RefreshCcw } from "lucide-react";
import { hasValidAuthToken } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"login" | "otp">("login");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (hasValidAuthToken()) {
      navigate({ to: "/", replace: true });
    }
  }, [navigate]);

  const API_BASE_URL = useMemo(() => {
    if (typeof window === "undefined") return "http://127.0.0.1:8000";
    return `http://${window.location.hostname}:8000`;
  }, []);

  const canResend = step === "otp" && resendSeconds <= 0 && !loading && !resendLoading;

  useEffect(() => {
    if (step !== "otp" || resendSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [step, resendSeconds]);

  const startResendTimer = (seconds = 120) => {
    setResendSeconds(seconds);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("نام کاربری و رمز عبور الزامی است");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("کد تایید ارسال شد");
        setStep("otp");
        setOtp("");
        startResendTimer(data?.resend_after_seconds || 120);
      } else {
        toast.error(data?.detail || "نام کاربری یا رمز عبور اشتباه است");
      }
    } catch {
      toast.error("خطای اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setResendLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("کد تایید مجدد ارسال شد");
        setOtp("");
        startResendTimer(data?.resend_after_seconds || 120);
        return;
      }

      if (res.status === 429) {
        const remaining =
          typeof data?.detail?.remaining_seconds === "number"
            ? data.detail.remaining_seconds
            : 120;

        startResendTimer(remaining);
        toast.error(data?.detail?.message || "هنوز امکان ارسال مجدد وجود ندارد");
        return;
      }

      toast.error(data?.detail || "خطا در ارسال مجدد کد");
    } catch {
      toast.error("خطای اتصال به سرور");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("کد تایید را وارد کن");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          otp_code: otp.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
        }

        toast.success("ورود با موفقیت انجام شد");
        navigate({ to: "/", replace: true });
      } else {
        toast.error(data?.detail || "کد تایید اشتباه یا منقضی شده است");
      }
    } catch {
      toast.error("خطای اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setStep("login");
    setOtp("");
    setResendSeconds(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Network className="h-6 w-6 text-primary" />
          </div>

          <CardTitle className="text-2xl">Irannetwork</CardTitle>

          <CardDescription>
            {step === "login"
              ? "Enter your credentials to manage infrastructure"
              : "کد تایید ارسال‌شده از SMS یا بله را وارد کن"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button className="w-full" disabled={loading}>
                {loading ? "در حال بررسی..." : "Login"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center tracking-widest text-lg font-mono"
                  required
                />
              </div>

              <Button className="w-full" disabled={loading}>
                {loading ? "در حال تایید..." : "Confirm Code"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={!canResend}
                onClick={handleResendOtp}
              >
                <RefreshCcw className="h-4 w-4" />
                {resendLoading
                  ? "در حال ارسال..."
                  : canResend
                    ? "ارسال مجدد کد"
                    : `ارسال مجدد تا ${resendSeconds} ثانیه دیگر`}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-xs text-muted-foreground"
                onClick={backToLogin}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
