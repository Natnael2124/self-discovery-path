
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
}

const MainLayout = ({ children, requireAuth = true }: MainLayoutProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if loading is complete
    if (loading) {
      return;
    }

    // If authentication is required but user is not logged in
    if (requireAuth && !user) {
      console.log("MainLayout redirecting to login: no authenticated user");
      navigate("/login");
      return;
    }
    
    // Redirect new users to onboarding if they're not already there
    if (user?.isNewUser && window.location.pathname !== "/onboarding") {
      console.log("MainLayout redirecting to onboarding: new user detected");
      navigate("/onboarding");
      return;
    }

    // Debug logging
    console.log("MainLayout auth state:", { 
      loading, 
      requireAuth, 
      isAuthenticated: !!user, 
      isNewUser: user?.isNewUser,
      currentPath: window.location.pathname 
    });
  }, [user, loading, navigate, requireAuth]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-semibold">Loading...</div>
      </div>
    );
  }

  // Show only children without sidebar for unauthenticated users
  if (!user && requireAuth) {
    return null;
  }

  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  );
};

export default MainLayout;
