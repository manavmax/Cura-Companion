import api from './api';

// Description: Get all journal entries for the current user
// Endpoint: GET /api/journal-entries
// Request: {}
// Response: Array<{ _id: string, title: string, content: string, date: Date, mood?: string, tags: string[], type: "text" | "voice", audioUrl?: string, wordCount: number }>
export const getJournalEntries = async () => {
  try {
    const response = await api.get('/api/journal-entries');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Save a new journal entry
// Endpoint: POST /api/journal-entries
// Request: { title?: string, content: string, mood?: string, tags?: string[], type?: "text" | "voice", audioUrl?: string }
// Response: { success: boolean, message: string, entry: { _id: string, title: string, content: string, date: Date, mood?: string, tags: string[], type: "text" | "voice", audioUrl?: string, wordCount: number } }
export const saveJournalEntry = async (entryData: { title?: string; content: string; mood?: string; tags?: string[]; type?: "text" | "voice"; audioUrl?: string; wordCount?: number }) => {
  // TODO: Integrate real voice recording/transcription for voice entries
  try {
    const response = await api.post('/api/journal-entries', entryData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Delete a journal entry
// Endpoint: DELETE /api/journal-entries/:id
// Request: {}
// Response: { success: boolean, message: string }
export const deleteJournalEntry = async (entryId: string) => {
  try {
    const response = await api.delete(`/api/journal-entries/${entryId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get writing prompts for journal entries
// Endpoint: GET /api/journal-entries/prompts
// Request: {}
// Response: Array<string>
export const getWritingPrompts = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        "What am I grateful for today?",
        "What challenged me today and how did I handle it?",
        "Describe a moment when I felt truly happy recently.",
        "What are three things I learned about myself this week?",
        "How did I show kindness to myself or others today?",
        "What emotions did I experience today and why?",
        "What would I tell my younger self about today's experiences?",
        "What are my hopes and dreams for tomorrow?",
        "How did I grow or change today?",
        "What made me smile today?",
        "What was the most meaningful part of my day?",
        "How did I take care of my mental health today?",
        "What patterns do I notice in my thoughts and feelings?",
        "What am I looking forward to?",
        "How can I be more compassionate with myself?"
      ]);
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get('/api/journal-entries/prompts');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};