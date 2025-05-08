
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is logged in and not a new user, redirect to dashboard
    if (!loading && user && !user.isNewUser) {
      navigate("/journal");
    }
    // If user is logged in and is a new user, redirect to onboarding
    else if (!loading && user && user.isNewUser) {
      navigate("/onboarding");
    }
  }, [user, loading, navigate]);

  // If loading, return null
  if (loading) return null;
  
  // If user is already logged in, return null (will be redirected by useEffect)
  if (user) return null;

  // For not logged in users, show a welcome screen
  return (
    <MainLayout requireAuth={false}>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to SelfSight</CardTitle>
            <CardDescription>
              Your AI-powered journal for self-discovery and personal growth.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Track your emotions, gain insights, and better understand yourself through reflective journaling.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Button 
              onClick={() => navigate("/login")}
              variant="outline"
            >
              Login
            </Button>
            <Button onClick={() => navigate("/signup")}>
              Sign Up <ArrowRight size={16} className="ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
