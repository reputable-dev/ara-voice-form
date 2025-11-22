/**
 * Gemini API Proxy Endpoint
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

interface GeminiProxyRequest {
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
    const { prompt, generationConfig }: GeminiProxyRequest = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Prompt is required and must be a string'
      });
    }

    // Get API key from environment (server-side only)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured in environment');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Server is not properly configured. Please contact support.'
      });
    }

    // Prepare Gemini API request
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: generationConfig || {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1024,
      },
    };

    // Call Gemini API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);

      // Don't expose detailed error to client
      return res.status(response.status).json({
        error: 'AI service error',
        message: 'Failed to process request. Please try again.'
      });
    }

    const data = await response.json();

    // Validate response format
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini API response format:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Invalid response',
        message: 'Received invalid response from AI service'
      });
    }

    // Extract and return AI response
    const aiResponse = data.candidates[0].content.parts[0].text;

    return res.status(200).json({
      success: true,
      response: aiResponse,
      model: 'gemini-2.0-flash-exp'
    });

  } catch (error) {
    console.error('Gemini proxy error:', error);

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
