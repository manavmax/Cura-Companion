import api from './api';

// Description: Get user settings
// Endpoint: GET /api/settings
// Request: {}
// Response: { profile: { name: string, email: string, timezone: string, language: string }, notifications: { dailyReminders: boolean, moodCheckIns: boolean, journalPrompts: boolean, crisisAlerts: boolean, emailNotifications: boolean, pushNotifications: boolean }, privacy: { dataSharing: boolean, analytics: boolean, crashReports: boolean, locationServices: boolean }, preferences: { theme: string, voiceEnabled: boolean, videoEnabled: boolean, autoSave: boolean, reminderTime: string, sessionLength: number } }
export const getSettings = async () => {
  try {
    const response = await api.get('/api/settings');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Update user settings
// Endpoint: PUT /api/settings
// Request: { profile: object, notifications: object, privacy: object, preferences: object }
// Response: { success: boolean, message: string }
export const updateSettings = async (settings: any) => {
  try {
    const response = await api.put('/api/settings', settings);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Export user data
// Endpoint: GET /api/settings/export
// Request: {}
// Response: { exportDate: string, user: object, moods: array, journals: array, chatSessions: array }
export const exportData = async () => {
  try {
    const response = await api.get('/api/settings/export', {
      responseType: 'blob'
    });
    
    // Create blob and download file
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cura-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'Data exported successfully'
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Delete user account
// Endpoint: DELETE /api/settings/account
// Request: {}
// Response: { success: boolean, message: string }
export const deleteAccount = async () => {
  try {
    const response = await api.delete('/api/settings/account');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}