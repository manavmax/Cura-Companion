import api from './api';

// Description: Analyze user's mental health data for crisis indicators
// Endpoint: POST /api/crisis/detect
// Request: {}
// Response: { userId: string, crisisLevel: string, crisisScore: number, riskFactors: string[], recommendations: { level: string, actions: string[], urgency: string }, analysisDate: string, dataAnalyzed: { moodEntries: number, journalEntries: number, chatSessions: number } }
export const detectCrisis = async () => {
  try {
    const response = await api.post('/api/crisis/detect');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get crisis resources
// Endpoint: GET /api/crisis/resources
// Request: { location?: string, crisisType?: string }
// Response: { location: string, crisisType: string, resources: Array<{ id: string, name: string, type: string, phone: string, website?: string, description: string, availability: string, location: string, specialties: string[] }>, totalCount: number }
export const getCrisisResources = async (location?: string, crisisType?: string) => {
  try {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (crisisType) params.append('crisisType', crisisType);
    
    const response = await api.get(`/api/crisis/resources?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};