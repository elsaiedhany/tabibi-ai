export interface AIServiceItem {
  name: string;
  price: number;
  durationMinutes: number;
}

export interface AILocationItem {
  name: string;
  address: string;
}

export interface AICompletionRequest {
  doctorId: string;
  doctorName: string;
  specialty: string;
  workingHours: string;
  consultationPrice?: number;
  followupPrice?: number;
  services: AIServiceItem[];
  locations: AILocationItem[];
  conversationHistory: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  userMessage: string;
  systemPromptOverride?: string | null;
  aiTone?: string;
  aiName?: string;
}

export interface AICompletionResponse {
  replyText: string;
  detectedIntent?: string;
  suggestedAction?: {
    actionType: "BOOK_APPOINTMENT" | "CANCEL_APPOINTMENT" | "HANDOFF_TO_HUMAN" | "NONE";
    metadata?: Record<string, any>;
  };
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  providerName: string;
  modelName: string;
}

export interface AIProvider {
  name: string;
  generateResponse(request: AICompletionRequest): Promise<AICompletionResponse>;
}
