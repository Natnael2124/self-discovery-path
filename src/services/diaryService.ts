
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
  analysis: entry.analysis || undefined
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
  userId
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
  console.log("Starting entry analysis for entry:", entryId);
  
  try {
    // Try to use the Supabase Edge Function first
    try {
      console.log("Attempting to use Supabase Edge Function for analysis");
      const { data, error } = await supabase.functions.invoke('analyze-journal', {
        body: { title, content }
      });
      
      if (error) {
        console.error("Error calling Supabase Edge Function:", error);
        throw error;
      }
      
      console.log("Analysis from Edge Function successful:", data);
      return data;
    } catch (apiError) {
      console.error("Edge Function failed, falling back to mock analysis:", apiError);
      // If API call fails, fall back to the mock analysis
      return generateMockAnalysis(title, content);
    }
  } catch (error) {
    console.error("Error in analyzeEntryWithAI:", error);
    // Generate a fallback analysis in case of any error
    return {
      mood: "contemplative",
      emotions: ["thoughtful", "reflective", "curious"],
      strength: "self-awareness",
      weakness: "uncertainty",
      insight: "Taking time to reflect shows a commitment to personal growth."
    };
  }
};

// Generate mock analysis based on content
const generateMockAnalysis = (title: string, content: string) => {
  console.log("Generating mock analysis");
  
  // Extract keywords and emotional indicators
  const words = content.toLowerCase().split(/\s+/);
  const titleWords = title.toLowerCase().split(/\s+/);
  const contentLength = content.length;
  
  // Emotional keywords dictionary
  const emotionalKeywords = {
    happy: ["happy", "joy", "excited", "glad", "wonderful", "great", "fantastic", "pleased", "smile", "laugh"],
    sad: ["sad", "unhappy", "depressed", "down", "upset", "disappointing", "somber", "gloomy", "cry", "hurt"],
    angry: ["angry", "frustrated", "annoyed", "mad", "irritated", "furious", "rage", "upset", "hostile"],
    anxious: ["anxious", "worried", "nervous", "stressed", "overwhelmed", "concerned", "tense", "fear", "panic"],
    calm: ["calm", "peaceful", "relaxed", "tranquil", "serene", "content", "balanced", "quiet", "still"]
  };
  
  // Count emotional words in content
  let emotionCounts = {
    happy: 0,
    sad: 0,
    angry: 0,
    anxious: 0, 
    calm: 0
  };
  
  // Analyze both title and content
  [...words, ...titleWords].forEach(word => {
    for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
      if (keywords.some(keyword => word.includes(keyword))) {
        emotionCounts[emotion as keyof typeof emotionCounts]++;
      }
    }
  });
  
  // Find the primary emotion
  let primaryMood = "contemplative"; // Default
  let highestCount = 0;
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > highestCount) {
      highestCount = count;
      primaryMood = emotion;
    }
  }
  
  // Content sentiment analysis - check for question marks, exclamations
  if (content.split('?').length > 3) {
    primaryMood = "curious";
  } else if (content.split('!').length > 3) {
    primaryMood = emotionCounts.happy > 0 ? "excited" : "intense";
  }
  
  // Generate appropriate emotions array based on detected mood
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
    case "curious":
      emotions = ["inquisitive", "thoughtful", "interested"];
      break;
    case "excited":
      emotions = ["enthusiastic", "eager", "animated"];
      break;
    case "intense":
      emotions = ["focused", "determined", "serious"];
      break;
    default:
      emotions = ["thoughtful", "contemplative", "reflective"];
  }
  
  // Analyze writing style and content for strengths and weaknesses
  let strength = "self-awareness";
  let weakness = "clarity";
  
  // Base on content length
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
  
  // Check for uncertainty language
  const uncertaintyWords = ["maybe", "perhaps", "might", "could", "possibly", "unsure", "wonder"];
  if (uncertaintyWords.some(word => words.includes(word))) {
    weakness = "certainty";
  }
  
  // Generate personalized insight based on detected patterns
  let insight = "Taking time to write down your thoughts shows a commitment to self-reflection.";
  
  if (primaryMood === "anxious") {
    insight = "Your writing reveals concerns that might benefit from being addressed directly.";
  } else if (primaryMood === "happy") {
    insight = "Your positive outlook can be channeled into productive pursuits and shared with others.";
  } else if (primaryMood === "sad") {
    insight = "Processing these feelings through writing is a healthy step toward understanding them better.";
  } else if (contentLength > 500) {
    insight = "Your detailed expression suggests deep engagement with your thoughts and experiences.";
  } else if (content.includes("?")) {
    insight = "Your questioning nature shows a desire to understand things more deeply.";
  }
  
  console.log("Mock analysis generated with mood:", primaryMood);
  
  // Return the analysis data
  return {
    mood: primaryMood,
    emotions: emotions,
    strength: strength,
    weakness: weakness,
    insight: insight
  };
};

// Update entry with analysis results
export const updateEntryWithAnalysis = async (
  entryId: string,
  analysisData: any
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('journal_entries')
      .update({
        mood: analysisData.mood,
        emotions: analysisData.emotions,
        strength: analysisData.strength,
        weakness: analysisData.weakness,
        insight: analysisData.insight,
        analysis: analysisData
      })
      .eq('id', entryId);

    if (error) throw error;
    
    console.log("Entry updated with analysis results:", {
      entryId,
      mood: analysisData.mood,
      emotions: analysisData.emotions
    });
  } catch (error) {
    console.error("Error updating entry with analysis:", error);
    throw error;
  }
};
