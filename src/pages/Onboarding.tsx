
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import MainLayout from "@/components/layout/MainLayout";
import { toast } from "@/components/ui/sonner";

const Onboarding = () => {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    personality: "",
    values: "",
    strengths: "",
    goals: "",
  });

  // Check if user is authenticated and redirect if needed
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await updateUserProfile(profile);
      
      // Also save profile to localStorage as a backup
      if (user?.id) {
        localStorage.setItem(`selfsight_profile_${user.id}`, JSON.stringify(profile));
      }
      
      toast.success("Profile updated successfully!");
      navigate("/journal");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(`Failed to update profile: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  // If still checking auth status, show loading state
  if (authLoading) {
    return (
      <MainLayout requireAuth={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout requireAuth={false}>
      <div className="max-w-3xl mx-auto pb-12 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to SelfSight{user?.name ? `, ${user.name}` : ''}!</h1>
          <p className="text-muted-foreground">Let's get to know you better</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set up your profile</CardTitle>
            <CardDescription>
              This information helps our AI provide more personalized insights for your journal entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">How would you describe your personality?</label>
                    <Textarea 
                      placeholder="I'm generally outgoing but enjoy quiet time to reflect. I'm curious, thoughtful..."
                      className="resize-none"
                      rows={4}
                      value={profile.personality}
                      onChange={(e) => handleChange("personality", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">What are your core values?</label>
                    <Textarea
                      placeholder="I value honesty, creativity, personal growth..."
                      className="resize-none"
                      rows={4}
                      value={profile.values}
                      onChange={(e) => handleChange("values", e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setStep(2)}>Continue</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">What do you consider your strengths?</label>
                    <Textarea
                      placeholder="I'm good at problem-solving, communicating clearly..."
                      className="resize-none"
                      rows={4}
                      value={profile.strengths}
                      onChange={(e) => handleChange("strengths", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">What are your current goals?</label>
                    <Textarea
                      placeholder="I'm working on improving my focus, developing new skills..."
                      className="resize-none"
                      rows={4}
                      value={profile.goals}
                      onChange={(e) => handleChange("goals", e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button type="submit" disabled={loading || authLoading}>
                      {loading ? "Saving..." : "Complete Profile"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Onboarding;
