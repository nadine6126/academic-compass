import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Clock, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

type CalEvent = {
  id: string; title: string; description: string | null;
  event_date: string; event_time: string | null; event_type: string;
  reminder_minutes: number | null; reminded: boolean;
};

const TYPE_COLORS: Record<string, string> = {
  task: "bg-primary/10 text-primary",
  exam: "bg-destructive/10 text-destructive",
  deadline: "bg-warning/10 text-warning",
  class: "bg-info/10 text-info",
  other: "bg-secondary text-secondary-foreground",
};

const CalendarPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selected, setSelected] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", event_date: format(new Date(), "yyyy-MM-dd"),
    event_time: "", event_type: "task", reminder_minutes: 60,
  });

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("calendar_events")
      .select("*").eq("user_id", user.id).order("event_date");
    if (error) { toast.error(error.message); return; }
    setEvents(data ?? []);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const tick = async () => {
      const now = new Date();
      for (const ev of events) {
        if (ev.reminded || !ev.reminder_minutes || !ev.event_time) continue;
        const dt = new Date(`${ev.event_date}T${ev.event_time}`);
        const remindAt = new Date(dt.getTime() - ev.reminder_minutes * 60000);
        if (now >= remindAt && now <= dt) {
          toast.info(`⏰ ${ev.title}`, { description: `In ${ev.reminder_minutes} min` });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(`Reminder: ${ev.title}`, { body: ev.description ?? "" });
          }
          await supabase.from("calendar_events").update({ reminded: true }).eq("id", ev.id);
          load();
        }
      }
    };
    const t = setInterval(tick, 30000);
    tick();
    return () => clearInterval(t);
  }, [events]);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("calendar_events").insert({
      user_id: user!.id, title: form.title, description: form.description || null,
      event_date: form.event_date, event_time: form.event_time || null,
      event_type: form.event_type, reminder_minutes: form.reminder_minutes,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Added to calendar");
    setOpen(false);
    setForm({ title: "", description: "", event_date: format(selected, "yyyy-MM-dd"), event_time: "", event_type: "task", reminder_minutes: 60 });
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  };

  const eventDates = useMemo(() => events.map(e => parseISO(e.event_date)), [events]);
  const dayEvents = events.filter(e => e.event_date === format(selected, "yyyy-MM-dd"));
  const upcoming = events.filter(e => e.event_date >= format(new Date(), "yyyy-MM-dd")).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Track deadlines, exams, and reminders.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Event</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Calendar Event</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Math Midterm" /></div>
              <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
                <div><Label>Time (optional)</Label><Input type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Remind me</Label>
                  <Select value={String(form.reminder_minutes)} onValueChange={v => setForm({ ...form, reminder_minutes: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No reminder</SelectItem>
                      <SelectItem value="15">15 min before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                      <SelectItem value="1440">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Event"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <Card>
          <CardContent className="p-3">
            <CalendarUI mode="single" selected={selected} onSelect={d => d && setSelected(d)}
              modifiers={{ hasEvent: eventDates }}
              modifiersClassNames={{ hasEvent: "font-bold text-primary" }} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">{format(selected, "EEEE, MMM d, yyyy")}</CardTitle></CardHeader>
            <CardContent>
              {dayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No events on this day.</p>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">{e.title}</p>
                          <Badge className={`text-[10px] ${TYPE_COLORS[e.event_type] ?? TYPE_COLORS.other}`}>{e.event_type}</Badge>
                        </div>
                        {e.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{e.description}</p>}
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          {e.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.event_time.slice(0, 5)}</span>}
                          {e.reminder_minutes ? <span className="flex items-center gap-1"><Bell className="w-3 h-3" />{e.reminder_minutes >= 60 ? `${e.reminder_minutes/60}h` : `${e.reminder_minutes}m`}</span> : null}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Upcoming</CardTitle></CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nothing upcoming.</p>
              ) : (
                <div className="space-y-1">
                  {upcoming.map(e => (
                    <button key={e.id} onClick={() => setSelected(parseISO(e.event_date))}
                      className="w-full text-left flex items-center justify-between p-2 rounded hover:bg-accent">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(e.event_date), "MMM d")}{e.event_time ? ` · ${e.event_time.slice(0, 5)}` : ""}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{e.event_type}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
