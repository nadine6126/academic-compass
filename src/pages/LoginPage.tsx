import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const DEMO_ACCOUNTS: Record<string, { email: string; password: string; name: string }> = {
  student:   { email: "demo.student@puhub.test",   password: "DemoPass123!", name: "Demo Student" },
  organizer: { email: "demo.organizer@puhub.test", password: "DemoPass123!", name: "Demo Organizer" },
  admin:     { email: "demo.admin@puhub.test",     password: "DemoPass123!", name: "Demo Admin" },
};

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => { if (session) navigate("/dashboard", { replace: true }); }, [session, navigate]);

  const doLogin = async (e_email: string, e_password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: e_email, password: e_password });
    if (error) throw error;
  };

  const doSignup = async (e_email: string, e_password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email: e_email, password: e_password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { display_name: displayName } },
    });
    if (error) throw error;
  };

  const handleDemoLogin = async (role: keyof typeof DEMO_ACCOUNTS) => {
    setBusy(true);
    const acc = DEMO_ACCOUNTS[role];
    try {
      try { await doLogin(acc.email, acc.password); }
      catch {
        await doSignup(acc.email, acc.password, acc.name);
        await doLogin(acc.email, acc.password);
      }
      toast.success(`Welcome, ${acc.name}!`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Demo login failed");
    } finally { setBusy(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isLogin) { await doLogin(email, password); toast.success("Welcome back!"); }
      else { await doSignup(email, password, name || email.split("@")[0]); toast.success("Account created — you're signed in."); }
      navigate("/dashboard");
    } catch (err: any) { toast.error(err.message ?? "Authentication failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">PU Academic Hub</span>
          </div>
          <p className="text-muted-foreground text-sm">Your campus learning companion</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-4">
            <div className="flex rounded-lg bg-secondary p-1">
              <button onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                Sign In
              </button>
              <button onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                Register
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="Password (min 6 chars)"
                  value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">Demo Quick Login</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDemoLogin("student")} disabled={busy} className="text-xs">
                  <GraduationCap className="w-3 h-3 mr-1" />Student
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDemoLogin("organizer")} disabled={busy} className="text-xs">
                  <User className="w-3 h-3 mr-1" />Organizer
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDemoLogin("admin")} disabled={busy} className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />Admin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
