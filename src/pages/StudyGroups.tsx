import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Plus } from "lucide-react";

const groups = [
  { id: 1, name: "Data Structures & Algorithms", subject: "CS201", members: 8, maxMembers: 15, tags: ["Computer Science", "Coding"], description: "Weekly problem-solving sessions." },
  { id: 2, name: "Calculus II Review", subject: "MATH202", members: 12, maxMembers: 20, tags: ["Mathematics"], description: "Exam prep and homework help." },
  { id: 3, name: "Physics Lab Partners", subject: "PHY101", members: 4, maxMembers: 6, tags: ["Physics", "Lab"], description: "Collaborate on lab reports." },
  { id: 4, name: "English Literature Circle", subject: "ENG301", members: 6, maxMembers: 10, tags: ["Literature"], description: "Book discussions and essay reviews." },
  { id: 5, name: "Organic Chemistry Study", subject: "CHEM301", members: 10, maxMembers: 12, tags: ["Chemistry"], description: "Reaction mechanisms practice." },
  { id: 6, name: "Statistics for Business", subject: "STAT201", members: 7, maxMembers: 15, tags: ["Statistics", "Business"], description: "Real-world case studies." },
];

const StudyGroups = () => {
  const [search, setSearch] = useState("");
  const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Groups</h1>
          <p className="text-muted-foreground">Find or create study groups for your courses.</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />Create Group</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search groups or subjects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((group) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">{group.subject}</p>
                </div>
                <p className="text-sm text-muted-foreground">{group.description}</p>
                <div className="flex flex-wrap gap-1">
                  {group.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-3 h-3" /> {group.members}/{group.maxMembers}
                  </div>
                  <Button size="sm" variant="outline">Join</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StudyGroups;
