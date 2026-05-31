import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, MessageCircle, Phone, Save, ShieldCheck, UserCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getAuthToken, redirectToLogin } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Irannetwork" }] }),
  component: ProfilePage,
});

type ProfileUser = {
  id: number;
  username: string;
  phone_number: string;
  bale_chat_id?: string | null;
  is_active: boolean;
};

type ProfileForm = {
  username: string;
  phone_number: string;
  bale_chat_id: string;
};

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

const emptyProfileForm: ProfileForm = {
  username: "",
  phone_number: "",
  bale_chat_id: "",
};

const emptyPasswordForm: PasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function getInitials(username: string) {
  const cleaned = username.trim();
  if (!cleaned) return "U";
  return cleaned.slice(0, 2).toUpperCase();
}

function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const API_BASE_URL = useMemo(() => {
    if (typeof window === "undefined") return "http://127.0.0.1:8000";
    return `http://${window.location.hostname}:8000`;
  }, []);

  const authHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadProfile = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: authHeaders(),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        toast.error(data?.detail || "برای مشاهده پروفایل باید دوباره وارد شوید");
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        toast.error(data?.detail || "خطا در دریافت اطلاعات پروفایل");
        return;
      }

      setUser(data);
      setProfileForm({
        username: data.username || "",
        phone_number: data.phone_number || "",
        bale_chat_id: data.bale_chat_id || "",
      });
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfileField = (field: keyof ProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePasswordField = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!profileForm.username.trim() || !profileForm.phone_number.trim()) {
      toast.error("نام کاربری و شماره موبایل الزامی است");
      return;
    }

    if (profileForm.bale_chat_id.trim() && !/^\d+$/.test(profileForm.bale_chat_id.trim())) {
      toast.error("شناسه عددی بله باید فقط شامل عدد باشد");
      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          username: profileForm.username.trim(),
          phone_number: profileForm.phone_number.trim(),
          bale_chat_id: profileForm.bale_chat_id.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        toast.error(data?.detail || "برای ذخیره پروفایل باید دوباره وارد شوید");
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        toast.error(data?.detail || "خطا در ذخیره پروفایل");
        return;
      }

      if (data?.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("access_token", data.access_token);
      }

      const nextUser = data?.user || data;
      setUser(nextUser);
      setProfileForm({
        username: nextUser.username || "",
        phone_number: nextUser.phone_number || "",
        bale_chat_id: nextUser.bale_chat_id || "",
      });

      toast.success("پروفایل با موفقیت ذخیره شد");
      window.dispatchEvent(new Event("profile-updated"));
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error("همه فیلدهای رمز عبور الزامی است");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error("رمز عبور جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("تکرار رمز عبور جدید درست نیست");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        toast.error(data?.detail || "برای تغییر رمز عبور باید دوباره وارد شوید");
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        toast.error(data?.detail || "خطا در تغییر رمز عبور");
        return;
      }

      setPasswordForm(emptyPasswordForm);
      toast.success("رمز عبور با موفقیت تغییر کرد");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
            <p className="text-muted-foreground mt-1.5">اطلاعات حساب کاربری، شماره موبایل، بله و رمز عبور خودت را مدیریت کن.</p>
          </div>

          <Badge variant={user?.is_active ? "default" : "secondary"} className="w-fit">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            {user?.is_active ? "Active Account" : "Inactive Account"}
          </Badge>
        </div>

        {loading ? (
          <Card className="p-10 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            در حال دریافت اطلاعات پروفایل...
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
            <Card className="overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent" />
              <CardContent className="-mt-10 space-y-5 p-6">
                <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
                  {getInitials(user?.username || "")}
                </div>

                <div>
                  <h2 className="text-xl font-semibold">{user?.username || "User"}</h2>
                  <p className="text-sm text-muted-foreground">Network Plan Account</p>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" /> Phone
                    </span>
                    <span className="font-medium ltr:font-mono">{user?.phone_number || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="h-4 w-4" /> Bale Chat ID
                    </span>
                    <span className="font-medium ltr:font-mono">{user?.bale_chat_id || "Not set"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" /> Account Information
                  </CardTitle>
                  <CardDescription>این اطلاعات برای ورود، OTP و ارسال کد بله استفاده می‌شود.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={profileForm.username}
                        onChange={(event) => updateProfileField("username", event.target.value)}
                        autoComplete="username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={profileForm.phone_number}
                        onChange={(event) => updateProfileField("phone_number", event.target.value)}
                        inputMode="tel"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Bale Numeric Chat ID</Label>
                      <Input
                        value={profileForm.bale_chat_id}
                        onChange={(event) => updateProfileField("bale_chat_id", event.target.value.replace(/\D/g, ""))}
                        inputMode="numeric"
                        placeholder="مثلاً 123456789"
                      />
                      <p className="text-xs text-muted-foreground">اگر خالی باشد، OTP فقط از کانال‌های دیگر ارسال می‌شود.</p>
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit" className="gap-2" disabled={savingProfile}>
                        {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Profile
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5" /> Change Password
                  </CardTitle>
                  <CardDescription>بعد از تغییر رمز، ورودهای بعدی با رمز جدید انجام می‌شود.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input
                        type="password"
                        value={passwordForm.current_password}
                        onChange={(event) => updatePasswordField("current_password", event.target.value)}
                        autoComplete="current-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input
                        type="password"
                        value={passwordForm.new_password}
                        onChange={(event) => updatePasswordField("new_password", event.target.value)}
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={(event) => updatePasswordField("confirm_password", event.target.value)}
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="md:col-span-3 flex justify-end">
                      <Button type="submit" variant="outline" className="gap-2" disabled={savingPassword}>
                        {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        Update Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
