import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { User } from "lucide-react";

const Profile = () => {
  const { user, updateUserProfile, session } = useAuth();
  const [profile, setProfile] = useState({
    personality: "",
    values: "",
    strengths: "",
    goals: "",
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Load profile from localStorage
  useEffect(() => {
    if (user) {
      const savedProfile = localStorage.getItem(`selfsight_profile_${user.id}`);
      if (savedProfile) {
        try {
          setProfile(JSON.parse(savedProfile));
        } catch (e) {
          console.error("Error parsing profile from localStorage:", e);
        }
      }
    }
  }, [user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!session) {
        throw new Error("You must be logged in to update your profile");
      }
      
      await updateUserProfile(profile);
      
      // Save to localStorage as well
      if (user?.id) {
        localStorage.setItem(`selfsight_profile_${user.id}`, JSON.stringify(profile));
      }
      
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message}`);
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };
  
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <User className="mr-2" size={24} />
              Profile
            </h1>
            <p className="text-muted-foreground mt-1">Your self-discovery profile</p>
          </div>
          
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic information about your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-foreground">{user?.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Self-Discovery Profile</CardTitle>
            <CardDescription>Information that helps our AI understand you better</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">How would you describe your personality?</label>
                  <Textarea 
                    placeholder="I'm generally outgoing but enjoy quiet time to reflect..."
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
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-1">Personality</h3>
                  <p className="text-muted-foreground">{profile.personality || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Core Values</h3>
                  <p className="text-muted-foreground">{profile.values || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Strengths</h3>
                  <p className="text-muted-foreground">{profile.strengths || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Goals</h3>
                  <p className="text-muted-foreground">{profile.goals || "Not specified"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Profile;
