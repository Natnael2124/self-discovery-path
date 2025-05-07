
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

export interface DiaryEntry {
  id: string;
  content: string;
  title: string;
  createdAt: string;
  userId: string;
  mood?: string;
  emotions?: string[];
  strength?: string;
  weakness?: string;
  insight?: string;
  analysis?: any;
}

interface DiaryContextType {
  entries: DiaryEntry[];
  loading: boolean;
  addEntry: (title: string, content: string) => Promise<DiaryEntry>;
  getEntryById: (id: string) => DiaryEntry | undefined;
  analyzeEntry: (entryId: string) => Promise<void>;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export const DiaryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Load entries from localStorage when user changes
  useEffect(() => {
    if (user) {
      const storedEntries = localStorage.getItem(`selfsight_entries_${user.id}`);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
    } else {
      setEntries([]);
    }
  }, [user]);

  const addEntry = async (title: string, content: string): Promise<DiaryEntry> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      // Create a new diary entry
      const newEntry: DiaryEntry = {
        id: `entry-${Date.now()}`,
        title,
        content,
        createdAt: new Date().toISOString(),
        userId: user.id,
      };
      
      // Update state
      const updatedEntries = [...entries, newEntry];
      setEntries(updatedEntries);
      
      // Save to localStorage
      localStorage.setItem(`selfsight_entries_${user.id}`, JSON.stringify(updatedEntries));
      
      toast.success("Journal entry saved!");
      return newEntry;
    } catch (error) {
      console.error("Error adding entry:", error);
      toast.error("Failed to save entry. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getEntryById = (id: string): DiaryEntry | undefined => {
    return entries.find(entry => entry.id === id);
  };

  const analyzeEntry = async (entryId: string): Promise<void> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) throw new Error("Entry not found");
      
      // Call the Supabase Edge Function for AI analysis
      const { data, error } = await supabase.functions.invoke('analyze-journal', {
        body: {
          title: entry.title,
          content: entry.content
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data) throw new Error("No analysis data returned");
      
      // Update the entry with AI analysis
      const updatedEntries = entries.map(e => {
        if (e.id === entryId) {
          return {
            ...e,
            mood: data.mood,
            emotions: data.emotions,
            strength: data.strength,
            weakness: data.weakness,
            insight: data.insight,
            analysis: data
          };
        }
        return e;
      });
      
      // Update state and localStorage
      setEntries(updatedEntries);
      localStorage.setItem(`selfsight_entries_${user.id}`, JSON.stringify(updatedEntries));
      
      toast.success("Entry analyzed successfully!");
    } catch (error) {
      console.error("Error analyzing entry:", error);
      toast.error("Failed to analyze entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DiaryContext.Provider value={{ entries, loading, addEntry, getEntryById, analyzeEntry }}>
      {children}
    </DiaryContext.Provider>
  );
};

export const useDiary = () => {
  const context = useContext(DiaryContext);
  if (context === undefined) {
    throw new Error("useDiary must be used within a DiaryProvider");
  }
  return context;
};
