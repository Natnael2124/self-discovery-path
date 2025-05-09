
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
    // Return mock analysis data instead of calling the API
    console.log("Using mock AI analysis instead of Gemini API");
    
    // Extract some keywords from content for more realistic mock analysis
    const keywords = content.toLowerCase().split(/\s+/).filter(w => w.length > 5).slice(0, 3);
    const emotions = ["reflective", "thoughtful", "curious"];
    
    if (keywords.includes("happy") || keywords.includes("joy") || title.toLowerCase().includes("happy")) {
      emotions[0] = "happy";
    } else if (keywords.includes("sad") || keywords.includes("upset") || title.toLowerCase().includes("sad")) {
      emotions[0] = "sad";
    } else if (keywords.includes("angry") || keywords.includes("frustrat") || title.toLowerCase().includes("angry")) {
      emotions[0] = "angry";
    }
    
    // Simple mock analysis based on length of content
    const mockMood = content.length > 300 ? "contemplative" : "brief";
    const mockStrength = content.length > 200 ? "self-awareness" : "conciseness";
    
    return {
      mood: mockMood,
      emotions: emotions,
      strength: mockStrength,
      weakness: "could provide more context",
      insight: "Taking time to write down thoughts shows a commitment to self-reflection.",
      patterns: {
        positive: ["journaling", "reflection"],
        areas_for_growth: ["detail", "regularity"]
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
