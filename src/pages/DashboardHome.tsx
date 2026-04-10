import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Calendar, MessageCircle } from "lucide-react";

const stats = [
  { label: "Study Groups", value: "4", icon: Users, change: "+1 this week" },
  { label: "Courses", value: "6", icon: BookOpen, change: "2 active" },
  { label: "Upcoming Events", value: "3", icon: Calendar, change: "Next: Tomorrow" },
  { label: "Q&A Posts", value: "12", icon: MessageCircle, change: "3 unread" },
];

const recentGroups = [
  { name: "Data Structures Study Group", members: 8, subject: "CS201" },
  { name: "Calculus II Review", members: 12, subject: "MATH202" },
  { name: "Physics Lab Partners", members: 4, subject: "PHY101" },
];

const DashboardHome = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome Back, John! 👋</h1>
        <p className="text-muted-foreground">Here's what's happening in your academic life.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Study Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Study Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentGroups.map((group) => (
              <div key={group.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">{group.name}</p>
                  <p className="text-sm text-muted-foreground">{group.subject}</p>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {group.members}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
