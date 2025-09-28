// worker.ts (Modified for robust JSON streaming)

interface Env {
    GEMINI_API_KEY: string;
  }
  
  export default {
    async fetch(request: Request, env: Env, ctx): Promise<Response> {
      const url = new URL(request.url);
  
      if (url.pathname !== '/chat') {
        return new Response('Not Found', { status: 404 });
      }
  
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }
  
      const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';
  
      let requestBody: any;
      try {
        requestBody = await request.json();
      } catch (e) {
        return new Response('Invalid JSON body', { status: 400 });
      }
  
      const geminiPayload = {
        contents: requestBody.contents || [],
        generationConfig: requestBody.generationConfig || {},
        safetySettings: requestBody.safetySettings || [],
      };
  
      // Process the stream directly without ctx.waitUntil()
      const geminiResponse = await fetch(`${GEMINI_API_ENDPOINT}?key=${env.GEMINI_API_KEY}&alt=sse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiPayload),
      });

      if (!geminiResponse.ok || !geminiResponse.body) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API Error:', geminiResponse.status, errorText);
        return new Response(`Error from Gemini API: ${errorText}`, { status: geminiResponse.status });
      }

      // Just proxy the raw SSE stream directly
      return new Response(geminiResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    },
  };