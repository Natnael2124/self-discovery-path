
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('Missing Gemini API key');
    }

    if (!title || !content) {
      throw new Error('Missing required parameters: title and content');
    }

    console.log('Analyzing journal entry:', { title });

    // Call Gemini API for journal entry analysis
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze the following journal entry. 
                Title: "${title}"
                Content: "${content}"
                
                Provide a detailed analysis with the following components:
                1. The overall mood of the writer (single word or short phrase)
                2. Three key emotions expressed (as a list of single words)
                3. One notable strength demonstrated in the entry (single word or short phrase)
                4. One area for growth or weakness (single word or short phrase)
                5. A brief insight or pattern (1-2 sentences)
                
                Format the response as a JSON object with this structure:
                {
                  "mood": "string",
                  "emotions": ["string", "string", "string"],
                  "strength": "string",
                  "weakness": "string",
                  "insight": "string"
                }
                
                Only respond with the JSON object and nothing else.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('Error from Gemini API:', data);
      throw new Error('Failed to get proper response from Gemini API');
    }

    let analysisText = data.candidates[0].content.parts[0].text;
    
    // Clean up the response to ensure it's valid JSON
    analysisText = analysisText.replace(/```json|```/g, '').trim();
    
    try {
      const analysis = JSON.parse(analysisText);
      
      // Build the full analysis object with all required fields
      const fullAnalysis = {
        mood: analysis.mood || "neutral",
        emotions: analysis.emotions || ["neutral"],
        strength: analysis.strength || "reflection",
        weakness: analysis.weakness || "unclear",
        insight: analysis.insight || "Continue journaling to develop more insights.",
        patterns: {
          positive: ["journaling"],
          areas_for_growth: [analysis.weakness || "self-awareness"]
        }
      };

      return new Response(JSON.stringify(fullAnalysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (jsonError) {
      console.error('Error parsing Gemini response as JSON:', jsonError, analysisText);
      throw new Error('Invalid JSON response from Gemini API');
    }
  } catch (error) {
    console.error('Error in analyze-journal function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
