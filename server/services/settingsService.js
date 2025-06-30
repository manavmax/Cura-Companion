const User = require('../models/User.js');
const Mood = require('../models/Mood.js');
const Journal = require('../models/Journal.js');
const ChatSession = require('../models/ChatSession.js');

class SettingsService {
  static async getUserSettings(userId) {
    try {
      console.log(`Fetching settings for user: ${userId}`);
      const user = await User.findById(userId).exec();

      if (!user) {
        throw new Error('User not found');
      }

      // Return settings with user email for profile section
      const settings = {
        profile: {
          name: user.settings?.profile?.name || '',
          email: user.email,
          timezone: user.settings?.profile?.timezone || 'America/New_York',
          language: user.settings?.profile?.language || 'en'
        },
        notifications: user.settings?.notifications || {
          dailyReminders: true,
          moodCheckIns: true,
          journalPrompts: true,
          crisisAlerts: true,
          emailNotifications: false,
          pushNotifications: true
        },
        privacy: user.settings?.privacy || {
          dataSharing: false,
          analytics: true,
          crashReports: true,
          locationServices: true
        },
        preferences: user.settings?.preferences || {
          theme: 'light',
          voiceEnabled: true,
          videoEnabled: true,
          autoSave: true,
          reminderTime: '09:00',
          sessionLength: 30
        }
      };

      console.log(`Successfully fetched settings for user: ${userId}`);
      return settings;
    } catch (error) {
      console.error(`Error fetching user settings: ${error.message}`);
      throw new Error(`Failed to fetch user settings: ${error.message}`);
    }
  }

  static async updateUserSettings(userId, settingsData) {
    try {
      console.log(`Updating settings for user: ${userId}`);

      const user = await User.findById(userId).exec();

      if (!user) {
        throw new Error('User not found');
      }

      // Initialize settings if they don't exist
      if (!user.settings) {
        user.settings = {};
      }

      // Update profile settings (excluding email which should be updated separately)
      if (settingsData.profile) {
        user.settings.profile = {
          ...user.settings.profile,
          name: settingsData.profile.name || user.settings.profile?.name || '',
          timezone: settingsData.profile.timezone || user.settings.profile?.timezone || 'America/New_York',
          language: settingsData.profile.language || user.settings.profile?.language || 'en'
        };

        // Update email separately if provided
        if (settingsData.profile.email && settingsData.profile.email !== user.email) {
          // Check if email is already taken
          const existingUser = await User.findOne({
            email: settingsData.profile.email,
            _id: { $ne: userId }
          }).exec();

          if (existingUser) {
            throw new Error('Email address is already in use');
          }

          user.email = settingsData.profile.email;
        }
      }

      // Update notification settings
      if (settingsData.notifications) {
        user.settings.notifications = {
          ...user.settings.notifications,
          ...settingsData.notifications
        };
      }

      // Update privacy settings
      if (settingsData.privacy) {
        user.settings.privacy = {
          ...user.settings.privacy,
          ...settingsData.privacy
        };
      }

      // Update preference settings
      if (settingsData.preferences) {
        user.settings.preferences = {
          ...user.settings.preferences,
          ...settingsData.preferences
        };
      }

      await user.save();
      console.log(`Successfully updated settings for user: ${userId}`);

      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      console.error(`Error updating user settings: ${error.message}`);
      throw new Error(`Failed to update user settings: ${error.message}`);
    }
  }

  static async exportUserData(userId) {
    try {
      console.log(`Exporting data for user: ${userId}`);

      const user = await User.findById(userId).select('-password -refreshToken').exec();
      if (!user) {
        throw new Error('User not found');
      }

      // Fetch all user data
      const [moods, journals, chatSessions] = await Promise.all([
        Mood.find({ userId }).exec(),
        Journal.find({ userId }).exec(),
        ChatSession.find({ userId }).populate('messages').exec()
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          email: user.email,
          createdAt: user.createdAt,
          settings: user.settings
        },
        moods: moods.map(mood => ({
          date: mood.date,
          mood: mood.mood,
          energy: mood.energy,
          anxiety: mood.anxiety,
          notes: mood.notes,
          tags: mood.tags,
          createdAt: mood.createdAt
        })),
        journals: journals.map(journal => ({
          title: journal.title,
          content: journal.content,
          date: journal.date,
          mood: journal.mood,
          tags: journal.tags,
          type: journal.type,
          wordCount: journal.wordCount,
          createdAt: journal.createdAt
        })),
        chatSessions: chatSessions.map(session => ({
          mode: session.mode,
          status: session.status,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          messageCount: session.messages ? session.messages.length : 0,
          messages: session.messages ? session.messages.map(msg => ({
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp
          })) : []
        }))
      };

      console.log(`Successfully exported data for user: ${userId}`);
      return exportData;
    } catch (error) {
      console.error(`Error exporting user data: ${error.message}`);
      throw new Error(`Failed to export user data: ${error.message}`);
    }
  }

  static async deleteUserAccount(userId) {
    try {
      console.log(`Deleting account for user: ${userId}`);

      const user = await User.findById(userId).exec();
      if (!user) {
        throw new Error('User not found');
      }

      // Delete all user data
      await Promise.all([
        Mood.deleteMany({ userId }),
        Journal.deleteMany({ userId }),
        ChatSession.deleteMany({ userId }),
        User.findByIdAndDelete(userId)
      ]);

      console.log(`Successfully deleted account for user: ${userId}`);
      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      console.error(`Error deleting user account: ${error.message}`);
      throw new Error(`Failed to delete user account: ${error.message}`);
    }
  }
}

module.exports = SettingsService;