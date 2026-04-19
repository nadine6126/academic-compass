import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export const AIChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! 👋 I'm your PU Hub Assistant. Ask me about study groups, Q&A, events, or how to use anything in the app." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chatbot", { body: { messages: next } });
      if (error) throw error;
      setMessages([...next, { role: "assistant", content: data.reply ?? "…" }]);
    } catch (e: any) {
      toast.error(e.message ?? "Chatbot error");
      setMessages([...next, { role: "assistant", content: "Sorry, I had trouble responding. Try again in a moment." }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-card border rounded-2xl shadow-2xl flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">PU Hub Assistant</p>
                <p className="text-[10px] text-muted-foreground">Powered by Groq Llama</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-3" ref={scrollRef as any}>
            <div ref={scrollRef} className="space-y-2 max-h-full overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl px-3 py-2 text-sm text-muted-foreground">Thinking…</div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-3 flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
              placeholder="Ask anything…" disabled={busy} />
            <Button size="icon" onClick={send} disabled={busy || !input.trim()}><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </>
  );
};
