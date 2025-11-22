/**
 * OpenRouter API Proxy Endpoint
 *
 * Security Layer: Moves API key to server-side to prevent exposure in client code
 *
 * Usage:
 *   POST /api/gemini-proxy
 *   Body: {
 *     prompt: string,
 *     generationConfig?: {...}
 *   }
 */

import { Request, Response } from 'express';

interface OpenRouterProxyRequest {
  prompt: string;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export async function POST(req: Request, res: Response) {
  try {
    // Validate request
    const { prompt, generationConfig }: OpenRouterProxyRequest = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Prompt is required and must be a string'
      });
    }

    // Get API key from environment (server-side only)
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured in environment');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Server is not properly configured. Please contact support.'
      });
    }

    // Prepare OpenRouter API request
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const requestBody = {
      model: 'anthropic/claude-3-haiku', // Fast and cost-effective model
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: generationConfig?.temperature ?? 0.1,
      max_tokens: generationConfig?.maxOutputTokens ?? 1024,
      top_p: generationConfig?.topP ?? 1,
    };

    // Call OpenRouter API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || '', // Optional: for rankings
        'X-Title': process.env.OPENROUTER_X_TITLE || '', // Optional: for rankings
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);

      // Don't expose detailed error to client
      return res.status(response.status).json({
        error: 'AI service error',
        message: 'Failed to process request. Please try again.'
      });
    }

    const data = await response.json();

    // Validate response format
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenRouter API response format:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Invalid response',
        message: 'Received invalid response from AI service'
      });
    }

    // Extract and return AI response
    const aiResponse = data.choices[0].message.content;

    return res.status(200).json({
      success: true,
      response: aiResponse,
      model: 'anthropic/claude-3-haiku'
    });

  } catch (error) {
    console.error('OpenRouter proxy error:', error);

    return res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
}

// For serverless deployment (Vercel, Netlify, etc.)
export default async function handler(req: Request, res: Response) {
  if (req.method === 'POST') {
    return POST(req, res);
  }

  return res.status(405).json({
    error: 'Method not allowed',
    message: 'Only POST requests are accepted'
  });
}
