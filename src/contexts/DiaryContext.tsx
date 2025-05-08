
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

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

  // Load entries from Supabase when user changes
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) {
        setEntries([]);
        return;
      }

      setLoading(true);
      try {
        // Fetch entries from Supabase
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform data to match our DiaryEntry interface
        const transformedEntries: DiaryEntry[] = data.map(entry => ({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          createdAt: entry.created_at,
          userId: entry.user_id,
          tags: entry.tags || [],
          mood: entry.mood || undefined,
          emotions: entry.emotions || undefined,
          strength: entry.strength || undefined,
          weakness: entry.weakness || undefined,
          insight: entry.insight || undefined,
          analysis: entry.analysis || undefined,
          _fallback: entry.analysis?._fallback || false,
          _quotaExceeded: entry.analysis?._quotaExceeded || false
        }));

        setEntries(transformedEntries);
      } catch (error) {
        console.error("Error fetching entries:", error);
        toast.error("Failed to load journal entries");
        
        // Fallback to localStorage if Supabase fetch fails
        const storedEntries = localStorage.getItem(`selfsight_entries_${user.id}`);
        if (storedEntries) {
          setEntries(JSON.parse(storedEntries));
          toast.warning("Using locally stored entries. Some features may be limited.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user]);

  const addEntry = async (title: string, content: string, tags: string[] = []): Promise<DiaryEntry> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      // Generate a temporary ID for the entry
      const tempId = uuidv4();
      
      // Create entry in Supabase
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          title,
          content,
          tags,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Transform the returned data
      const newEntry: DiaryEntry = {
        id: data.id,
        title: data.title,
        content: data.content,
        createdAt: data.created_at,
        userId: data.user_id,
        tags: data.tags || [],
      };
      
      // Update state
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      
      toast.success("Journal entry saved!");
      return newEntry;
    } catch (error) {
      console.error("Error adding entry:", error);
      toast.error("Failed to save entry. Please try again.");
      
      // Fallback to localStorage if Supabase insert fails
      const fallbackEntry: DiaryEntry = {
        id: `entry-${Date.now()}`,
        title,
        content,
        tags,
        createdAt: new Date().toISOString(),
        userId: user.id,
      };
      
      const updatedEntries = [fallbackEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem(`selfsight_entries_${user.id}`, JSON.stringify(updatedEntries));
      
      toast.warning("Entry saved locally. Some features may be limited.");
      return fallbackEntry;
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

      // Update the entry with AI analysis in Supabase
      const { error: updateError } = await supabase
        .from('journal_entries')
        .update({
          mood: data.mood,
          emotions: data.emotions,
          strength: data.strength,
          weakness: data.weakness,
          insight: data.insight,
          analysis: data
        })
        .eq('id', entryId);

      if (updateError) throw updateError;
      
      // Update the entry in local state
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
      
      // Update state
      setEntries(updatedEntries);
    } catch (error) {
      console.error("Error analyzing entry:", error);
      toast.error("Failed to analyze entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete entry functionality
  const deleteEntry = async (entryId: string): Promise<void> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      
      // Update local state
      const updatedEntries = entries.filter(e => e.id !== entryId);
      setEntries(updatedEntries);
      
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
      // Update in Supabase
      const { error } = await supabase
        .from('journal_entries')
        .update({
          title,
          content,
          tags
        })
        .eq('id', entryId);

      if (error) throw error;
      
      // Update local state
      const updatedEntries = entries.map(e => {
        if (e.id === entryId) {
          return {
            ...e,
            title,
            content,
            tags,
          };
        }
        return e;
      });
      
      setEntries(updatedEntries);
      
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
