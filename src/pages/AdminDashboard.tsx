import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Shield, Users, MessageSquare, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { isAdmin, loading } = useUserRole();
  const [users, setUsers] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  const load = async () => {
    const [{ data: u }, { data: e }, { data: p }, { data: t }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("*").order("start_at", { ascending: false }),
      supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("questions").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("user_roles").select("*"),
    ]);
    const roleMap: Record<string, string[]> = {};
    ((roles ?? []) as any[]).forEach((r) => { (roleMap[r.user_id] ??= []).push(r.role); });
    setUsers(((u ?? []) as any[]).map((x) => ({ ...x, roles: roleMap[x.user_id] ?? [] })));
    setAllEvents((e ?? []) as any); setPosts((p ?? []) as any); setQuestions((t ?? []) as any);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event deleted"); load();
  };
  const deletePost = async (id: string) => {
    await supabase.from("community_posts").delete().eq("id", id);
    toast.success("Deleted"); load();
  };
  const deleteQuestion = async (id: string) => {
    await supabase.from("questions").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Users", value: users.length, icon: Users },
          { label: "Events", value: allEvents.length, icon: Calendar },
          { label: "Community Posts", value: posts.length, icon: MessageSquare },
          { label: "Questions", value: questions.length, icon: MessageSquare },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <s.icon className="w-4 h-4 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="posts">Community</TabsTrigger>
          <TabsTrigger value="qa">Q&A</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card><CardContent className="pt-4 space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}{u.student_id ? ` · ID: ${u.student_id}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  {u.roles.map((r: string) => <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-[10px]">{r}</Badge>)}
                </div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-2">
          {allEvents.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No events.</p> :
            allEvents.map(ev => (
              <Card key={ev.id}><CardContent className="pt-4 flex items-start justify-between gap-3">
                <div><p className="font-medium">{ev.title}</p><p className="text-xs text-muted-foreground">{new Date(ev.start_at).toLocaleString()} · {ev.location_or_link ?? "—"}</p></div>
                <Button size="icon" variant="ghost" onClick={() => deleteEvent(ev.id)}><Trash2 className="w-3 h-3" /></Button>
              </CardContent></Card>
            ))}
        </TabsContent>

        <TabsContent value="posts" className="space-y-2">
          {posts.map(p => (
            <Card key={p.id}><CardContent className="pt-4 flex items-start justify-between gap-3">
              <p className="text-sm flex-1">{p.body}</p>
              <Button size="icon" variant="ghost" onClick={() => deletePost(p.id)}><Trash2 className="w-3 h-3" /></Button>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="qa" className="space-y-2">
          {questions.map(t => (
            <Card key={t.id}><CardContent className="pt-4 flex items-start justify-between gap-3">
              <p className="text-sm flex-1">{t.body}</p>
              <Button size="icon" variant="ghost" onClick={() => deleteQuestion(t.id)}><Trash2 className="w-3 h-3" /></Button>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
