import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, MessageSquare, Plus, Sparkles, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Thread = {
  id: string; user_id: string; title: string; body: string;
  is_anonymous: boolean; tags: string[] | null; created_at: string;
  reply_count?: number; author_name?: string;
};

const QAForum = () => {
  const [search, setSearch] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", tags: "" });
  const [posting, setPosting] = useState(false);

  const [summaryFor, setSummaryFor] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("qa_threads")
      .select("*, qa_replies(id), profiles!qa_threads_user_id_fkey(display_name)")
      .order("created_at", { ascending: false });
    if (error) {
      // fallback without join
      const { data: ts } = await supabase.from("qa_threads").select("*").order("created_at", { ascending: false });
      setThreads(ts ?? []);
    } else {
      setThreads((data ?? []).map((t: any) => ({
        ...t,
        reply_count: t.qa_replies?.length ?? 0,
        author_name: t.profiles?.display_name ?? "Student",
      })));
    }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handlePost = async () => {
    if (!form.title || !form.body) { toast.error("Title and body required"); return; }
    setPosting(true);
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from("qa_threads").insert({
      user_id: user!.id, title: form.title, body: form.body, tags, is_anonymous: anonymous,
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Question posted!");
    setOpen(false);
    setForm({ title: "", body: "", tags: "" });
    load();
  };

  const summarize = async (t: Thread) => {
    setSummaryFor(t.id); setSummaryData(null); setSummaryLoading(true);
    try {
      // gather thread + replies
      const { data: replies } = await supabase.from("qa_replies").select("body").eq("thread_id", t.id).order("created_at");
      const text = `Question: ${t.title}\n\n${t.body}\n\nReplies:\n${(replies ?? []).map((r, i) => `${i + 1}. ${r.body}`).join("\n")}`;
      const { data, error } = await supabase.functions.invoke("ai-summary", { body: { text } });
      if (error) throw error;
      setSummaryData(data);
    } catch (e: any) {
      toast.error(e.message ?? "Summary failed");
      setSummaryFor(null);
    } finally { setSummaryLoading(false); }
  };

  const filtered = threads.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Q&A Forum</h1>
          <p className="text-muted-foreground">Ask questions, share knowledge, summarize long threads with AI.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={anonymous} onCheckedChange={setAnonymous} id="anon" />
            <Label htmlFor="anon" className="text-sm text-muted-foreground cursor-pointer">Post Anonymously</Label>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Ask Question</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Ask a Question</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Be specific…" /></div>
                <div><Label>Details</Label><Textarea rows={5} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Explain your problem…" /></div>
                <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="CS201, Algorithms" /></div>
                <p className="text-xs text-muted-foreground">Posting as: <strong>{anonymous ? "Anonymous" : "your name"}</strong></p>
              </div>
              <DialogFooter>
                <Button onClick={handlePost} disabled={posting}>{posting ? "Posting…" : "Post Question"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          No questions yet. Be the first to ask!
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-foreground">{t.title}</h3>
                  <Button variant="outline" size="sm" onClick={() => summarize(t)} className="shrink-0">
                    <Sparkles className="w-3 h-3 mr-1" />Summarize
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{t.body}</p>
                {t.tags && t.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>{t.is_anonymous ? "Anonymous" : t.author_name}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{t.reply_count ?? 0} replies</span>
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Summary modal */}
      <Dialog open={!!summaryFor} onOpenChange={(o) => !o && setSummaryFor(null)}>
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
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</p>
                <p className="text-sm text-foreground">{summaryData.summary}</p>
              </div>
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
