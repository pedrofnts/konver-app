import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface Database {
  public: {
    Tables: {
      message_feedback: {
        Row: {
          id: string;
          bot_id: string | null;
          user_message_context: string;
          original_bot_response: string;
          improved_response: string;
          status: string;
          similarity_keywords: string[] | null;
          conversation_context: any;
          times_applied: number | null;
          last_applied_at: string | null;
          created_at: string | null;
        };
      };
    };
  };
}

interface MessageFeedback {
  id: string;
  conversation_message_id?: string;
  bot_id?: string;
  user_message_context: string;
  original_bot_response: string;
  improved_response: string;
  status: string;
  similarity_keywords?: string[];
  conversation_context?: any;
  times_applied?: number;
  last_applied_at?: string;
  created_at?: string;
  updated_at?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Get bot_id from query params or headers
    const botId = url.searchParams.get('bot_id') || req.headers.get('x-bot-id');
    
    if (!botId) {
      return new Response(
        JSON.stringify({ error: 'bot_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    switch (pathname) {
      case '/bot-feedback-api/search':
        return await handleSearchFeedback(req, supabase, botId);
      
      case '/bot-feedback-api/best-response':
        return await handleGetBestResponse(req, supabase, botId);
      
      case '/bot-feedback-api/apply-feedback':
        return await handleApplyFeedback(req, supabase, botId);
      
      case '/bot-feedback-api/stats':
        return await handleGetStats(req, supabase, botId);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('Error in bot-feedback-api:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Search for similar feedbacks based on user input
async function handleSearchFeedback(req: Request, supabase: any, botId: string) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { userMessage, limit = 5 } = await req.json();
  
  if (!userMessage) {
    return new Response(
      JSON.stringify({ error: 'userMessage is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Search for similar contexts using text search and keywords
  const { data: feedbacks, error } = await supabase
    .from('message_feedback')
    .select('*')
    .eq('bot_id', botId)
    .eq('status', 'applied')
    .textSearch('user_message_context', userMessage.replace(/[^\w\s]/g, ''))
    .order('times_applied', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching feedbacks:', error);
    return new Response(
      JSON.stringify({ error: 'Database error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Also search by keywords if no text search results
  let keywordResults = [];
  if (!feedbacks || feedbacks.length === 0) {
    const keywords = userMessage.toLowerCase().split(/\s+/).filter((word: string) => word.length > 2);
    
    if (keywords.length > 0) {
      const { data: keywordFeedbacks } = await supabase
        .from('message_feedback')
        .select('*')
        .eq('bot_id', botId)
        .eq('status', 'applied')
        .overlaps('similarity_keywords', keywords)
        .order('times_applied', { ascending: false })
        .limit(limit);
      
      keywordResults = keywordFeedbacks || [];
    }
  }

  const allResults = [...(feedbacks || []), ...keywordResults];
  const uniqueResults = allResults.filter((item, index, self) => 
    index === self.findIndex(t => t.id === item.id)
  );

  return new Response(
    JSON.stringify({
      success: true,
      feedbacks: uniqueResults.slice(0, limit),
      total: uniqueResults.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get the best response for a specific user input
async function handleGetBestResponse(req: Request, supabase: any, botId: string) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { userMessage, threshold = 0.7 } = await req.json();
  
  if (!userMessage) {
    return new Response(
      JSON.stringify({ error: 'userMessage is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // First try exact or very similar matches
  const { data: exactMatches } = await supabase
    .from('message_feedback')
    .select('*')
    .eq('bot_id', botId)
    .eq('status', 'applied')
    .ilike('user_message_context', `%${userMessage}%`)
    .order('times_applied', { ascending: false })
    .limit(1);

  if (exactMatches && exactMatches.length > 0) {
    const feedback = exactMatches[0];
    
    // Update usage count
    await supabase
      .from('message_feedback')
      .update({ 
        times_applied: (feedback.times_applied || 0) + 1,
        last_applied_at: new Date().toISOString()
      })
      .eq('id', feedback.id);

    return new Response(
      JSON.stringify({
        success: true,
        found: true,
        improved_response: feedback.improved_response,
        confidence: 1.0,
        feedback_id: feedback.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // If no exact match, try keyword matching
  const keywords = userMessage.toLowerCase().split(/\s+/).filter((word: string) => word.length > 2);
  
  if (keywords.length > 0) {
    const { data: keywordMatches } = await supabase
      .from('message_feedback')
      .select('*')
      .eq('bot_id', botId)
      .eq('status', 'applied')
      .overlaps('similarity_keywords', keywords)
      .order('times_applied', { ascending: false })
      .limit(3);

    if (keywordMatches && keywordMatches.length > 0) {
      // Simple scoring based on keyword overlap
      const scoredMatches = keywordMatches.map((feedback: any) => {
        const feedbackKeywords = feedback.similarity_keywords || [];
        const overlap = keywords.filter(k => feedbackKeywords.includes(k)).length;
        const score = overlap / Math.max(keywords.length, feedbackKeywords.length);
        return { ...feedback, score };
      });

      const bestMatch = scoredMatches.sort((a, b) => b.score - a.score)[0];
      
      if (bestMatch.score >= threshold) {
        // Update usage count
        await supabase
          .from('message_feedback')
          .update({ 
            times_applied: (bestMatch.times_applied || 0) + 1,
            last_applied_at: new Date().toISOString()
          })
          .eq('id', bestMatch.id);

        return new Response(
          JSON.stringify({
            success: true,
            found: true,
            improved_response: bestMatch.improved_response,
            confidence: bestMatch.score,
            feedback_id: bestMatch.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      found: false,
      message: 'No matching improved response found'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Mark feedback as applied (when N8N successfully uses it)
async function handleApplyFeedback(req: Request, supabase: any, botId: string) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { feedbackId } = await req.json();
  
  if (!feedbackId) {
    return new Response(
      JSON.stringify({ error: 'feedbackId is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from('message_feedback')
    .update({ status: 'applied' })
    .eq('id', feedbackId)
    .eq('bot_id', botId)
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to apply feedback' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      feedback: data
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get feedback statistics for the bot
async function handleGetStats(req: Request, supabase: any, botId: string) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: stats, error } = await supabase
    .from('message_feedback')
    .select('status, times_applied')
    .eq('bot_id', botId);

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get stats' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const summary = {
    total: stats.length,
    by_status: {},
    total_applications: 0
  };

  stats.forEach((item: any) => {
    // Count by status
    summary.by_status[item.status] = (summary.by_status[item.status] || 0) + 1;
    
    // Sum applications
    summary.total_applications += item.times_applied || 0;
  });

  return new Response(
    JSON.stringify({
      success: true,
      stats: summary
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
} 