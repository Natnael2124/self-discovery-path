
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

// Define user type
export interface User {
  id: string;
  email: string;
  name: string;
  isNewUser: boolean;
}

// Define context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: any) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to transform Supabase user to our User interface
const mapSupabaseUser = (supabaseUser: SupabaseUser, isNew: boolean = false): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "",
    isNewUser: isNew || supabaseUser.user_metadata?.isNewUser || false,
  };
};

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Login successful!");
    } catch (error: any) {
      toast.error(`Login failed: ${error.message}`);
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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            isNewUser: true,
          },
        },
      });

      if (error) throw error;
      
      // Check if the user was created successfully
      if (data.user) {
        toast.success("Account created successfully!");
        
        // Set isNewUser flag to true
        setUser(mapSupabaseUser(data.user, true));
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
        return;
      }
      
      setLoading(true);
      
      // Update user metadata in Supabase
      const { data, error } = await supabase.auth.updateUser({
        data: { ...profile, isNewUser: false }
      });

      if (error) throw error;
      
      if (data.user) {
        // Update local user state to reflect changes
        const updatedUser: User = {
          ...user!,
          isNewUser: false,
          name: data.user.user_metadata?.name || user?.name || "",
          // Include any other properties that might have been updated
        };
        
        setUser(updatedUser);
        
        // Also save profile to localStorage as a backup
        if (user?.id) {
          localStorage.setItem(`selfsight_profile_${user.id}`, JSON.stringify(profile));
        }
      }
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message}`);
      console.error("Profile update error:", error);
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
