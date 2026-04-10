import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, BookOpen, GraduationCap } from "lucide-react";

const ProfilePage = () => (
  <div className="space-y-6 animate-fade-in max-w-2xl">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      <p className="text-muted-foreground">Manage your account settings.</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">JD</div>
          <div>
            <p className="font-semibold text-foreground">John Doe</p>
            <Badge variant="secondary">Student</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Full Name</Label><Input defaultValue="John Doe" className="mt-1" /></div>
          <div><Label>Email</Label><Input defaultValue="john.doe@pu.edu" className="mt-1" /></div>
          <div><Label>Department</Label><Input defaultValue="Computer Science" className="mt-1" /></div>
          <div><Label>Year</Label><Input defaultValue="3rd Year" className="mt-1" /></div>
        </div>
        <Button>Save Changes</Button>
      </CardContent>
    </Card>
  </div>
);

export default ProfilePage;
