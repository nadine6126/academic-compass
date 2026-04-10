import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, MessageSquare, ThumbsUp, Eye, Plus } from "lucide-react";

const questions = [
  { id: 1, title: "How to solve recurrence relations using Master Theorem?", author: "Anonymous", votes: 15, answers: 4, views: 120, tags: ["CS201", "Algorithms"], time: "2h ago" },
  { id: 2, title: "Best resources for Organic Chemistry mechanisms?", author: "Sarah M.", votes: 8, answers: 6, views: 89, tags: ["CHEM301"], time: "5h ago" },
  { id: 3, title: "Difference between t-test and z-test?", author: "Anonymous", votes: 22, answers: 3, views: 210, tags: ["STAT201", "Statistics"], time: "1d ago" },
  { id: 4, title: "Tips for writing a strong thesis statement?", author: "James K.", votes: 11, answers: 7, views: 156, tags: ["ENG301", "Writing"], time: "2d ago" },
];

const QAForum = () => {
  const [search, setSearch] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Q&A Forum</h1>
          <p className="text-muted-foreground">Ask questions, share knowledge.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            <span className="text-sm text-muted-foreground">Post Anonymously</span>
          </div>
          <Button><Plus className="w-4 h-4 mr-2" />Ask Question</Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <Card key={q.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="py-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <button className="text-muted-foreground hover:text-primary"><ThumbsUp className="w-4 h-4" /></button>
                  <span className="text-sm font-semibold text-foreground">{q.votes}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground hover:text-primary transition-colors">{q.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {q.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{q.author}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{q.answers} answers</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{q.views} views</span>
                    <span>{q.time}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QAForum;
