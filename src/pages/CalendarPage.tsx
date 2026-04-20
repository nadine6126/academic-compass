import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Bell, CalendarDays } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type CalEvent = {
  id: string; title: string; description: string | null;
  event_date: string; event_time: string | null;
  event_type: string; reminder_minutes: number | null; reminded: boolean;
};

const TYPE_COLORS: Record<string, string> = {
  task: "bg-primary",
  meeting: "bg-accent",
  deadline: "bg-destructive",
  exam: "bg-orange-500",
  other: "bg-muted-foreground",
};

const CalendarPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", event_date: format(new Date(), "yyyy-MM-dd"),
    event_time: "", event_type: "task", reminder_minutes: 60,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("calendar_events")
      .select("*").eq("user_id", user.id).order("event_date");
    if (error) { toast.error(error.message); return; }
    setEvents(data ?? []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      events.forEach((ev) => {
        if (ev.reminded || !ev.reminder_minutes) return;
        const dt = ev.event_time
          ? new Date(`${ev.event_date}T${ev.event_time}`)
          : new Date(`${ev.event_date}T09:00`);
        const diffMin = (dt.getTime() - now.getTime()) / 60000;
        if (diffMin <= ev.reminder_minutes && diffMin >= 0) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`📅 ${ev.title}`, { body: ev.description ?? `Dimulai ${format(dt, "HH:mm")}` });
          }
          toast.info(`Reminder: ${ev.title}`, { description: format(dt, "PPp") });
          supabase.from("calendar_events").update({ reminded: true }).eq("id", ev.id).then(() => load());
        }
      });
    };
    const t = setInterval(tick, 30000);
    tick();
    return () => clearInterval(t);
  }, [events]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.event_date) { toast.error("Title & tanggal wajib"); return; }
    setSaving(true);
    const { error } = await supabase.from("calendar_events").insert({
      user_id: user!.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      event_time: form.event_time || null,
      event_type: form.event_type,
      reminder_minutes: form.reminder_minutes,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Event ditambahkan!");
    setOpen(false);
    setForm({ title: "", description: "", event_date: format(selected ?? new Date(), "yyyy-MM-dd"),
      event_time: "", event_type: "task", reminder_minutes: 60 });
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Dihapus");
    load();
  };

  const eventDates = events.map(e => parseISO(e.event_date));
  const dayEvents = selected ? events.filter(e => isSameDay(parseISO(e.event_date), selected)) : [];
  const upcoming = events.filter(e => parseISO(e.event_date) >= new Date(new Date().toDateString())).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground text-sm">Kelola deadline, meeting, dan reminder pribadimu.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(f => ({ ...f, event_date: selected ? format(selected, "yyyy-MM-dd") : f.event_date }))}>
              <Plus className="w-4 h-4 mr-2" />Tambah Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Event Baru</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Tugas DSA" /></div>
              <div><Label>Deskripsi (opsional)</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Tanggal</Label><Input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
                <div><Label>Waktu (opsional)</Label><Input type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tipe</Label>
                  <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reminder</Label>
                  <Select value={String(form.reminder_minutes)} onValueChange={v => setForm({ ...form, reminder_minutes: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No reminder</SelectItem>
                      <SelectItem value="15">15 min sebelum</SelectItem>
                      <SelectItem value="60">1 jam sebelum</SelectItem>
                      <SelectItem value="1440">1 hari sebelum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Simpan"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <Card>
          <CardContent className="p-2">
            <CalendarUI
              mode="single"
              selected={selected}
              onSelect={setSelected}
              modifiers={{ hasEvent: eventDates }}
              modifiersClassNames={{ hasEvent: "font-bold underline decoration-primary decoration-2 underline-offset-2" }}
              className="pointer-events-auto"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {selected ? format(selected, "PPP") : "Pilih tanggal"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Tidak ada event hari ini.</p>
              ) : dayEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className={`w-2 h-2 rounded-full mt-2 ${TYPE_COLORS[ev.event_type] ?? "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{ev.title}</p>
                    {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{ev.event_type}</Badge>
                      {ev.event_time && <span>{ev.event_time.slice(0, 5)}</span>}
                      {ev.reminder_minutes ? <span className="flex items-center gap-1"><Bell className="w-3 h-3" />{ev.reminder_minutes}min</span> : null}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)} className="h-7 w-7">
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Upcoming</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Belum ada event mendatang.</p>
              ) : upcoming.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelected(parseISO(ev.event_date))}>
                  <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[ev.event_type] ?? "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(ev.event_date), "PPP")}{ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ""}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
