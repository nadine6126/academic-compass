import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

const events = [
  { id: 1, title: "Hackathon 2025", date: "Apr 15, 2025", time: "9:00 AM", location: "Main Auditorium", attendees: 120, type: "Competition", free: true },
  { id: 2, title: "AI & Machine Learning Workshop", date: "Apr 18, 2025", time: "2:00 PM", location: "CS Lab 3", attendees: 45, type: "Workshop", free: true },
  { id: 3, title: "Career Fair - Tech Companies", date: "Apr 22, 2025", time: "10:00 AM", location: "Student Center", attendees: 300, type: "Career", free: true },
  { id: 4, title: "Guest Lecture: Blockchain", date: "Apr 25, 2025", time: "3:00 PM", location: "Room 201", attendees: 60, type: "Lecture", free: false },
];

const EventsPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Events</h1>
      <p className="text-muted-foreground">Discover campus events and activities.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((event) => (
        <Card key={event.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{event.title}</h3>
                <Badge variant="secondary" className="mt-1 text-xs">{event.type}</Badge>
              </div>
              {event.free ? <Badge className="bg-success text-success-foreground">Free</Badge> : <Badge variant="outline">Paid</Badge>}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{event.date}</div>
              <div className="flex items-center gap-2"><Clock className="w-3 h-3" />{event.time}</div>
              <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{event.location}</div>
              <div className="flex items-center gap-2"><Users className="w-3 h-3" />{event.attendees} attending</div>
            </div>
            <Button className="w-full" size="sm">Register</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default EventsPage;
