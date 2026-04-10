import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ThumbsUp, Share2 } from "lucide-react";

const posts = [
  { id: 1, author: "Alice W.", avatar: "AW", content: "Just finished my final project for CS201! Anyone else feel like recursion finally clicked? 🎉", likes: 24, comments: 8, time: "1h ago", topic: "Computer Science" },
  { id: 2, author: "Bob L.", avatar: "BL", content: "Looking for study partners for the MATH202 midterm next week. Library study room 3, 6PM?", likes: 12, comments: 15, time: "3h ago", topic: "Study Partners" },
  { id: 3, author: "Carol S.", avatar: "CS", content: "The career fair was amazing! Got two interview callbacks. Don't skip these events!", likes: 45, comments: 11, time: "5h ago", topic: "Career" },
];

const CommunityPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Community</h1>
      <p className="text-muted-foreground">Connect with fellow students.</p>
    </div>
    <div className="space-y-4 max-w-2xl">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium shrink-0">
                {post.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{post.author}</span>
                  <Badge variant="secondary" className="text-xs">{post.topic}</Badge>
                  <span className="text-xs text-muted-foreground">{post.time}</span>
                </div>
                <p className="mt-2 text-foreground">{post.content}</p>
                <div className="flex items-center gap-4 mt-3">
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ThumbsUp className="w-3 h-3" />{post.likes}</button>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><MessageCircle className="w-3 h-3" />{post.comments}</button>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><Share2 className="w-3 h-3" />Share</button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default CommunityPage;
