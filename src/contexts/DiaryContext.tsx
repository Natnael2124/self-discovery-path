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
  tags?: string[];
  mood?: string;
  emotions?: string[];
  strength?: string;
  weakness?: string;
  insight?: string;
  analysis?: any;
  _fallback?: boolean;
  _quotaExceeded?: boolean;
}

interface DiaryContextType {
  entries: DiaryEntry[];
  loading: boolean;
  addEntry: (title: string, content: string, tags?: string[]) => Promise<DiaryEntry>;
  getEntryById: (id: string) => DiaryEntry | undefined;
  analyzeEntry: (entryId: string) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  updateEntry: (entryId: string, title: string, content: string, tags?: string[]) => Promise<void>;
  getAllTags: () => string[];
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

  const addEntry = async (title: string, content: string, tags: string[] = []): Promise<DiaryEntry> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      // Create a new diary entry
      const newEntry: DiaryEntry = {
        id: `entry-${Date.now()}`,
        title,
        content,
        tags,
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
      
      // Check if this is a fallback response due to API quota being exceeded
      if (data._quotaExceeded) {
        toast.warning("API quota exceeded. Using fallback analysis.", {
          description: "The analysis provided is a generic response as the AI service is currently unavailable.",
          duration: 5000
        });
      } else if (data._fallback) {
        toast.warning("Using fallback analysis.", {
          description: "The AI service encountered an issue. A generic analysis has been provided.",
          duration: 5000
        });
      } else {
        toast.success("Entry analyzed successfully!");
      }
      
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
            analysis: data,
            _fallback: data._fallback,
            _quotaExceeded: data._quotaExceeded
          };
        }
        return e;
      });
      
      // Update state and localStorage
      setEntries(updatedEntries);
      localStorage.setItem(`selfsight_entries_${user.id}`, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error("Error analyzing entry:", error);
      toast.error("Failed to analyze entry. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete entry functionality
  const deleteEntry = async (entryId: string): Promise<void> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      // Find the entry to delete
      const entryExists = entries.some(e => e.id === entryId);
      if (!entryExists) throw new Error("Entry not found");
      
      // Filter out the entry to delete
      const updatedEntries = entries.filter(e => e.id !== entryId);
      
      // Update state and localStorage
      setEntries(updatedEntries);
      localStorage.setItem(`selfsight_entries_${user.id}`, JSON.stringify(updatedEntries));
      
      toast.success("Journal entry deleted successfully!");
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update entry functionality
  const updateEntry = async (entryId: string, title: string, content: string, tags: string[] = []): Promise<void> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      // Find the entry to update
      const entryIndex = entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) throw new Error("Entry not found");
      
      // Update the entry
      const updatedEntries = [...entries];
      updatedEntries[entryIndex] = {
        ...updatedEntries[entryIndex],
        title,
        content,
        tags,
      };
      
      // Update state and localStorage
      setEntries(updatedEntries);
      localStorage.setItem(`selfsight_entries_${user.id}`, JSON.stringify(updatedEntries));
      
      toast.success("Journal entry updated successfully!");
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("Failed to update entry. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags from entries
  const getAllTags = (): string[] => {
    const allTags = new Set<string>();
    
    entries.forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    return Array.from(allTags).sort();
  };

  return (
    <DiaryContext.Provider value={{ 
      entries, 
      loading, 
      addEntry, 
      getEntryById, 
      analyzeEntry,
      deleteEntry,
      updateEntry,
      getAllTags
    }}>
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
