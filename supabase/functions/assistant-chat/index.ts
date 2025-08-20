import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey'
      }
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // Parse request body
    const { chatInput, sessionId, assistant, promptVersions } = await req.json();

    // Validate required fields
    if (!chatInput || !sessionId || !assistant) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: chatInput, sessionId, assistant'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get N8N webhook URL from environment
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (!webhookUrl) {
      return new Response(JSON.stringify({
        error: 'N8N_WEBHOOK_URL environment variable not configured'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Prepare payload for N8N
    const n8nPayload = {
      chatInput,
      sessionId,
      assistant,
      ...promptVersions && {
        promptVersions: {
          principal: promptVersions.principal,
          triagem: promptVersions.triagem
        }
      }
    };

    console.log('Sending to N8N:', JSON.stringify(n8nPayload, null, 2));

    // Set up timeout controller (280 seconds = 4 minutes 40 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 280000);

    try {
      // Make request to N8N webhook
      const n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if N8N request was successful
      if (!n8nResponse.ok) {
        console.error('N8N webhook request failed:', n8nResponse.status, n8nResponse.statusText);
        return new Response(JSON.stringify({
          error: 'Failed to communicate with assistant service',
          details: `${n8nResponse.status} ${n8nResponse.statusText}`
        }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Parse N8N response
      const n8nData = await n8nResponse.json();

      // Return successful response
      return new Response(JSON.stringify({
        success: true,
        response: n8nData.output || 'No response from assistant',
        sessionId,
        assistant,
        promptVersions: promptVersions || null
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle timeout errors
      if (fetchError.name === 'AbortError') {
        return new Response(JSON.stringify({
          error: 'Request timeout',
          message: 'The N8N webhook took too long to respond'
        }), {
          status: 408,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Re-throw other fetch errors to be caught by outer catch
      throw fetchError;
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});

