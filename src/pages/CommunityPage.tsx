import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Post = {
  id: string; user_id: string; content: string; topic: string | null;
  likes: number; created_at: string; author_name?: string;
};

const initials = (n: string) => n.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

const CommunityPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    const { data: ps } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(100);
    const ids = [...new Set((ps ?? []).map((p: any) => p.user_id))];
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("user_id, display_name").in("user_id", ids)
      : { data: [] as any };
    const map: Record<string, string> = {};
    (profs ?? []).forEach((p: any) => { map[p.user_id] = p.display_name; });
    setPosts((ps ?? []).map((p: any) => ({ ...p, author_name: map[p.user_id] ?? "Student" })));
  };

  useEffect(() => { if (user) load(); }, [user]);

  useEffect(() => {
    const ch = supabase.channel("community").on("postgres_changes",
      { event: "*", schema: "public", table: "community_posts" }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({
      user_id: user!.id, content: text.trim(), topic: topic.trim() || null,
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    setText(""); setTopic("");
    toast.success("Posted!");
  };

  const handleLike = async (p: Post) => {
    await supabase.from("community_posts").update({ likes: p.likes + 1 }).eq("id", p.id);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("community_posts").delete().eq("id", id);
    toast.success("Deleted");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community</h1>
        <p className="text-muted-foreground text-sm">Sharing & networking dengan student lain.</p>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Apa yang lagi di pikiran kamu?"
            rows={3} maxLength={500} className="resize-none border-0 focus-visible:ring-0 px-0 text-base" />
          <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional, e.g. Tips, Question)" className="text-sm" />
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground">{text.length}/500</span>
            <Button size="sm" onClick={handlePost} disabled={posting || !text.trim()}>
              <Send className="w-3 h-3 mr-1" />{posting ? "Posting…" : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {posts.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Belum ada post. Jadilah yang pertama!</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <Card key={p.id}>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10"><AvatarFallback className="text-xs bg-secondary">{initials(p.author_name ?? "S")}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="font-medium text-foreground">{p.author_name}</span>
                      {p.topic && <Badge variant="secondary" className="text-[10px]">{p.topic}</Badge>}
                      <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                      {p.user_id === user?.id && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{p.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <button onClick={() => handleLike(p)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <Heart className="w-3 h-3" />{p.likes}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
