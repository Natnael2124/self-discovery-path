
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "@/components/ui/sonner";

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
      
      // Simulate API call to AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI analysis
      const mockAnalysis = {
        mood: ["contemplative", "hopeful", "reflective"][Math.floor(Math.random() * 3)],
        emotions: ["curiosity", "anticipation", "determination"],
        strength: ["resilience", "adaptability", "self-awareness"][Math.floor(Math.random() * 3)],
        weakness: ["overthinking", "perfectionism", "procrastination"][Math.floor(Math.random() * 3)],
        insight: "You seem to be developing greater self-awareness and are making progress in identifying what truly matters to you.",
        patterns: {
          positive: ["consistent journaling", "reflection"],
          areas_for_growth: ["decision making confidence"]
        }
      };
      
      // Update the entry with analysis
      const updatedEntries = entries.map(e => {
        if (e.id === entryId) {
          return {
            ...e,
            mood: mockAnalysis.mood,
            emotions: mockAnalysis.emotions,
            strength: mockAnalysis.strength,
            weakness: mockAnalysis.weakness,
            insight: mockAnalysis.insight,
            analysis: mockAnalysis
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
