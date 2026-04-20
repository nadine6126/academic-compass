import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Sparkles, Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Thread = {
  id: string; user_id: string; title: string; body: string;
  is_anonymous: boolean; created_at: string;
  reply_count?: number; author_name?: string;
};

const initials = (n: string) => n.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

const QAForum = () => {
  const [anonymous, setAnonymous] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    const { data: ts } = await supabase.from("qa_threads").select("*").order("created_at", { ascending: false });
    const userIds = [...new Set((ts ?? []).map((t: any) => t.user_id))];
    const { data: profs } = userIds.length
      ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
      : { data: [] as any };
    const map: Record<string, string> = {};
    (profs ?? []).forEach((p: any) => { map[p.user_id] = p.display_name; });

    const { data: replies } = await supabase.from("qa_replies").select("thread_id");
    const counts: Record<string, number> = {};
    (replies ?? []).forEach((r: any) => { counts[r.thread_id] = (counts[r.thread_id] ?? 0) + 1; });

    setThreads((ts ?? []).map((t: any) => ({
      ...t,
      reply_count: counts[t.id] ?? 0,
      author_name: map[t.user_id] ?? "Student",
    })));
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handlePost = async () => {
    const content = text.trim();
    if (!content) return;
    if (content.length > 500) { toast.error("Maksimal 500 karakter"); return; }
    setPosting(true);
    // Use first 80 chars as title for compatibility with existing schema
    const title = content.slice(0, 80);
    const { error } = await supabase.from("qa_threads").insert({
      user_id: user!.id, title, body: content, tags: [], is_anonymous: anonymous,
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Posted!");
    setText("");
    load();
  };

  const summarize = async (t: Thread) => {
    setSummaryOpen(true); setSummaryData(null); setSummaryLoading(true);
    try {
      const { data: replies } = await supabase.from("qa_replies").select("body").eq("thread_id", t.id).order("created_at");
      const text = `Question: ${t.body}\n\nReplies:\n${(replies ?? []).map((r, i) => `${i + 1}. ${r.body}`).join("\n")}`;
      const { data, error } = await supabase.functions.invoke("ai-summary", { body: { text } });
      if (error) throw error;
      setSummaryData(data);
    } catch (e: any) {
      toast.error(e.message ?? "Summary failed");
      setSummaryOpen(false);
    } finally { setSummaryLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Q&A Forum</h1>
        <p className="text-muted-foreground text-sm">Tanya apapun seperti ngetweet — singkat & langsung.</p>
      </div>

      {/* Compose */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Apa pertanyaanmu? (max 500 karakter)"
            rows={3}
            maxLength={500}
            className="resize-none border-0 focus-visible:ring-0 px-0 text-base"
          />
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2">
              <Switch checked={anonymous} onCheckedChange={setAnonymous} id="anon" />
              <Label htmlFor="anon" className="text-xs text-muted-foreground cursor-pointer">Anonymous</Label>
              <span className="text-xs text-muted-foreground ml-2">{text.length}/500</span>
            </div>
            <Button size="sm" onClick={handlePost} disabled={posting || !text.trim()}>
              <Send className="w-3 h-3 mr-1" />{posting ? "Posting…" : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : threads.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Belum ada pertanyaan. Jadilah yang pertama!
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {threads.map((t) => {
            const author = t.is_anonymous ? "Anonymous" : t.author_name ?? "Student";
            return (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="text-xs bg-secondary">{initials(author)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">{author}</span>
                        {t.is_anonymous && <Badge variant="outline" className="text-[10px]">Anon</Badge>}
                        <span className="text-muted-foreground text-xs">· {new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{t.body}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{t.reply_count} replies</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => summarize(t)}>
                          <Sparkles className="w-3 h-3 mr-1" />AI Summary
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />AI Summary</DialogTitle>
          </DialogHeader>
          {summaryLoading ? (
            <div className="py-8 flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />Generating summary…
            </div>
          ) : summaryData ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground">{summaryData.summary}</p>
              {summaryData.topics?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Topics</p>
                  <div className="flex flex-wrap gap-1">
                    {summaryData.topics.map((tp: string) => <Badge key={tp} variant="secondary">{tp}</Badge>)}
                  </div>
                </div>
              )}
              {summaryData.key_points?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Key Points</p>
                  <ul className="text-sm text-foreground list-disc pl-5 space-y-1">
                    {summaryData.key_points.map((k: string, i: number) => <li key={i}>{k}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QAForum;
