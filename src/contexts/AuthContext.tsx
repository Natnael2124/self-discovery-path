
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/components/ui/sonner";

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
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (profile: any) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if we have a user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("selfsight_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Mock login function (would connect to backend in production)
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, create a mock user
      const mockUser: User = {
        id: "user-" + Math.random().toString(36).substring(2, 9),
        email,
        name: email.split('@')[0],
        isNewUser: false
      };

      // Store user in state and localStorage
      setUser(mockUser);
      localStorage.setItem("selfsight_user", JSON.stringify(mockUser));
      toast.success("Login successful!");
    } catch (error) {
      toast.error("Login failed. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock signup function
  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock user with isNewUser flag
      const mockUser: User = {
        id: "user-" + Math.random().toString(36).substring(2, 9),
        email,
        name,
        isNewUser: true
      };

      // Store user in state and localStorage
      setUser(mockUser);
      localStorage.setItem("selfsight_user", JSON.stringify(mockUser));
      toast.success("Account created successfully!");
    } catch (error) {
      toast.error("Signup failed. Please try again.");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("selfsight_user");
    toast.success("Logged out successfully!");
  };

  // Update user profile
  const updateUserProfile = async (profile: any) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        const updatedUser = {
          ...user,
          isNewUser: false,
        };
        
        setUser(updatedUser);
        localStorage.setItem("selfsight_user", JSON.stringify(updatedUser));
        
        // Also save profile data in localStorage for demo purposes
        localStorage.setItem("selfsight_profile_" + user.id, JSON.stringify(profile));
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUserProfile }}>
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
