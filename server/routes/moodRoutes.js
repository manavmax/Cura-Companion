const express = require('express');
const router = express.Router();
const MoodService = require('../services/moodService');
const { requireUser } = require('./middleware/auth');
const { detectCrisis } = require('../services/crisisDetection');
const EmergencyContact = require('../models/EmergencyContact');
const { sendSMS, makeCall } = require('../services/twilioService');
const CrisisAlert = require('../models/CrisisAlert');
const CrisisService = require('../services/crisisService');

// Apply authentication middleware to all routes
router.use(requireUser);

// POST /api/moods - Create a new mood entry
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/moods - Creating mood entry for user:', req.user._id);
    
    const { date, mood, energy, anxiety, note, tags } = req.body;
    
    // Validate required fields
    if (!mood || !energy || !anxiety) {
      return res.status(400).json({ 
        error: 'Mood, energy, and anxiety levels are required' 
      });
    }

    // Validate ranges
    if (mood < 1 || mood > 10 || energy < 1 || energy > 10 || anxiety < 1 || anxiety > 10) {
      return res.status(400).json({ 
        error: 'Mood, energy, and anxiety values must be between 1 and 10' 
      });
    }

    const moodData = {
      date: date ? new Date(date) : new Date(),
      mood: parseInt(mood),
      energy: parseInt(energy),
      anxiety: parseInt(anxiety),
      note: note?.trim() || undefined,
      tags: Array.isArray(tags) ? tags.filter(tag => tag?.trim()) : []
    };

    const newMood = await MoodService.create(req.user._id, moodData);
    
    // --- Crisis Detection Logic ---
    const crisisResult = detectCrisis({ 
      mood: newMood.mood, 
      anxiety: newMood.anxiety, 
      note: newMood.note 
    });
    if (crisisResult.crisis) {
      await CrisisService.triggerCrisisAlert(req.user._id, crisisResult.summary, 'mood');
      return res.status(201).json({
        success: true,
        message: 'Mood entry saved. Crisis alert sent.',
        mood: newMood,
        crisisAlertSent: true
      });
    }
    // --- End Crisis Detection ---

    res.status(201).json({
      success: true,
      message: 'Mood entry saved successfully',
      mood: newMood
    });
  } catch (error) {
    console.error('Error creating mood entry:', error);
    res.status(500).json({ 
      error: 'Failed to save mood entry: ' + error.message 
    });
  }
});

// GET /api/moods - Get mood history
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/moods - Fetching mood history for user:', req.user._id);
    
    const limit = parseInt(req.query.limit) || 100;
    const moods = await MoodService.getByUserId(req.user._id, limit);
    
    // Format response to match frontend expectations
    const formattedMoods = moods.map(mood => ({
      id: mood._id.toString(),
      date: mood.date,
      mood: mood.mood,
      energy: mood.energy,
      anxiety: mood.anxiety,
      note: mood.note,
      tags: mood.tags || []
    }));
    
    res.json(formattedMoods);
  } catch (error) {
    console.error('Error fetching mood history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mood history: ' + error.message 
    });
  }
});

// GET /api/moods/analytics - Get mood analytics
router.get('/analytics', async (req, res) => {
  try {
    console.log('GET /api/moods/analytics - Fetching analytics for user:', req.user._id);
    
    const days = parseInt(req.query.days) || 30;
    const analytics = await MoodService.getAnalytics(req.user._id, days);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching mood analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mood analytics: ' + error.message 
    });
  }
});

// GET /api/moods/:id - Get a single mood entry
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/moods/:id - Fetching mood entry:', req.params.id);
    
    const mood = await MoodService.getById(req.params.id, req.user._id);
    
    if (!mood) {
      return res.status(404).json({ 
        error: 'Mood entry not found' 
      });
    }
    
    // Format response to match frontend expectations
    const formattedMood = {
      id: mood._id.toString(),
      date: mood.date,
      mood: mood.mood,
      energy: mood.energy,
      anxiety: mood.anxiety,
      note: mood.note,
      tags: mood.tags || []
    };
    
    res.json(formattedMood);
  } catch (error) {
    console.error('Error fetching mood entry:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mood entry: ' + error.message 
    });
  }
});

// DELETE /api/moods/:id - Delete a mood entry
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/moods/:id - Deleting mood entry:', req.params.id);
    
    const deletedMood = await MoodService.delete(req.params.id, req.user._id);
    
    if (!deletedMood) {
      return res.status(404).json({ 
        error: 'Mood entry not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Mood entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    res.status(500).json({ 
      error: 'Failed to delete mood entry: ' + error.message 
    });
  }
});

// GET /api/moods/ai-insight - Get latest AI insight for the user
router.get('/ai-insight', async (req, res) => {
  try {
    const insight = await MoodService.getLatestAIInsight(req.user._id);
    res.json({ insight });
  } catch (error) {
    console.error('Error fetching AI insight:', error);
    res.status(500).json({ error: 'Failed to fetch AI insight: ' + error.message });
  }
});

module.exports = router;