
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useDiary, DiaryEntry } from "./DiaryContext";
import { toast } from "@/components/ui/sonner";

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock recommendations based on entries analysis
      const mockRecommendations: Recommendation[] = [
        {
          id: `rec-${Date.now()}-1`,
          type: "youtube",
          title: "The Power of Vulnerability | Brené Brown",
          description: "Brené Brown studies human connection -- our ability to empathize, belong, love.",
          url: "https://www.youtube.com/watch?v=iCvmsMzlF7o"
        },
        {
          id: `rec-${Date.now()}-2`,
          type: "book",
          title: "Atomic Habits",
          author: "James Clear",
          description: "Tiny changes, remarkable results: an easy & proven way to build good habits & break bad ones."
        },
        {
          id: `rec-${Date.now()}-3`,
          type: "article",
          title: "The Science of Journaling: Why It Makes You Happier",
          description: "Research-backed evidence on how journaling improves mental wellbeing.",
          url: "https://example.com/journaling-science"
        },
        {
          id: `rec-${Date.now()}-4`,
          type: "podcast",
          title: "The Daily Stoic",
          author: "Ryan Holiday",
          description: "Practical wisdom for everyday life based on Stoic philosophy.",
          url: "https://dailystoic.com/podcast/"
        }
      ];
      
      setRecommendations([...recommendations, ...mockRecommendations]);
      localStorage.setItem(`selfsight_recommendations_${user.id}`, JSON.stringify([...recommendations, ...mockRecommendations]));
      
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
