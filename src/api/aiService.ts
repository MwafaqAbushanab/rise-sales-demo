// AI Service - Connects to the Claude-powered backend
// This replaces the pattern-matching approach with real AI

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface LeadContext {
  name: string;
  type: 'Credit Union' | 'Community Bank';
  city: string;
  state: string;
  assets: number;
  members: number;
  score: number;
  status: string;
  recommendedProducts?: string[];
  intelligence?: {
    opportunityTier: string;
    opportunityScore: number;
    dealSizeEstimate: string;
    keyTalkingPoints: string[];
    potentialChallenges: string[];
    recommendedApproach: string;
  };
  competitiveIntel?: {
    currentVendors: Array<{ competitor?: { name: string } }>;
    displacementDifficulty: number;
    switchingCost: string;
    winBackStrategy: string;
  };
  roiProjection?: {
    annualROI: number;
    paybackMonths: number;
    totalAnnualBenefit: number;
    threeYearValue: number;
  };
}

export interface ChatResponse {
  message: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

// Non-streaming chat request
export async function sendChatMessage(
  message: string,
  leadContext: LeadContext | null,
  conversationHistory: Message[] = []
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      leadContext,
      conversationHistory,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
}

// Streaming chat request for better UX
export async function streamChatMessage(
  message: string,
  leadContext: LeadContext | null,
  conversationHistory: Message[] = [],
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        leadContext,
        conversationHistory,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      callbacks.onError(error.error || 'Failed to start stream');
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError('Stream not supported');
      return;
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              callbacks.onDone();
            } else if (data.error) {
              callbacks.onError(data.error);
            } else if (data.text) {
              callbacks.onChunk(data.text);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : 'Stream failed');
  }
}

// Generate email with AI
export async function generateEmail(
  leadContext: LeadContext,
  emailType: 'cold_outreach' | 'follow_up' | 'demo_request' | 'proposal' = 'cold_outreach',
  customInstructions?: string
): Promise<{ email: string }> {
  const response = await fetch(`${API_BASE_URL}/api/generate/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      leadContext,
      emailType,
      customInstructions,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate email');
  }

  return response.json();
}

// Check if AI backend is available
export async function checkAIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Fallback response when AI is unavailable
export function getFallbackResponse(message: string, leadName?: string): string {
  const msg = message.toLowerCase();

  if (msg.includes('email') || msg.includes('outreach')) {
    return `I'd love to help you write an email for ${leadName || 'this prospect'}! However, the AI backend is currently unavailable. Please check that the server is running on port 3002.\n\n**To start the server:**\n\`\`\`bash\ncd server && npm install && npm run dev\n\`\`\`\n\nMake sure you have your ANTHROPIC_API_KEY set in server/.env`;
  }

  if (msg.includes('help') || msg.includes('what can')) {
    return `I'm your AI Sales Agent! I can help you with:\n\n• **Write personalized emails** - Cold outreach, follow-ups, proposals\n• **Sales strategy** - Tactical advice based on the prospect\n• **Objection handling** - Data-backed responses to concerns\n• **ROI discussions** - Value articulation tailored to them\n• **Competitive positioning** - Battle cards and differentiation\n• **Demo prep** - Custom scripts and talking points\n\n⚠️ **Note:** AI features require the backend server to be running.`;
  }

  return `I'm ready to help with ${leadName || 'your sales efforts'}! The AI backend appears to be offline. Start the server with:\n\n\`\`\`bash\ncd server && npm run dev\n\`\`\``;
}
