
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { User, AuthContextType } from "@/types/auth";
import { mapSupabaseUser } from "@/utils/authUtils";
import { Session } from "@supabase/supabase-js";

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up auth state listener and check for existing session on mount
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);
        if (session?.user) {
          const mappedUser = mapSupabaseUser(session.user);
          console.log("Setting user from auth state change:", mappedUser);
          setUser(mappedUser);
        } else {
          setUser(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Got existing session:", session?.user?.id);
      setSession(session);
      if (session?.user) {
        const mappedUser = mapSupabaseUser(session.user);
        console.log("Setting user from existing session:", mappedUser);
        setUser(mappedUser);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function using Supabase
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error details:", error);
        if (error.message === "Email not confirmed") {
          toast.error("Please check your email to confirm your account before logging in.");
        } else {
          toast.error(`Login failed: ${error.message}`);
        }
        throw error;
      }
      
      toast.success("Login successful!");
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Signup function using Supabase
  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      
      // Creating the user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            isNewUser: true,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      
      // Check if the user was created successfully
      if (data.user) {
        console.log("User created successfully:", data.user.id);
        toast.success("Account created successfully! Please confirm your email if required.");
        
        // Set isNewUser flag to true
        setUser(mapSupabaseUser(data.user, true));
        
        try {
          // Check if profile exists
          const { data: existingProfiles, error: profileQueryError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id);
            
          if (profileQueryError) {
            console.error("Error checking for existing profile:", profileQueryError);
          }
            
          if (!existingProfiles || existingProfiles.length === 0) {
            // Create profile if it doesn't exist
            const { error: profileError } = await supabase
              .from("profiles")
              .insert([{ 
                id: data.user.id,
                email: email,
                name: name 
              }]);
              
            if (profileError) {
              console.error("Error creating profile:", profileError);
            }
          }
        } catch (profileErr) {
          console.error("Error checking/creating user profile:", profileErr);
        }
      }
    } catch (error: any) {
      toast.error(`Signup failed: ${error.message}`);
      console.error("Signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function using Supabase
  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.success("Logged out successfully!");
    } catch (error: any) {
      toast.error(`Logout failed: ${error.message}`);
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (profile: any) => {
    try {
      if (!session?.user) {
        console.error("No session or user found when updating profile");
        toast.error("You must be logged in to update your profile");
        throw new Error("Auth session missing");
      }
      
      setLoading(true);
      
      // Update user metadata in Supabase
      const { data, error } = await supabase.auth.updateUser({
        data: { ...profile, isNewUser: false }
      });

      if (error) throw error;
      
      if (data.user) {
        console.log("User metadata updated successfully!");
        
        // Update the user state to reflect changes (especially isNewUser = false)
        const updatedUser: User = {
          ...user!,
          isNewUser: false,
          name: data.user.user_metadata?.name || user?.name || "",
        };
        
        setUser(updatedUser);
        
        // Save profile to localStorage as a backup
        if (updatedUser.id) {
          localStorage.setItem(`selfsight_profile_${updatedUser.id}`, JSON.stringify(profile));
          console.log("Profile saved to localStorage");
        }
      }
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message}`);
      console.error("Profile update error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      loading, 
      login, 
      signup, 
      logout, 
      updateUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
