import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Landing from "./pages/Landing";
import Auth from "./pages/Auth/Auth";
import Feed from "./pages/Feed/FeedPage";
// import Messages from "./pages/Messages";
// import Proposals from "./pages/Proposals";
// import Marketplace from "./pages/Marketplace";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import EditPost from "./pages/EditPost/EditPostPage";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import ResetPassword from "./pages/ResetPassword";
import Messages from "./pages/Messages";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import AboutUs from "@/pages/legal/AboutUs";

const queryClient = new QueryClient();

const App = () => {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/feed" element={<Feed />} />
              <Route path="/edit-post/:postId" element={<EditPost />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              {/* future routes */}
              <Route path="/messages" element={<Messages />} />
              {/* <Route path="/proposals" element={<Proposals />} /> */}
              {/* <Route path="/marketplace" element={<Marketplace />} /> */}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
