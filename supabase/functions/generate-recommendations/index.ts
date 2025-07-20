
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
    const GROQ_API_KEY = Deno.env.get('Groq_api_key');
    
    if (!GROQ_API_KEY) {
      throw new Error('Missing Groq API key');
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

    try {
      // Call Groq API for personalized recommendations
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in personal development and wellness resources. Generate personalized recommendations based on journal analysis.'
            },
            {
              role: 'user',
              content: `Based on these journal entry summaries:
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
          ],
          temperature: 0.7,
          max_tokens: 1024,
        })
      });

      const data = await response.json();
      
      // Check if there's an error in the API response
      if (data.error) {
        console.error('Error from Groq API:', data.error);
        
        if (data.error.code === 429) {
          // Return fallback recommendations when quota is exceeded
          return new Response(JSON.stringify([
            {
              id: "fallback-rec-1",
              type: "youtube",
              title: "How to Journal Effectively",
              description: "Learn the basics of effective journaling to improve self-awareness and mindfulness.",
              url: "https://www.youtube.com/results?search_query=how+to+journal+effectively",
              author: "Various"
            },
            {
              id: "fallback-rec-2",
              type: "book",
              title: "The Daily Stoic",
              description: "366 Meditations on Wisdom, Perseverance, and the Art of Living.",
              author: "Ryan Holiday & Stephen Hanselman"
            },
            {
              id: "fallback-rec-3",
              type: "article",
              title: "The Benefits of Journaling",
              description: "Research-backed benefits of regular journaling practice.",
              url: "https://www.healthline.com/health/benefits-of-journaling",
              author: "Healthline"
            },
            {
              id: "fallback-rec-4",
              type: "podcast",
              title: "The Mindfulness Podcast",
              description: "Guided meditations and mindfulness practices for daily life.",
              url: "https://www.mindful.org/category/meditation/guided-meditation/",
              author: "Mindful.org"
            }
          ]), {
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

      let recommendationsText = data.choices[0].message.content;
      
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
        console.error('Error parsing Groq response as JSON:', jsonError, recommendationsText);
        throw new Error('Invalid JSON response from Groq API');
      }
    } catch (apiError) {
      console.error('Error calling Groq API:', apiError);
      
      // Provide fallback recommendations when API calls fail
      return new Response(JSON.stringify([
        {
          id: "fallback-rec-1",
          type: "youtube",
          title: "How to Journal Effectively",
          description: "Learn the basics of effective journaling to improve self-awareness and mindfulness.",
          url: "https://www.youtube.com/results?search_query=how+to+journal+effectively",
          author: "Various"
        },
        {
          id: "fallback-rec-2",
          type: "book",
          title: "The Daily Stoic",
          description: "366 Meditations on Wisdom, Perseverance, and the Art of Living.",
          author: "Ryan Holiday & Stephen Hanselman"
        },
        {
          id: "fallback-rec-3",
          type: "article",
          title: "The Benefits of Journaling",
          description: "Research-backed benefits of regular journaling practice.",
          url: "https://www.healthline.com/health/benefits-of-journaling",
          author: "Healthline"
        },
        {
          id: "fallback-rec-4",
          type: "podcast",
          title: "The Mindfulness Podcast",
          description: "Guided meditations and mindfulness practices for daily life.",
          url: "https://www.mindful.org/category/meditation/guided-meditation/",
          author: "Mindful.org"
        }
      ]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in generate-recommendations function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
