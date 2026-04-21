import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mammoth from "mammoth";

type Result = { summary: string; topics?: string[]; key_points?: string[] };

const AISummaryPage = () => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [fileName, setFileName] = useState("");

  const extractFromFile = async (file: File): Promise<string> => {
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext === "txt" || ext === "md") return await file.text();
    if (ext === "docx") {
      const buf = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
      return value;
    }
    if (ext === "pdf") {
      const pdfjs = await import("pdfjs-dist");
      // @ts-ignore
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      let out = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        out += content.items.map((it: any) => it.str).join(" ") + "\n";
      }
      return out;
    }
    throw new Error("Unsupported file type. Use PDF, DOCX, TXT, or MD.");
  };

  const handleFile = async (file: File) => {
    setBusy(true); setFileName(file.name);
    try {
      const extracted = await extractFromFile(file);
      if (extracted.trim().length < 20) throw new Error("Could not extract enough text from the file.");
      setText(extracted);
      toast.success(`Extracted ${extracted.length.toLocaleString()} characters`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to read file");
      setFileName("");
    } finally { setBusy(false); }
  };

  const summarize = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 20) { toast.error("Please provide at least 20 characters."); return; }
    setBusy(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-summary", { body: { text: trimmed } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast.success("Summary generated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to summarize");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> AI Summary
        </h1>
        <p className="text-muted-foreground">Paste long text or upload a document to get an academic summary.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Input</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="cursor-pointer">
              <input type="file" accept=".pdf,.docx,.txt,.md" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} disabled={busy} />
              <Button variant="outline" size="sm" asChild disabled={busy}>
                <span><Upload className="w-3.5 h-3.5 mr-1.5" /> Upload PDF/DOCX/TXT</span>
              </Button>
            </label>
            {fileName && <Badge variant="secondary" className="gap-1"><FileText className="w-3 h-3" />{fileName}</Badge>}
            {text && (
              <Button variant="ghost" size="sm" onClick={() => { setText(""); setFileName(""); setResult(null); }}>
                Clear
              </Button>
            )}
          </div>
          <Textarea value={text} onChange={e => setText(e.target.value)} rows={12}
            placeholder="Paste your text, paragraph, or article here…" disabled={busy} />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{text.length.toLocaleString()} characters</p>
            <Button onClick={summarize} disabled={busy || text.trim().length < 20}>
              {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Working…</> : <><Sparkles className="w-4 h-4 mr-2" />Summarize</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Result</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Summary</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result.summary}</p>
            </div>
            {result.topics && result.topics.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Topics</h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.topics.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
              </div>
            )}
            {result.key_points && result.key_points.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Key Points</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                  {result.key_points.map((k, i) => <li key={i}>{k}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISummaryPage;
