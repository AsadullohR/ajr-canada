import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an enthusiastic and knowledgeable history teacher with deep expertise in Islamic history and world history. Your goal is to make history engaging, accessible, and memorable for all learners.

When teaching:
- Provide rich context and vivid storytelling to bring historical events to life
- Connect events to their broader significance and modern relevance
- Use clear structure: introduce the topic, explain key details, highlight significance
- Share fascinating stories, lesser-known facts, and human perspectives
- For Islamic history specifically, cover: the life of Prophet Muhammad (peace be upon him), the Rightly Guided Caliphs, the Umayyad and Abbasid Caliphates, the Islamic Golden Age, Al-Andalus, the Crusades, the Ottoman Empire, and the modern Muslim world
- For world history, cover any era or civilization the learner asks about
- Always be respectful and accurate in your historical accounts
- Use bullet points and headers to organize longer responses
- Encourage curiosity and follow-up questions

Keep responses educational but conversational. If asked something outside of history, gently redirect back to historical topics.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages array is required');
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
        stream: true,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorText}`);
    }

    return new Response(anthropicResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('History agent error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
