import api from './api';

// Description: Get local mental health resources
// Endpoint: GET /api/resources/local
// Request: {}
// Response: Array<{ id: string, name: string, type: string, address?: string, phone: string, website?: string, description: string, rating?: number, hours?: string, distance?: number, specialties: string[], acceptsInsurance: boolean, cost: string }>
export const getLocalResources = (lat?: number, lng?: number) => {
  // Mocking the response, but lat/lng are accepted for future use
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "resource-1",
          name: "Mindful Therapy Center",
          type: "clinic",
          address: "123 Wellness Ave, City, ST 12345",
          phone: "(555) 123-4567",
          website: "https://mindfultherapy.com",
          description: "Comprehensive mental health services with a focus on mindfulness-based therapy and cognitive behavioral therapy.",
          rating: 4.8,
          hours: "Mon-Fri 9AM-7PM, Sat 10AM-4PM",
          distance: 2.3,
          specialties: ["Anxiety", "Depression", "PTSD", "Mindfulness"],
          acceptsInsurance: true,
          cost: "moderate"
        },
        {
          id: "resource-2",
          name: "Dr. Sarah Johnson, LCSW",
          type: "therapist",
          address: "456 Main St, Suite 200, City, ST 12345",
          phone: "(555) 234-5678",
          website: "https://drsarahjohnson.com",
          description: "Licensed clinical social worker specializing in anxiety, depression, and relationship counseling with over 10 years of experience.",
          rating: 4.9,
          hours: "Mon-Thu 10AM-6PM",
          distance: 1.8,
          specialties: ["Anxiety", "Depression", "Relationships", "Trauma"],
          acceptsInsurance: true,
          cost: "high"
        },
        {
          id: "resource-3",
          name: "Community Support Group",
          type: "support_group",
          address: "789 Community Center Dr, City, ST 12345",
          phone: "(555) 345-6789",
          description: "Weekly peer support group for individuals dealing with anxiety and depression. Free and open to all.",
          hours: "Wednesdays 7PM-8:30PM",
          distance: 3.1,
          specialties: ["Peer Support", "Anxiety", "Depression"],
          acceptsInsurance: false,
          cost: "free"
        },
        {
          id: "resource-4",
          name: "Healing Hearts Counseling",
          type: "clinic",
          address: "321 Therapy Lane, City, ST 12345",
          phone: "(555) 456-7890",
          website: "https://healinghearts.org",
          description: "Sliding scale mental health services for individuals and families. Specializing in trauma-informed care.",
          rating: 4.6,
          hours: "Mon-Fri 8AM-8PM, Sat 9AM-5PM",
          distance: 4.2,
          specialties: ["Trauma", "Family Therapy", "EMDR", "CBT"],
          acceptsInsurance: true,
          cost: "low"
        },
        {
          id: "resource-5",
          name: "Dr. Michael Chen, PhD",
          type: "therapist",
          address: "654 Professional Plaza, City, ST 12345",
          phone: "(555) 567-8901",
          website: "https://drmichaelchen.com",
          description: "Clinical psychologist specializing in cognitive behavioral therapy and stress management techniques.",
          rating: 4.7,
          hours: "Tue-Sat 9AM-5PM",
          distance: 2.9,
          specialties: ["CBT", "Stress Management", "Work-Life Balance"],
          acceptsInsurance: true,
          cost: "high"
        }
      ]);
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get(`/api/resources/local?lat=${lat}&lng=${lng}`);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
}

// Description: Get crisis support resources
// Endpoint: GET /api/resources/crisis
// Request: {}
// Response: Array<{ id: string, name: string, type: string, phone: string, website?: string, description: string, specialties: string[], acceptsInsurance: boolean, cost: string }>
export const getCrisisResources = (lat?: number, lng?: number) => {
  const params = [];
  if (lat) params.push(`lat=${lat}`);
  if (lng) params.push(`lng=${lng}`);
  const query = params.length ? `?${params.join('&')}` : '';
  return api.get(`/api/resources/crisis${query}`).then(res => res.data);
}

// Description: Get online mental health resources
// Endpoint: GET /api/resources/online
// Request: {}
// Response: Array<{ id: string, name: string, type: string, phone?: string, website?: string, description: string, specialties: string[], acceptsInsurance: boolean, cost: string }>
export const getOnlineResources = (country?: string) => {
  const query = country ? `?country=${country}` : '';
  return api.get(`/api/resources/online${query}`).then(res => res.data);
}