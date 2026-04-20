import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

const THEME_PRESETS = [
  { name: "Default Blue", primary: "221.2 83.2% 53.3%" },
  { name: "Emerald", primary: "160 84% 39%" },
  { name: "Rose", primary: "346 77% 49%" },
  { name: "Violet", primary: "262 83% 58%" },
  { name: "Orange", primary: "24 95% 53%" },
  { name: "Slate", primary: "215 28% 17%" },
];

const ProfilePage = () => {
  const { user } = useAuth();
  const { roles } = useUserRole();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ display_name: "", bio: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setForm({ display_name: data?.display_name ?? "", bio: data?.bio ?? "" });
      });
    const saved = localStorage.getItem("theme_primary");
    if (saved) document.documentElement.style.setProperty("--primary", saved);
  }, [user]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ display_name: form.display_name, bio: form.bio })
      .eq("user_id", user!.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
  };

  const applyTheme = (primary: string) => {
    document.documentElement.style.setProperty("--primary", primary);
    localStorage.setItem("theme_primary", primary);
    toast.success("Theme applied");
  };

  const initials = (form.display_name || "?").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm">Kelola akun & personalisasi tampilan kamu.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">{initials}</div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{form.display_name || "—"}</p>
              <div className="flex gap-1 flex-wrap">
                {roles.map(r => <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="capitalize text-[10px]">{r}</Badge>)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={profile?.email ?? user?.email ?? ""} disabled className="mt-1" /></div>
            {profile?.student_id && <div><Label>Student ID</Label><Input value={profile.student_id} disabled className="mt-1" /></div>}
          </div>
          <div><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="mt-1" placeholder="Tell us about yourself…" /></div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Palette className="w-4 h-4" />Theme Customization</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Pilih warna utama untuk tampilan kamu.</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {THEME_PRESETS.map(t => (
              <button key={t.name} onClick={() => applyTheme(t.primary)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full border-2 border-border" style={{ backgroundColor: `hsl(${t.primary})` }} />
                <span className="text-[10px] text-muted-foreground text-center">{t.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
