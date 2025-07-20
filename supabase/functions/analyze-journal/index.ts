
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
    const GROQ_API_KEY = Deno.env.get('Groq_api_key');
    
    if (!GROQ_API_KEY) {
      throw new Error('Missing Groq API key');
    }

    if (!title || !content) {
      throw new Error('Missing required parameters: title and content');
    }

    console.log('Analyzing journal entry:', { title });

    try {
      // Call Groq API for journal entry analysis
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an expert journal analyst. Analyze journal entries and provide structured psychological insights.'
            },
            {
              role: 'user',
              content: `Analyze the following journal entry. 
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
          ],
          temperature: 0.4,
          max_tokens: 1024,
        })
      });

      const data = await response.json();
      
      // Check if there's an error in the API response
      if (data.error) {
        console.error('Error from Groq API:', data.error);
        
        if (data.error.code === 429) {
          // Return a fallback analysis with a quota exceeded message
          return new Response(JSON.stringify({
            mood: "neutral",
            emotions: ["contemplative", "reflective", "thoughtful"],
            strength: "self-awareness",
            weakness: "clarity",
            insight: "You're taking time to reflect, which is valuable. Continue journaling to develop deeper insights.",
            _fallback: true,
            _quotaExceeded: true
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          throw new Error(data.error.message || 'Error calling Groq API');
        }
      }
      
      if (!data.choices || data.choices.length === 0) {
        console.error('Error from Groq API:', data);
        throw new Error('Failed to get proper response from Groq API');
      }

      let analysisText = data.choices[0].message.content;
      
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
        console.error('Error parsing Groq response as JSON:', jsonError, analysisText);
        throw new Error('Invalid JSON response from Groq API');
      }
    } catch (apiError) {
      console.error('Error calling Groq API:', apiError);
      
      // Provide a fallback analysis when API calls fail
      return new Response(JSON.stringify({
        mood: "neutral",
        emotions: ["contemplative", "reflective", "thoughtful"],
        strength: "self-awareness",
        weakness: "clarity",
        insight: "You're taking time to reflect, which is valuable. Continue journaling to develop deeper insights.",
        _fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in analyze-journal function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
