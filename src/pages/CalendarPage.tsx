import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

const upcoming = [
  { title: "CS201 Assignment Due", date: "Apr 12", type: "deadline", color: "bg-destructive" },
  { title: "Study Group Meeting", date: "Apr 13", type: "meeting", color: "bg-primary" },
  { title: "Hackathon 2025", date: "Apr 15", type: "event", color: "bg-success" },
  { title: "MATH202 Midterm", date: "Apr 18", type: "exam", color: "bg-warning" },
  { title: "Career Fair", date: "Apr 22", type: "event", color: "bg-success" },
];

const CalendarPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
      <p className="text-muted-foreground">Your upcoming schedule at a glance.</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5 text-primary" /> Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcoming.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "Deadline", color: "bg-destructive" },
              { label: "Meeting", color: "bg-primary" },
              { label: "Event", color: "bg-success" },
              { label: "Exam", color: "bg-warning" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${l.color}`} />
                <span className="text-sm text-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default CalendarPage;
