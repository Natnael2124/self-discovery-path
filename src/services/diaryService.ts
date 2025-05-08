
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

// Analyze an entry using Supabase Edge Function
export const analyzeEntryWithAI = async (
  entryId: string, 
  title: string, 
  content: string
): Promise<any> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-journal', {
      body: {
        title,
        content
      }
    });
    
    if (error) throw new Error(error.message);
    if (!data) throw new Error("No analysis data returned");
    
    return data;
  } catch (error) {
    console.error("Error analyzing entry:", error);
    // Return fallback analysis with _fallback flag
    return {
      mood: "contemplative",
      emotions: ["thoughtful", "reflective"],
      strength: "self-awareness",
      weakness: "uncertainty",
      insight: "Taking time to reflect shows a commitment to personal growth.",
      _fallback: true,
      _quotaExceeded: error.message?.includes("quota exceeded")
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
