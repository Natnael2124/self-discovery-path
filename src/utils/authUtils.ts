
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "@/types/auth";

// Helper function to transform Supabase user to our User interface
export const mapSupabaseUser = (supabaseUser: SupabaseUser, isNew: boolean = false): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "",
    isNewUser: isNew || supabaseUser.user_metadata?.isNewUser || false,
  };
};
