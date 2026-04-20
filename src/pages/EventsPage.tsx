import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Plus, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

type EventRow = {
  id: string; organizer_id: string; title: string; description: string | null;
  event_date: string; event_time: string | null; location: string | null;
  event_type: string | null; is_free: boolean; max_attendees: number | null;
  status: string; rsvp_count?: number; user_rsvped?: boolean;
};

const EventsPage = () => {
  const { user } = useAuth();
  const { isAdmin, isOrganizer } = useUserRole();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tab, setTab] = useState("approved");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", event_date: "", event_time: "",
    location: "", event_type: "webinar", is_free: true, max_attendees: 50,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: evs } = await supabase.from("events").select("*").order("event_date");
    const ids = (evs ?? []).map((e: any) => e.id);
    const { data: rsvps } = ids.length
      ? await supabase.from("event_rsvps").select("event_id, user_id").in("event_id", ids)
      : { data: [] as any };
    const counts: Record<string, number> = {};
    const mineMap: Record<string, boolean> = {};
    (rsvps ?? []).forEach((r: any) => {
      counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
      if (r.user_id === user?.id) mineMap[r.event_id] = true;
    });
    setEvents((evs ?? []).map((e: any) => ({
      ...e, rsvp_count: counts[e.id] ?? 0, user_rsvped: !!mineMap[e.id],
    })));
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleCreate = async () => {
    if (!form.title || !form.event_date) { toast.error("Title & tanggal wajib"); return; }
    setSaving(true);
    const { error } = await supabase.from("events").insert({
      organizer_id: user!.id,
      title: form.title, description: form.description || null,
      event_date: form.event_date, event_time: form.event_time || null,
      location: form.location || null, event_type: form.event_type,
      is_free: form.is_free, max_attendees: form.max_attendees,
      status: isAdmin ? "approved" : "pending",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isAdmin ? "Event published!" : "Submitted for admin approval");
    setOpen(false);
    setForm({ title: "", description: "", event_date: "", event_time: "", location: "", event_type: "webinar", is_free: true, max_attendees: 50 });
    load();
  };

  const rsvp = async (ev: EventRow) => {
    if (ev.user_rsvped) {
      await supabase.from("event_rsvps").delete().eq("event_id", ev.id).eq("user_id", user!.id);
      toast.success("RSVP dibatalkan");
    } else {
      const { error } = await supabase.from("event_rsvps").insert({ event_id: ev.id, user_id: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Kamu terdaftar!");
    }
    load();
  };

  const moderate = async (ev: EventRow, status: "approved" | "rejected") => {
    const { error } = await supabase.from("events").update({ status }).eq("id", ev.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Event ${status}`);
    load();
  };

  const approved = events.filter(e => e.status === "approved");
  const pending = events.filter(e => e.status === "pending");
  const mine = events.filter(e => e.organizer_id === user?.id);

  const renderCard = (ev: EventRow) => (
    <Card key={ev.id} className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{ev.title}</h3>
            <Badge variant="outline" className="text-xs mt-1">{ev.event_type}</Badge>
          </div>
          <Badge variant={ev.is_free ? "secondary" : "default"} className="text-xs">{ev.is_free ? "Free" : "Paid"}</Badge>
        </div>
        {ev.description && <p className="text-sm text-muted-foreground line-clamp-2">{ev.description}</p>}
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{format(parseISO(ev.event_date), "PPP")}{ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ""}</div>
          {ev.location && <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{ev.location}</div>}
          <div className="flex items-center gap-2"><Users className="w-3 h-3" />{ev.rsvp_count}{ev.max_attendees ? ` / ${ev.max_attendees}` : ""} attendees</div>
        </div>
        {ev.status === "pending" && isAdmin ? (
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={() => moderate(ev, "approved")}>Approve</Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => moderate(ev, "rejected")}>Reject</Button>
          </div>
        ) : ev.status === "approved" ? (
          <Button size="sm" variant={ev.user_rsvped ? "outline" : "default"} className="w-full" onClick={() => rsvp(ev)}>
            {ev.user_rsvped ? <><CheckCircle2 className="w-3 h-3 mr-1" />Registered</> : "Register"}
          </Button>
        ) : (
          <Badge variant="outline" className="w-full justify-center py-1">Status: {ev.status}</Badge>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events & Webinars</h1>
          <p className="text-muted-foreground text-sm">
            {isOrganizer ? "Kelola event kampusmu." : "Daftar event akademik mendatang."}
          </p>
        </div>
        {isOrganizer ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Submit Event</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Submit Event Baru</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Deskripsi</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Tanggal</Label><Input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
                  <div><Label>Waktu</Label><Input type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} /></div>
                </div>
                <div><Label>Lokasi</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Hall A / Zoom" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Max Attendees</Label><Input type="number" value={form.max_attendees} onChange={e => setForm({ ...form, max_attendees: parseInt(e.target.value) || 0 })} /></div>
                  <div><Label>Type</Label><Input value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} placeholder="webinar/workshop" /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={handleCreate} disabled={saving}>{saving ? "Saving…" : (isAdmin ? "Publish" : "Submit for Approval")}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <p className="text-xs text-muted-foreground italic max-w-xs">Untuk post event, hubungi admin: <strong>admin@admin.president.ac.id</strong></p>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          {isOrganizer && <TabsTrigger value="mine">Mine ({mine.length})</TabsTrigger>}
          {isAdmin && <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>}
        </TabsList>
        <TabsContent value="approved">
          {approved.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Belum ada event.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{approved.map(renderCard)}</div>
          )}
        </TabsContent>
        {isOrganizer && (
          <TabsContent value="mine">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{mine.map(renderCard)}</div>
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="pending">
            {pending.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No pending events.</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{pending.map(renderCard)}</div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default EventsPage;
