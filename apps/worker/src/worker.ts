export default {
    async fetch(request, env, ctx) {
      const GEMINI_API_KEY = env.GEMINI_API_KEY; // Stored in Cloudflare Worker secrets
      const GEMINI_MODEL = 'gemini-2.5-flash'; // Or 'gemini-pro-vision' for multimodal
      const API_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent`;
  
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }
  
      // You'll likely want to parse the incoming request body from your client
      // For simplicity, let's assume a basic text prompt for now.
      // In a real app, you'd parse `request.json()` for a more complex prompt.
      let requestBody;
      try {
        const clientRequestBody = await request.json();
        requestBody = {
          contents: clientRequestBody.contents || [{ parts: [{ text: "Tell me a story about a futuristic city." }] }],
          // Add generation config, safety settings, etc., if needed
          generationConfig: clientRequestBody.generationConfig,
          safetySettings: clientRequestBody.safetySettings,
        };
      } catch (error) {
        return new Response('Invalid JSON in request body', { status: 400 });
      }
  
  
      try {
        const geminiResponse = await fetch(`${API_BASE_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          // Important: Cloudflare's fetch will automatically handle streaming
          // if the upstream response is streamed.
        });
  
        // Check if the Gemini API returned an error
        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error('Gemini API error:', geminiResponse.status, errorText);
          return new Response(`Gemini API error: ${errorText}`, { status: geminiResponse.status });
        }
  
        // Create a TransformStream to process Gemini's streamed chunks
        // and re-stream them to the client. This is crucial for maintaining the stream.
        const { readable, writable } = new TransformStream();
        console.log('geminiResponse', geminiResponse)
        // Start processing the Gemini response body in the background
        ctx.waitUntil((async () => {
          const reader = geminiResponse.body.getReader();
          const writer = writable.getWriter();
          const textDecoder = new TextDecoder();
          const textEncoder = new TextEncoder();
  
          try {
            while (true) {
              const { done, value } = await reader.read();
              console.log('value', value)
              if (done) break;
  
              // Gemini API's streaming response sends newline-delimited JSON objects.
              // Example: "data: { ... }\n\n"
              // We need to parse each chunk, extract the text, and send it.
              const chunkString = textDecoder.decode(value);
              console.log('chunkString', chunkString)
              const jsonStrings = chunkString.split('\n').filter(s => s.trim().startsWith('data: ')).map(s => s.replace('data: ', '').trim());
              for (const jsonStr of jsonStrings) {
                if (jsonStr) {
                  try {
                    const data = JSON.parse(jsonStr);
                    console.log('data', data)
                    // Each 'data' object is a GenerateContentResponse
                    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                      for (const part of data.candidates[0].content.parts) {
                        if (part.text) {
                          await writer.write(textEncoder.encode(part.text));
                        }
                      }
                    }
                    // You might also want to forward other parts of the response,
                    // like finishReason, if your client needs it.
                  } catch (parseError) {
                    console.error('JSON parse error in chunk:', parseError, jsonStr);
                    // Optionally write an error to the stream or just skip this malformed chunk
                  }
                }
              }
            }
          } catch (readError) {
            console.error('Error reading Gemini stream:', readError);
          } finally {
            writer.close();
          }
        })());
  
        // Return a new Response with the readable stream, maintaining streaming to the client
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8', // Or 'text/event-stream' if you want SSE format
            // 'X-Content-Type-Options': 'nosniff', // Good practice
          },
        });
  
      } catch (error) {
        console.error('Worker error:', error);
        return new Response(`Worker error: ${error.message}`, { status: 500 });
      }
    },
  };