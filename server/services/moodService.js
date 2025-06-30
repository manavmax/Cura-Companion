const Mood = require('../models/Mood');
const { sendLLMRequest } = require('./llmService');
const NodeCache = require('node-cache');
const aiInsightCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

class MoodService {
  // Create a new mood entry
  static async createMood(userId, moodData) {
    console.log(`Creating mood entry for user: ${userId}`);
    console.log('Mood data:', moodData);

    try {
      const mood = new Mood({
        userId,
        ...moodData
      });

      const savedMood = await mood.save();
      console.log('Mood entry created:', savedMood._id);

      return savedMood;
    } catch (error) {
      console.error('Error creating mood entry:', error);
      throw new Error('Failed to create mood entry: ' + error.message);
    }
  }

  // Get all mood entries for a user
  static async getMoods(userId, limit = 50, skip = 0) {
    console.log(`Getting moods for user: ${userId}, limit: ${limit}, skip: ${skip}`);

    try {
      const moods = await Mood.find({ userId })
        .sort({ date: -1 })
        .limit(limit)
        .skip(skip);

      console.log(`Found ${moods.length} mood entries for user: ${userId}`);
      return moods;
    } catch (error) {
      console.error('Error getting moods:', error);
      throw new Error('Failed to retrieve moods: ' + error.message);
    }
  }

  // Get a single mood entry by ID
  static async getMood(moodId, userId) {
    console.log(`Getting mood: ${moodId} for user: ${userId}`);

    try {
      const mood = await Mood.findOne({
        _id: moodId,
        userId
      });

      if (!mood) {
        throw new Error('Mood entry not found');
      }

      console.log('Mood entry found:', mood._id);
      return mood;
    } catch (error) {
      console.error('Error getting mood:', error);
      throw new Error('Failed to retrieve mood: ' + error.message);
    }
  }

  // Update a mood entry
  static async updateMood(moodId, userId, updateData) {
    console.log(`Updating mood: ${moodId} for user: ${userId}`);
    console.log('Update data:', updateData);

    try {
      const mood = await Mood.findOneAndUpdate(
        { _id: moodId, userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!mood) {
        throw new Error('Mood entry not found');
      }

      console.log('Mood entry updated:', mood._id);
      return mood;
    } catch (error) {
      console.error('Error updating mood:', error);
      throw new Error('Failed to update mood: ' + error.message);
    }
  }

  // Delete a mood entry
  static async deleteMood(moodId, userId) {
    console.log(`Deleting mood: ${moodId} for user: ${userId}`);

    try {
      const mood = await Mood.findOneAndDelete({
        _id: moodId,
        userId
      });

      if (!mood) {
        throw new Error('Mood entry not found');
      }

      console.log('Mood entry deleted:', mood._id);
      return { success: true, message: 'Mood entry deleted successfully' };
    } catch (error) {
      console.error('Error deleting mood:', error);
      throw new Error('Failed to delete mood: ' + error.message);
    }
  }

  // Get mood analytics for a user
  static async getMoodAnalytics(userId, days = 30) {
    console.log(`Getting mood analytics for user: ${userId}, last ${days} days`);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const moods = await Mood.find({
        userId,
        date: { $gte: startDate }
      }).sort({ date: 1 });

      if (moods.length === 0) {
        return {
          averageMood: null,
          averageEnergy: null,
          averageAnxiety: null,
          totalEntries: 0,
          trends: {
            mood: 'stable',
            energy: 'stable',
            anxiety: 'stable'
          },
          weeklyData: [],
          commonTriggers: [],
          insights: []
        };
      }

      // Calculate averages
      const averageMood = moods.reduce((sum, mood) => sum + (mood.mood || 5), 0) / moods.length;
      const averageEnergy = moods.reduce((sum, mood) => sum + (mood.energy || 5), 0) / moods.length;
      const averageAnxiety = moods.reduce((sum, mood) => sum + (mood.anxiety || 5), 0) / moods.length;

      // Calculate trends (simplified)
      const midpoint = Math.floor(moods.length / 2);
      const firstHalf = moods.slice(0, midpoint);
      const secondHalf = moods.slice(midpoint);

      const calculateTrend = (first, second, property) => {
        if (first.length === 0 || second.length === 0) return 'stable';
        const firstAvg = first.reduce((sum, item) => sum + (item[property] || 5), 0) / first.length;
        const secondAvg = second.reduce((sum, item) => sum + (item[property] || 5), 0) / second.length;
        const diff = secondAvg - firstAvg;
        if (diff > 0.5) return 'improving';
        if (diff < -0.5) return 'declining';
        return 'stable';
      };

      const moodTrend = calculateTrend(firstHalf, secondHalf, 'mood');
      const energyTrend = calculateTrend(firstHalf, secondHalf, 'energy');
      const anxietyTrend = calculateTrend(firstHalf, secondHalf, 'anxiety');

      const analytics = {
        averageMood: Math.round(averageMood * 10) / 10,
        averageEnergy: Math.round(averageEnergy * 10) / 10,
        averageAnxiety: Math.round(averageAnxiety * 10) / 10,
        totalEntries: moods.length,
        trends: {
          mood: moodTrend,
          energy: energyTrend,
          anxiety: anxietyTrend
        },
        moodTrend,
        energyTrend,
        anxietyTrend,
        weeklyData: moods.map(m => ({
          date: m.date,
          mood: m.mood,
          energy: m.energy,
          anxiety: m.anxiety
        })),
        commonTriggers: [],
        insights: []
      };

      // Check cache for AI insight
      const cacheKey = `ai-insight-${userId}`;
      const cachedInsight = aiInsightCache.get(cacheKey);
      if (cachedInsight) {
        analytics.insights = [cachedInsight];
      } else {
        // Trigger AI insight generation in background
        (async () => {
          try {
            const summary = `User mood analytics for the last ${days} days:\n` +
              `Average mood: ${analytics.averageMood}, trend: ${analytics.trends.mood}.\n` +
              `Average energy: ${analytics.averageEnergy}, trend: ${analytics.trends.energy}.\n` +
              `Average anxiety: ${analytics.averageAnxiety}, trend: ${analytics.trends.anxiety}.\n` +
              `Mood entries: ${analytics.totalEntries}.`;
            const aiPrompt = [
              { role: 'system', content: 'You are a mental health assistant. Analyze the user\'s mood data and provide a brief, supportive insight or pattern you notice. Be empathetic and actionable.' },
              { role: 'user', content: summary }
            ];
            const aiInsight = await sendLLMRequest('openrouter', undefined, aiPrompt);
            aiInsightCache.set(cacheKey, aiInsight);
          } catch (e) {
            console.error('AI insight generation failed (background):', e.message);
          }
        })();
      }

      console.log('Mood analytics calculated:', analytics);
      return analytics;
    } catch (error) {
      console.error('Error calculating mood analytics:', error);
      throw new Error('Failed to calculate mood analytics: ' + error.message);
    }
  }

  // New: Fetch latest AI insight for the user
  static async getLatestAIInsight(userId) {
    const cacheKey = `ai-insight-${userId}`;
    const cachedInsight = aiInsightCache.get(cacheKey);
    return cachedInsight || null;
  }
}

// Aliases for compatibility with route calls
MoodService.getByUserId = MoodService.getMoods;
MoodService.getById = MoodService.getMood;
MoodService.getAnalytics = MoodService.getMoodAnalytics;
MoodService.create = MoodService.createMood;
MoodService.delete = MoodService.deleteMood;

module.exports = MoodService;