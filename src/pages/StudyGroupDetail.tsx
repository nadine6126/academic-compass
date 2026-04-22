import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Message = { id: string; user_id: string; content: string; created_at: string };
type Member = { user_id: string; full_name: string; avatar_url: string | null };

const initials = (n: string) => n.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

const StudyGroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, { name: string; avatar: string | null }>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => setTimeout(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, 50);

  const loadAll = async () => {
    if (!id) return;
    const { data: g } = await supabase.from("study_groups").select("*").eq("id", id).maybeSingle();
    setGroup(g);

    const { data: ms } = await supabase.from("study_group_members").select("user_id").eq("group_id", id);
    const memberIds = ((ms ?? []) as any[]).map((m) => m.user_id);

    if (memberIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", memberIds);
      const map: Record<string, { name: string; avatar: string | null }> = {};
      ((profs ?? []) as any[]).forEach((p) => { map[p.user_id] = { name: p.full_name, avatar: p.avatar_url }; });
      setProfileMap(map);
      setMembers(memberIds.map(uid => ({ user_id: uid, full_name: map[uid]?.name ?? "Member", avatar_url: map[uid]?.avatar ?? null })));
    }

    const { data: msgs, error } = await supabase
      .from("group_messages").select("*").eq("group_id", id).order("created_at");
    if (error) { toast.error(error.message); return; }
    setMessages((msgs ?? []) as any);
    scrollDown();
  };

  useEffect(() => { if (user && id) loadAll(); }, [user, id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`group-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${id}` },
        async (payload) => {
          const m = payload.new as Message;
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
          if (!profileMap[m.user_id]) {
            const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", m.user_id).maybeSingle();
            if (data) setProfileMap(p => ({ ...p, [m.user_id]: { name: (data as any).full_name, avatar: (data as any).avatar_url } }));
          }
          scrollDown();
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "study_group_members", filter: `group_id=eq.${id}` },
        () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const send = async () => {
    if (!text.trim() || !id || !user) return;
    setSending(true);
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("group_messages").insert({ group_id: id, user_id: user.id, content });
    setSending(false);
    if (error) { toast.error(error.message); setText(content); }
  };

  const leaveGroup = async () => {
    if (!id || !user) return;
    const { error } = await supabase.from("study_group_members").delete().eq("group_id", id).eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Left the group");
    navigate("/dashboard/study-groups");
  };

  if (!group) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/study-groups")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{group.name}</h1>
            <p className="text-sm text-muted-foreground truncate">{group.course_name ?? "—"} · {members.length} members</p>
          </div>
        </div>
        {group.creator_id !== user?.id && (
          <Button variant="outline" size="sm" onClick={leaveGroup}>
            <LogOut className="w-3 h-3 mr-1" />Leave
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 flex-1 min-h-0">
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hi 👋</p>
            )}
            {messages.map(m => {
              const mine = m.user_id === user?.id;
              const prof = profileMap[m.user_id];
              const name = prof?.name ?? "Member";
              return (
                <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && (
                    <Avatar className="w-8 h-8 shrink-0">
                      {prof?.avatar && <AvatarImage src={prof.avatar} alt={name} />}
                      <AvatarFallback className="text-xs bg-secondary">{initials(name)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}>
                    {!mine && <p className="text-xs font-medium mb-0.5 opacity-80">{name}</p>}
                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t p-3 flex gap-2 shrink-0 bg-card">
            <Input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message…" disabled={sending} />
            <Button onClick={send} disabled={sending || !text.trim()} size="icon"><Send className="w-4 h-4" /></Button>
          </div>
        </Card>

        <div className="space-y-4 overflow-y-auto">
          {group.description && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">About</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {group.description}
                {group.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {group.tags.map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.map(m => (
                <div key={m.user_id} className="flex items-center gap-2 text-sm">
                  <Avatar className="w-7 h-7">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.full_name} />}
                    <AvatarFallback className="text-xs bg-secondary">{initials(m.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-foreground truncate">{m.full_name}</span>
                  {m.user_id === group.creator_id && <Badge variant="outline" className="text-[10px] ml-auto">Owner</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudyGroupDetail;
