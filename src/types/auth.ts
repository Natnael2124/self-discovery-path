
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

// Define user type
export interface User {
  id: string;
  email: string;
  name: string;
  isNewUser: boolean;
}

// Define context type
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
