import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useDiary, DiaryEntry } from "./DiaryContext";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface Recommendation {
  id: string;
  type: "youtube" | "podcast" | "article" | "book";
  title: string;
  description: string;
  url?: string;
  author?: string;
  isHelpful?: boolean;
}

interface InsightContextType {
  loading: boolean;
  recommendations: Recommendation[];
  generateRecommendations: () => Promise<void>;
  markRecommendation: (id: string, helpful: boolean) => void;
  getEmotionTrends: () => { date: string; value: number; emotion: string }[];
  getTopStrengths: () => { strength: string; count: number }[];
  getTopWeaknesses: () => { weakness: string; count: number }[];
}

const InsightContext = createContext<InsightContextType | undefined>(undefined);

export const InsightProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { entries } = useDiary();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Load recommendations from localStorage when user changes
  useEffect(() => {
    if (user) {
      const storedRecommendations = localStorage.getItem(`selfsight_recommendations_${user.id}`);
      if (storedRecommendations) {
        setRecommendations(JSON.parse(storedRecommendations));
      }
    } else {
      setRecommendations([]);
    }
  }, [user]);

  const generateRecommendations = async (): Promise<void> => {
    if (!user) throw new Error("User must be logged in");
    
    setLoading(true);
    
    try {
      // Get analyzed entries to send to the API
      const analyzedEntries = entries.filter(entry => entry.mood);
      
      if (analyzedEntries.length === 0) {
        throw new Error("No analyzed entries available for recommendations");
      }
      
      // Call the Supabase Edge Function for AI-generated recommendations
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: {
          entries: analyzedEntries
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data || !Array.isArray(data)) throw new Error("Invalid recommendations data returned");
      
      // Update recommendations
      const newRecommendations = data as Recommendation[];
      setRecommendations([...recommendations, ...newRecommendations]);
      localStorage.setItem(`selfsight_recommendations_${user.id}`, JSON.stringify([...recommendations, ...newRecommendations]));
      
      toast.success("New recommendations generated!");
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast.error("Failed to generate recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const markRecommendation = (id: string, helpful: boolean): void => {
    if (!user) return;
    
    const updatedRecommendations = recommendations.map(rec => {
      if (rec.id === id) {
        return { ...rec, isHelpful: helpful };
      }
      return rec;
    });
    
    setRecommendations(updatedRecommendations);
    localStorage.setItem(`selfsight_recommendations_${user.id}`, JSON.stringify(updatedRecommendations));
    
    toast.success(helpful ? "Marked as helpful!" : "Marked as not helpful");
  };

  const getEmotionTrends = () => {
    // Generate mock emotion trend data from entries
    const analyzedEntries = entries.filter(entry => entry.mood);
    
    // Return empty array if no analyzed entries
    if (analyzedEntries.length === 0) return [];
    
    // Create emotion data points
    return analyzedEntries.map(entry => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      
      // Map mood to a number value (1-10)
      let value = 5; // neutral default
      
      if (entry.mood === "happy" || entry.mood === "excited" || entry.mood === "hopeful") {
        value = 8;
      } else if (entry.mood === "calm" || entry.mood === "content" || entry.mood === "relaxed") {
        value = 6;
      } else if (entry.mood === "anxious" || entry.mood === "stressed") {
        value = 3;
      } else if (entry.mood === "sad" || entry.mood === "depressed") {
        value = 2;
      } else if (entry.mood === "contemplative" || entry.mood === "reflective") {
        value = 5;
      }
      
      return {
        date,
        value,
        emotion: entry.mood || "neutral"
      };
    });
  };

  const getTopStrengths = () => {
    // Count strengths from analyzed entries
    const analyzedEntries = entries.filter(entry => entry.strength);
    const strengthCounts: Record<string, number> = {};
    
    analyzedEntries.forEach(entry => {
      const strength = entry.strength;
      if (strength) {
        strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count
    return Object.entries(strengthCounts)
      .map(([strength, count]) => ({ strength, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const getTopWeaknesses = () => {
    // Count weaknesses from analyzed entries
    const analyzedEntries = entries.filter(entry => entry.weakness);
    const weaknessCounts: Record<string, number> = {};
    
    analyzedEntries.forEach(entry => {
      const weakness = entry.weakness;
      if (weakness) {
        weaknessCounts[weakness] = (weaknessCounts[weakness] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count
    return Object.entries(weaknessCounts)
      .map(([weakness, count]) => ({ weakness, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  return (
    <InsightContext.Provider value={{ 
      loading, 
      recommendations, 
      generateRecommendations, 
      markRecommendation,
      getEmotionTrends,
      getTopStrengths,
      getTopWeaknesses
    }}>
      {children}
    </InsightContext.Provider>
  );
};

export const useInsight = () => {
  const context = useContext(InsightContext);
  if (context === undefined) {
    throw new Error("useInsight must be used within an InsightProvider");
  }
  return context;
};
