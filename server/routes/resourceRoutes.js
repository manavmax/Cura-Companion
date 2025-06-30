const express = require('express');
const router = express.Router();
const geolib = require('geolib');
const Resource = require('../models/Resource');
const axios = require('axios');
require('dotenv').config();

// Mock data for demonstration
const mockLocalResources = [
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
  }
  // ... more mock resources ...
];

const mockCrisisResources = [
  {
    id: "crisis-1",
    name: "National Suicide Prevention Lifeline",
    type: "crisis",
    phone: "988",
    website: "https://suicidepreventionlifeline.org",
    description: "24/7 free and confidential support for people in distress, prevention and crisis resources.",
    specialties: ["Suicide Prevention", "Crisis Support", "24/7 Hotline"],
    acceptsInsurance: false,
    cost: "free"
  },
  {
    id: "crisis-2",
    name: "Crisis Text Line",
    type: "crisis",
    phone: "Text HOME to 741741",
    website: "https://crisistextline.org",
    description: "Free, 24/7 support for those in crisis. Text with a trained crisis counselor.",
    specialties: ["Text Support", "Crisis Counseling", "24/7 Support"],
    acceptsInsurance: false,
    cost: "free"
  }
  // ... more mock crisis resources ...
];

const mockOnlineResources = [
  {
    id: "online-1",
    name: "BetterHelp",
    type: "online",
    website: "https://betterhelp.com",
    description: "Online counseling and therapy services with licensed therapists available via text, phone, and video.",
    specialties: ["Online Therapy", "Text Therapy", "Video Sessions"],
    acceptsInsurance: true,
    cost: "moderate"
  },
  {
    id: "online-2",
    name: "Talkspace",
    type: "online",
    website: "https://talkspace.com",
    description: "Online therapy platform connecting you with licensed therapists for convenient, affordable mental health care.",
    specialties: ["Online Therapy", "Messaging Therapy", "Psychiatry"],
    acceptsInsurance: true,
    cost: "moderate"
  }
  // ... more mock online resources ...
];

const countryHelplines = {
  US: [
    { id: 'us-1', name: 'National Suicide Prevention Lifeline', phone: '988', website: 'https://988lifeline.org', description: '24/7 free and confidential support for people in distress.' }
  ],
  IN: [
    { id: 'in-1', name: 'Kiran Mental Health Helpline', phone: '1800-599-0019', website: 'https://mohfw.gov.in', description: '24/7 national mental health helpline.' }
  ],
  GB: [
    { id: 'uk-1', name: 'Samaritans', phone: '116 123', website: 'https://samaritans.org', description: '24/7 helpline for anyone in distress.' }
  ],
  GLOBAL: [
    { id: 'global-1', name: 'Befrienders Worldwide', website: 'https://www.befrienders.org/helplines', description: 'Find a helpline anywhere in the world.' }
  ]
};

// GET /api/resources/local?lat=...&lng=...
router.get('/local', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }
  try {
    const types = [
      'doctor', // covers therapists, psychiatrists
      'hospital', // covers clinics
      'health', // general health
      'pharmacy', // sometimes support groups are listed as health orgs
    ];
    // Search for each type and merge results
    let allResults = [];
    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=20000&type=${type}&keyword=mental+health&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      const response = await axios.get(url);
      if (response.data.results) {
        allResults = allResults.concat(response.data.results);
      }
    }
    // Remove duplicates by place_id
    const uniqueResults = Object.values(
      allResults.reduce((acc, place) => {
        acc[place.place_id] = place;
        return acc;
      }, {})
    );
    // Format results for frontend
    const formatted = uniqueResults.slice(0, 10).map(place => ({
      id: place.place_id,
      name: place.name,
      type: place.types && place.types.includes('doctor') ? 'therapist' : (place.types && place.types.includes('hospital') ? 'clinic' : 'support_group'),
      address: place.vicinity || place.formatted_address,
      phone: '', // Google Places NearbySearch does not return phone, can be fetched with Place Details if needed
      website: '', // Can be fetched with Place Details if needed
      description: place.name,
      rating: place.rating,
      hours: '', // Can be fetched with Place Details if needed
      distance: '', // Can be calculated if needed
      specialties: [],
      acceptsInsurance: false,
      cost: 'moderate',
      location: place.geometry && place.geometry.location ? {
        type: 'Point',
        coordinates: [place.geometry.location.lng, place.geometry.location.lat]
      } : undefined
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching local resources from Google Places:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch local resources from Google Places' });
  }
});

// GET /api/resources/crisis?lat=...&lng=...
router.get('/crisis', async (req, res) => {
  const { lat, lng } = req.query;
  let countryCode = null;
  try {
    if (lat && lng) {
      // Use OpenStreetMap Nominatim for reverse geocoding
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const response = await axios.get(url, { headers: { 'User-Agent': 'CuraCompanion/1.0' } });
      countryCode = response.data.address && response.data.address.country_code ? response.data.address.country_code.toUpperCase() : null;
    }
    let helplines = countryCode && countryHelplines[countryCode] ? countryHelplines[countryCode] : countryHelplines.GLOBAL;
    res.json(helplines);
  } catch (err) {
    console.error('Error fetching crisis resources:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch crisis resources' });
  }
});

// GET /api/resources/online?country=XX
router.get('/online', (req, res) => {
  const { country } = req.query;
  // For demo, just filter by country if present, else return all
  let resources = mockOnlineResources;
  if (country && country.toUpperCase() === 'IN') {
    resources = resources.filter(r => r.name !== 'BetterHelp'); // Example: filter out BetterHelp for India
  }
  res.json(resources);
});

module.exports = router; 