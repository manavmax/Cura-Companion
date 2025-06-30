const express = require('express');
const router = express.Router();
const voiceRoutes = require('./voiceRoutes');
const resourceRoutes = require('./resourceRoutes');
const MoodService = require('../services/moodService');
const JournalService = require('../services/journalService');
const ChatService = require('../services/chatService');
const { requireUser } = require('./middleware/auth');

// Root path response
router.get("/", (req, res) => {
  res.status(200).send("Welcome to Your Website!");
});

router.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

router.use('/api/voice', voiceRoutes);
router.use('/api/resources', resourceRoutes);

// GET /api/dashboard - Aggregated dashboard data for the logged-in user
router.get('/api/dashboard', requireUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all mood entries (limit 100 for performance)
    const moods = await MoodService.getByUserId(userId, 100);
    // Get all journal entries
    const journals = await JournalService.getEntriesByUserId(userId);
    // Get all chat sessions
    const sessions = await ChatService.getSessions(userId, 100);

    // Today's mood (most recent mood entry)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMoodEntry = moods.find(m => {
      const d = new Date(m.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    const todayMood = todayMoodEntry ? todayMoodEntry.mood : (moods[0]?.mood || 5);

    // Weekly mood trend (last 7 days)
    const weeklyMoodTrend = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const entry = moods.find(m => {
        const d = new Date(m.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === day.getTime();
      });
      weeklyMoodTrend.push(entry ? entry.mood : null);
    }

    // Recent journal entries (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentJournalEntries = journals.filter(j => new Date(j.date) >= sevenDaysAgo).length;

    // Therapy sessions this week (last 7 days)
    const therapySessionsThisWeek = sessions.filter(s => new Date(s.startedAt) >= sevenDaysAgo).length;

    // Current streak (consecutive days with a mood entry)
    let streak = 0;
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    for (let i = 0; i < 100; i++) {
      const entry = moods.find(m => {
        const d = new Date(m.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === date.getTime();
      });
      if (entry) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }

    // Quick stats
    const quickStats = {
      totalSessions: sessions.length,
      journalEntries: journals.length,
      moodCheckins: moods.length
    };

    res.json({
      todayMood,
      weeklyMoodTrend,
      recentJournalEntries,
      therapySessionsThisWeek,
      currentStreak: streak,
      quickStats
    });
  } catch (error) {
    console.error('Error in /api/dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data: ' + error.message });
  }
});

module.exports = router;
