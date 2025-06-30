import api from './api';

// Description: Get mood tracking history
// Endpoint: GET /api/moods
// Request: {}
// Response: Array<{ id: string, date: Date, mood: number, energy: number, anxiety: number, note?: string, tags: string[] }>
export const getMoodHistory = async () => {
  try {
    const response = await api.get('/api/moods');
    // Convert date strings back to Date objects
    const moods = response.data.map((mood: any) => ({
      ...mood,
      date: new Date(mood.date)
    }));
    return moods;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Save a new mood entry
// Endpoint: POST /api/moods
// Request: { date: Date, mood: number, energy: number, anxiety: number, note?: string, tags: string[] }
// Response: { success: boolean, message: string, mood: object }
export const saveMoodEntry = async (entry: { date: Date, mood: number, energy: number, anxiety: number, note?: string, tags: string[] }) => {
  try {
    const response = await api.post('/api/moods', entry);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Get mood analytics and insights
// Endpoint: GET /api/moods/analytics
// Request: {}
// Response: { averageMood: number, moodTrend: "improving" | "stable" | "declining", weeklyData: Array<{ date: string, mood: number, energy: number, anxiety: number }>, commonTriggers: string[], insights: string[] }
export const getMoodAnalytics = async () => {
  try {
    const response = await api.get('/api/moods/analytics');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Get a single mood entry by ID
// Endpoint: GET /api/moods/:id
// Request: {}
// Response: { id: string, date: Date, mood: number, energy: number, anxiety: number, note?: string, tags: string[] }
export const getMoodEntry = async (id: string) => {
  try {
    const response = await api.get(`/api/moods/${id}`);
    // Convert date string back to Date object
    const mood = {
      ...response.data,
      date: new Date(response.data.date)
    };
    return mood;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Delete a mood entry
// Endpoint: DELETE /api/moods/:id
// Request: {}
// Response: { success: boolean, message: string }
export const deleteMoodEntry = async (id: string) => {
  try {
    const response = await api.delete(`/api/moods/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}