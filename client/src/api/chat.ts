import api from './api';

// Description: Create a new chat session
// Endpoint: POST /api/chat-sessions
// Request: { mode?: "text" | "voice" | "video", sessionType?: "therapy" | "crisis" | "general" }
// Response: { success: boolean, message: string, session: { id: string, mode: string, status: string, sessionType: string, startedAt: Date, messages: Array } }
export const createChatSession = async (data: { mode?: "text" | "voice" | "video", sessionType?: "therapy" | "crisis" | "general" } = {}) => {
  try {
    const response = await api.post('/api/chat-sessions', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Get all chat sessions for the current user
// Endpoint: GET /api/chat-sessions
// Request: { limit?: number }
// Response: Array<{ id: string, mode: string, status: string, sessionType: string, startedAt: Date, endedAt?: Date, duration?: number, messageCount: number }>
export const getChatSessions = async (limit?: number) => {
  try {
    const params = limit ? { limit } : {};
    const response = await api.get('/api/chat-sessions', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Get a single chat session by ID
// Endpoint: GET /api/chat-sessions/:id
// Request: {}
// Response: { id: string, mode: string, status: string, sessionType: string, startedAt: Date, endedAt?: Date, duration?: number, messages: Array<{ id: string, content: string, sender: "user" | "ai", timestamp: Date, type: "text" | "voice" | "crisis" }> }
export const getChatSession = async (sessionId: string) => {
  try {
    const response = await api.get(`/api/chat-sessions/${sessionId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: End a chat session
// Endpoint: POST /api/chat-sessions/:id/end
// Request: {}
// Response: { success: boolean, message: string, session: { id: string, status: string, endedAt: Date, duration: number } }
export const endChatSession = async (sessionId: string) => {
  try {
    const response = await api.post(`/api/chat-sessions/${sessionId}/end`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Add a message to a chat session
// Endpoint: POST /api/chat-sessions/:id/messages
// Request: { content: string, sender: "user" | "ai", type?: "text" | "voice" | "crisis" }
// Response: { success: boolean, message: string, messageData: { id: string, content: string, sender: string, timestamp: Date, type: string } }
export const addMessageToSession = async (sessionId: string, messageData: { content: string, sender: "user" | "ai", type?: "text" | "voice" | "crisis" }) => {
  try {
    const response = await api.post(`/api/chat-sessions/${sessionId}/messages`, messageData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Get chat history for therapy sessions (backward compatibility)
// Endpoint: GET /api/chat-sessions/:id/messages
// Request: {}
// Response: Array<{ id: string, content: string, sender: "user" | "ai", timestamp: Date, type: "text" | "voice" | "crisis" }>
export const getChatHistory = async (sessionId?: string) => {
  if (!sessionId) {
    // Return empty array if no session ID provided
    return [];
  }
  
  try {
    const response = await api.get(`/api/chat-sessions/${sessionId}/messages`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Send a message to the AI therapist
// Endpoint: POST /api/chat-sessions/:id/ai-message
// Request: { content: string }
// Response: { content: string, isCrisis?: boolean }
export const sendMessage = async (message: string, sessionId?: string) => {
  if (!sessionId) {
    throw new Error('Session ID is required to send a message');
  }

  try {
    const response = await api.post(`/api/chat-sessions/${sessionId}/ai-message`, { content: message });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Start a voice therapy session
// Endpoint: POST /api/chat-sessions (with voice mode)
// Request: {}
// Response: { sessionId: string, status: string }
export const startVoiceSession = async () => {
  try {
    const response = await createChatSession({ mode: "voice", sessionType: "therapy" });
    return {
      sessionId: response.session.id,
      status: response.session.status
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Start a video therapy session
// Endpoint: POST /api/chat-sessions (with video mode)
// Request: {}
// Response: { sessionId: string, status: string }
export const startVideoSession = async () => {
  try {
    const response = await createChatSession({ mode: "video", sessionType: "therapy" });
    return {
      sessionId: response.session.id,
      status: response.session.status
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}