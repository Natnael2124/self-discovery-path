
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
    const { entries } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('Missing Gemini API key');
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      throw new Error('Missing or invalid entries parameter');
    }

    console.log('Generating recommendations based on journal entries');

    // Prepare a summary of the journal entries for Gemini
    const entriesSummary = entries.map(entry => {
      return {
        title: entry.title,
        content: entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
        mood: entry.mood,
        emotions: entry.emotions,
        strength: entry.strength,
        weakness: entry.weakness
      };
    });

    // Call Gemini API for personalized recommendations
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
                text: `Based on these journal entry summaries:
                ${JSON.stringify(entriesSummary, null, 2)}
                
                Generate 4 personalized recommendations for resources that would be helpful for the journal writer.
                Include a mix of different resource types (youtube videos, books, articles, podcasts).
                
                Format the response as a JSON array with this structure:
                [
                  {
                    "id": "unique-string",
                    "type": "youtube|podcast|article|book",
                    "title": "string",
                    "description": "string",
                    "url": "string (for online resources)",
                    "author": "string (if applicable)"
                  },
                  ...
                ]
                
                Make sure each recommendation is specific, relevant to the journal content themes, and helpful for personal growth.
                Only respond with the JSON array and nothing else.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
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

    let recommendationsText = data.candidates[0].content.parts[0].text;
    
    // Clean up the response to ensure it's valid JSON
    recommendationsText = recommendationsText.replace(/```json|```/g, '').trim();
    
    try {
      const recommendations = JSON.parse(recommendationsText);
      
      // Ensure we have valid recommendations with proper IDs
      const validatedRecommendations = recommendations.map(rec => ({
        ...rec,
        id: rec.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }));

      return new Response(JSON.stringify(validatedRecommendations), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (jsonError) {
      console.error('Error parsing Gemini response as JSON:', jsonError, recommendationsText);
      throw new Error('Invalid JSON response from Gemini API');
    }
  } catch (error) {
    console.error('Error in generate-recommendations function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
