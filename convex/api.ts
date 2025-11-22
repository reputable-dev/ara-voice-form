import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// OpenRouter API integration
export const generateText = mutation({
  args: {
    prompt: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ara-voice-form.app",
          "X-Title": "ARA Voice Form",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            {
              role: "system",
              content: args.context || "You are a helpful AI assistant for form filling and contract analysis."
            },
            {
              role: "user", 
              content: args.prompt
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.choices[0].message.content,
        usage: data.usage,
      };
    } catch (error) {
      console.error("OpenRouter API error:", error);
      throw error;
    }
  },
});

// ElevenLabs API integration for speech-to-text
export const transcribeAudio = mutation({
  args: {
    audioData: v.string(), // base64 encoded audio
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    try {
      const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "xi-api-key": apiKey,
        },
        body: args.audioData,
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.text,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error("ElevenLabs API error:", error);
      throw error;
    }
  },
});

// Health check endpoint
export const healthCheck = query({
  handler: async (ctx) => {
    return {
      status: "ok",
      message: "Convex backend is running",
      timestamp: Date.now(),
    };
  },
});

// Smart edit function for voice editing
export const smartEdit = mutation({
  args: {
    currentValue: v.string(),
    instruction: v.string(),
    fieldName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    const prompt = `You are a smart form editor. Based on the user's voice instruction, update the field value.

Current field value: "${args.currentValue}"
Field name: ${args.fieldName || "unknown"}
User instruction: "${args.instruction}"

Respond with ONLY the new field value. Do not include explanations. If the user wants to clear the field, respond with an empty string. If they want to append, add to the existing content appropriately.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ara-voice-form.app",
          "X-Title": "ARA Voice Form",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            {
              role: "system",
              content: "You are a precise form editor. Respond only with the updated field value, nothing else."
            },
            {
              role: "user",
              content: prompt
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const newValue = data.choices[0].message.content.trim();
      
      return {
        newValue: newValue,
        originalValue: args.currentValue,
        instruction: args.instruction,
      };
    } catch (error) {
      console.error("Smart edit error:", error);
      throw error;
    }
  },
});