import api from './api';

interface EmergencyContact {
  _id?: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Description: Get all emergency contacts for the current user
// Endpoint: GET /api/users/{userId}/emergency-contacts
// Request: {}
// Response: { success: boolean, contacts: Array<EmergencyContact>, totalCount: number }
export const getEmergencyContacts = async (userId: string) => {
  try {
    const response = await api.get(`/api/users/${userId}/emergency-contacts`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Create a new emergency contact
// Endpoint: POST /api/users/{userId}/emergency-contacts
// Request: { name: string, relationship: string, phone: string, email?: string, isPrimary?: boolean, notes?: string }
// Response: { success: boolean, message: string, contact: EmergencyContact }
export const createEmergencyContact = async (userId: string, contactData: Omit<EmergencyContact, '_id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const response = await api.post(`/api/users/${userId}/emergency-contacts`, contactData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get a specific emergency contact
// Endpoint: GET /api/users/{userId}/emergency-contacts/{contactId}
// Request: {}
// Response: { success: boolean, contact: EmergencyContact }
export const getEmergencyContact = async (userId: string, contactId: string) => {
  try {
    const response = await api.get(`/api/users/${userId}/emergency-contacts/${contactId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update an emergency contact
// Endpoint: PUT /api/users/{userId}/emergency-contacts/{contactId}
// Request: { name?: string, relationship?: string, phone?: string, email?: string, isPrimary?: boolean, notes?: string }
// Response: { success: boolean, message: string, contact: EmergencyContact }
export const updateEmergencyContact = async (userId: string, contactId: string, updateData: Partial<EmergencyContact>) => {
  try {
    const response = await api.put(`/api/users/${userId}/emergency-contacts/${contactId}`, updateData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Delete an emergency contact
// Endpoint: DELETE /api/users/{userId}/emergency-contacts/{contactId}
// Request: {}
// Response: { success: boolean, message: string }
export const deleteEmergencyContact = async (userId: string, contactId: string) => {
  try {
    const response = await api.delete(`/api/users/${userId}/emergency-contacts/${contactId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Set an emergency contact as primary
// Endpoint: PUT /api/users/{userId}/emergency-contacts/{contactId}/primary
// Request: {}
// Response: { success: boolean, message: string, contact: EmergencyContact }
export const setPrimaryEmergencyContact = async (userId: string, contactId: string) => {
  try {
    const response = await api.put(`/api/users/${userId}/emergency-contacts/${contactId}/primary`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};