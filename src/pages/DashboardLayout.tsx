import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AIChatbot } from "@/components/AIChatbot";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const initials = (n: string) => n.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

const DashboardLayout = () => {
  const { user } = useAuth();
  const [name, setName] = useState("Student");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.display_name) setName(data.display_name); });
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                {initials(name)}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
        <AIChatbot />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
