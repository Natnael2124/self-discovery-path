
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "@/components/ui/sonner";
import { DiaryEntry, DiaryContextType } from "@/types/diary";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import * as DiaryService from "@/services/diaryService";

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export const DiaryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [localEntries, setLocalEntries] = useLocalStorage<DiaryEntry[]>(`selfsight_entries_${user?.id || 'guest'}`, []);

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
        const fetchedEntries = await DiaryService.fetchEntries(user.id);
        setEntries(fetchedEntries);
      } catch (error) {
        console.error("Error fetching entries:", error);
        toast.error("Failed to load journal entries");
        
        // Fallback to localStorage if Supabase fetch fails
        if (localEntries.length > 0) {
          setEntries(localEntries);
          toast.warning("Using locally stored entries. Some features may be limited.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user, localEntries]);

  const addEntry = async (title: string, content: string, tags: string[] = []): Promise<DiaryEntry> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      // Create entry in Supabase
      const newEntry = await DiaryService.addEntryToSupabase(user.id, title, content, tags);
      
      // Update state
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      
      toast.success("Journal entry saved!");
      return newEntry;
    } catch (error) {
      console.error("Error adding entry:", error);
      toast.error("Failed to save entry. Please try again.");
      
      // Fallback to localStorage if Supabase insert fails
      const fallbackEntry = DiaryService.createFallbackEntry(user.id, title, content, tags);
      
      const updatedEntries = [fallbackEntry, ...entries];
      setEntries(updatedEntries);
      setLocalEntries(updatedEntries);
      
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
      const analysisData = await DiaryService.analyzeEntryWithAI(entryId, entry.title, entry.content);
      
      // Show success message
      toast.success("Entry analyzed successfully!");

      // Update the entry with AI analysis in Supabase
      await DiaryService.updateEntryWithAnalysis(entryId, analysisData);
      
      // Update the entry in local state
      const updatedEntries = entries.map(e => {
        if (e.id === entryId) {
          return {
            ...e,
            mood: analysisData.mood,
            emotions: analysisData.emotions,
            strength: analysisData.strength,
            weakness: analysisData.weakness,
            insight: analysisData.insight,
            analysis: analysisData,
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

  const deleteEntry = async (entryId: string): Promise<void> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      // Delete from Supabase
      await DiaryService.deleteEntryFromSupabase(entryId);
      
      // Update local state
      const updatedEntries = entries.filter(e => e.id !== entryId);
      setEntries(updatedEntries);
      setLocalEntries(updatedEntries);
      
      toast.success("Journal entry deleted successfully!");
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async (entryId: string, title: string, content: string, tags: string[] = []): Promise<void> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      // Update in Supabase
      await DiaryService.updateEntryInSupabase(entryId, title, content, tags);
      
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
      setLocalEntries(updatedEntries);
      
      toast.success("Journal entry updated successfully!");
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("Failed to update entry. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

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

// Re-export the DiaryEntry type for convenience
export type { DiaryEntry } from "@/types/diary";

export const useDiary = () => {
  const context = useContext(DiaryContext);
  if (context === undefined) {
    throw new Error("useDiary must be used within a DiaryProvider");
  }
  return context;
};
