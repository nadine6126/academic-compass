// Edge Function: AI Chatbot — quick assistant for navigating the platform.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SYSTEM_PROMPT = `You are PU Hub Assistant, a friendly, concise helper inside the PU Academic Hub web app.
You help students:
- Navigate the platform (Dashboard, Study Groups, Community, Q&A Forum, Events, Calendar, Profile)
- Find or create study groups
- Post anonymously in Q&A
- Use the AI Summary feature on long threads
Keep answers short (max 4 sentences), friendly, and use bullet points when listing options.
If asked something outside the platform, give a brief helpful answer but steer back to study tools.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-12)],
        temperature: 0.5,
        max_tokens: 600,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("Groq error", r.status, t);
      return new Response(JSON.stringify({ error: `Groq API error (${r.status})` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chatbot error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
