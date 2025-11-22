import { generateText } from '@rork-ai/toolkit-sdk';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ConversationOptions {
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onStream?: (chunk: string) => void;
}

export class ConversationalAI {
  private conversationHistory: Message[] = [];
  private systemPrompt: string;
  private options: ConversationOptions;

  constructor(options: ConversationOptions = {}) {
    this.systemPrompt =
      options.systemPrompt ||
      `You are a helpful AI assistant with voice interaction capabilities.
You provide clear, concise, and friendly responses. When users speak to you via voice,
you understand context from the entire conversation and respond naturally.`;

    this.options = {
      model: options.model || 'anthropic/claude-3.5-sonnet',
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens || 1000,
      onStream: options.onStream,
    };

    // Add system message to history
    this.conversationHistory.push({
      role: 'system',
      content: this.systemPrompt,
    });
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    try {
      // Generate response using OpenRouter
      const messages = this.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const result = await generateText({
        messages,
        temperature: this.options.temperature,
        max_tokens: this.options.maxTokens,
      });

      const assistantResponse = result.trim();

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantResponse,
      });

      return assistantResponse;
    } catch (error) {
      console.error('ConversationalAI: Error generating response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Send a message with streaming response
   */
  async *streamMessage(userMessage: string): AsyncGenerator<string, void, unknown> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    let fullResponse = '';

    try {
      // For now, simulate streaming by yielding chunks
      // In a real implementation, you'd use the streaming API
      const response = await this.sendMessage(userMessage);

      // Simulate streaming by yielding character by character
      for (let i = 0; i < response.length; i += 3) {
        const chunk = response.substring(i, i + 3);
        fullResponse += chunk;
        yield chunk;
        // Small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Update conversation history with full response
      this.conversationHistory[this.conversationHistory.length - 1] = {
        role: 'assistant',
        content: fullResponse,
      };
    } catch (error) {
      console.error('ConversationalAI: Error streaming response:', error);
      throw new Error('Failed to stream AI response');
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history (keeps system prompt)
   */
  clearHistory(): void {
    this.conversationHistory = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
    ];
  }

  /**
   * Get the last assistant message
   */
  getLastResponse(): string | null {
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      if (this.conversationHistory[i].role === 'assistant') {
        return this.conversationHistory[i].content;
      }
    }
    return null;
  }

  /**
   * Update system prompt and reset conversation
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
    this.clearHistory();
  }
}

/**
 * Create a new conversational AI instance
 */
export function createConversationalAI(options: ConversationOptions = {}): ConversationalAI {
  return new ConversationalAI(options);
}

/**
 * Preset system prompts for common use cases
 */
export const SYSTEM_PROMPTS = {
  general: `You are a helpful AI assistant. Provide clear, concise, and friendly responses.`,

  customer_support: `You are a customer support agent. Be empathetic, professional, and solution-oriented.
Always acknowledge the user's concern and provide clear steps to resolve their issue.`,

  creative_writing: `You are a creative writing assistant. Help users brainstorm ideas, improve their writing,
and provide constructive feedback. Be encouraging and imaginative.`,

  code_helper: `You are a programming assistant. Help users understand code, debug issues, and learn best practices.
Provide clear explanations and working code examples when appropriate.`,

  voice_assistant: `You are a voice-activated AI assistant. Respond naturally to voice commands and questions.
Keep responses concise and conversational, as they will be read aloud or displayed to the user.`,
};
