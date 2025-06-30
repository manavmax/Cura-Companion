import api from './api';

// Description: Get dashboard data including mood, stats, and trends
// Endpoint: GET /api/dashboard
// Request: {}
// Response: { todayMood: number, weeklyMoodTrend: number[], recentJournalEntries: number, therapySessionsThisWeek: number, currentStreak: number, quickStats: { totalSessions: number, journalEntries: number, moodCheckins: number } }
export const getDashboardData = async () => {
  try {
    const response = await api.get('/api/dashboard');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}