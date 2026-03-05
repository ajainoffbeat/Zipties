import { Footer } from "@/pages/Footer";
import { Navbar } from "./Navbar";
import { useSocketNotifications } from "@/hooks/useSocketNotifications";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useSocketNotifications();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">{children}</main>
      <Footer />
    </div>
  );
}
