
import { supabase } from "@/integrations/supabase/client";
import { DiaryEntry } from "@/types/diary";
import { toast } from "@/components/ui/sonner";

// Transform Supabase data to match our DiaryEntry interface
export const transformEntryFromSupabase = (entry: any): DiaryEntry => ({
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
  _fallback: entry._fallback || false,
  _quotaExceeded: entry._quotaExceeded || false
});

// Fetch all entries for a user
export const fetchEntries = async (userId: string): Promise<DiaryEntry[]> => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(transformEntryFromSupabase);
};

// Add a new entry
export const addEntryToSupabase = async (
  userId: string,
  title: string,
  content: string,
  tags: string[] = []
): Promise<DiaryEntry> => {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      title,
      content,
      tags,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return transformEntryFromSupabase(data);
};

// Create a fallback entry (for localStorage)
export const createFallbackEntry = (
  userId: string,
  title: string,
  content: string,
  tags: string[] = []
): DiaryEntry => ({
  id: `entry-${Date.now()}`,
  title,
  content,
  tags,
  createdAt: new Date().toISOString(),
  userId,
  _fallback: true
});

// Delete an entry
export const deleteEntryFromSupabase = async (entryId: string): Promise<void> => {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
};

// Update an entry
export const updateEntryInSupabase = async (
  entryId: string,
  title: string,
  content: string,
  tags: string[] = []
): Promise<void> => {
  const { error } = await supabase
    .from('journal_entries')
    .update({
      title,
      content,
      tags
    })
    .eq('id', entryId);

  if (error) throw error;
};

// Analyze an entry using mock AI instead of Gemini
export const analyzeEntryWithAI = async (
  entryId: string, 
  title: string, 
  content: string
): Promise<any> => {
  try {
    console.log("Starting mock AI analysis for entry:", entryId);
    
    // Generate more dynamic analysis based on content
    const words = content.toLowerCase().split(/\s+/);
    const contentLength = content.length;
    
    // Extract keywords and emotional indicators
    const emotionalKeywords = {
      happy: ["happy", "joy", "excited", "glad", "wonderful", "great", "fantastic", "pleased"],
      sad: ["sad", "unhappy", "depressed", "down", "upset", "disappointing", "somber", "gloomy"],
      angry: ["angry", "frustrated", "annoyed", "mad", "irritated", "furious", "rage"],
      anxious: ["anxious", "worried", "nervous", "stressed", "overwhelmed", "concerned", "tense"],
      calm: ["calm", "peaceful", "relaxed", "tranquil", "serene", "content", "balanced"]
    };
    
    // Detect primary emotion
    let primaryMood = "contemplative"; // Default
    let emotionCounts = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      calm: 0
    };
    
    // Count emotional words in content
    words.forEach(word => {
      for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
        if (keywords.some(keyword => word.includes(keyword))) {
          emotionCounts[emotion as keyof typeof emotionCounts]++;
        }
      }
    });
    
    // Find the primary emotion
    let highestCount = 0;
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > highestCount) {
        highestCount = count;
        primaryMood = emotion;
      }
    }
    
    // If no strong emotion detected, use title sentiment
    if (highestCount === 0) {
      for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
        if (keywords.some(keyword => title.toLowerCase().includes(keyword))) {
          primaryMood = emotion;
          break;
        }
      }
    }
    
    // Generate emotions array based on detected mood
    let emotions: string[] = [];
    switch(primaryMood) {
      case "happy":
        emotions = ["joyful", "optimistic", "grateful"];
        break;
      case "sad":
        emotions = ["melancholy", "reflective", "sensitive"];
        break;
      case "angry":
        emotions = ["frustrated", "irritated", "passionate"];
        break;
      case "anxious":
        emotions = ["worried", "cautious", "alert"];
        break;
      case "calm":
        emotions = ["peaceful", "mindful", "balanced"];
        break;
      default:
        emotions = ["thoughtful", "contemplative", "curious"];
    }
    
    // Analyze writing style for strengths and weaknesses
    let strength = "self-awareness";
    let weakness = "clarity";
    
    if (contentLength > 500) {
      strength = "expressiveness";
    } else if (contentLength < 100) {
      strength = "conciseness";
      weakness = "detail";
    }
    
    // Check for reflective language
    const reflectiveWords = ["think", "feel", "realize", "understand", "learn", "reflect", "consider"];
    if (reflectiveWords.some(word => words.includes(word))) {
      strength = "self-reflection";
    }
    
    // Check for question marks - indicates curiosity or uncertainty
    if (content.includes("?")) {
      if (content.split("?").length > 3) {
        weakness = "certainty";
        strength = "curiosity";
      }
    }
    
    // Generate insight based on detected patterns
    let insight = "Taking time to write down your thoughts shows a commitment to self-reflection.";
    
    if (primaryMood === "anxious") {
      insight = "Your writing reveals concerns that might benefit from being addressed directly.";
    } else if (primaryMood === "happy") {
      insight = "You're expressing positive emotions that can be channeled into productive activities.";
    } else if (primaryMood === "sad") {
      insight = "Processing these feelings through writing is a healthy step toward understanding them better.";
    } else if (contentLength > 500) {
      insight = "Your detailed expression suggests deep engagement with your thoughts and experiences.";
    }
    
    console.log("Analysis completed for entry:", entryId);
    console.log("Detected mood:", primaryMood);
    
    // Return the analysis data
    return {
      mood: primaryMood,
      emotions: emotions,
      strength: strength,
      weakness: weakness,
      insight: insight,
      patterns: {
        positive: [strength, "journaling"],
        areas_for_growth: [weakness]
      }
    };
  } catch (error) {
    console.error("Error in mock analysis:", error);
    // Return fallback analysis with _fallback flag
    return {
      mood: "contemplative",
      emotions: ["thoughtful", "reflective"],
      strength: "self-awareness",
      weakness: "uncertainty",
      insight: "Taking time to reflect shows a commitment to personal growth.",
      _fallback: true
    };
  }
};

// Update entry with analysis results
export const updateEntryWithAnalysis = async (
  entryId: string,
  analysisData: any
): Promise<void> => {
  const { error } = await supabase
    .from('journal_entries')
    .update({
      mood: analysisData.mood,
      emotions: analysisData.emotions,
      strength: analysisData.strength,
      weakness: analysisData.weakness,
      insight: analysisData.insight,
      analysis: analysisData,
      _fallback: analysisData._fallback || false,
      _quotaExceeded: analysisData._quotaExceeded || false
    })
    .eq('id', entryId);

  if (error) throw error;
};
