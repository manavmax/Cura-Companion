const Journal = require('../models/Journal');

class JournalService {
  // Get all journal entries for a user
  static async getEntriesByUserId(userId) {
    console.log('Fetching journal entries for user:', userId);

    try {
      const entries = await Journal.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      console.log(`Found ${entries.length} journal entries for user:`, userId);
      return entries;
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  }

  // Create a new journal entry
  static async createEntry(userId, entryData) {
    console.log('Creating journal entry for user:', userId);

    try {
      const entry = new Journal({
        userId,
        title: entryData.title || '',
        content: entryData.content,
        mood: entryData.mood,
        tags: entryData.tags || [],
        type: entryData.type || 'text',
        audioUrl: entryData.audioUrl,
        wordCount: entryData.content ? entryData.content.split(' ').length : 0
      });

      const savedEntry = await entry.save();
      console.log('Journal entry created successfully:', savedEntry._id);
      return savedEntry;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  // Update a journal entry
  static async updateEntry(entryId, userId, updateData) {
    console.log('Updating journal entry:', entryId, 'for user:', userId);

    try {
      const entry = await Journal.findOneAndUpdate(
        { _id: entryId, userId },
        {
          ...updateData,
          wordCount: updateData.content ? updateData.content.split(' ').length : undefined
        },
        { new: true }
      );

      if (!entry) {
        console.log('Journal entry not found for update:', entryId);
        return null;
      }

      console.log('Journal entry updated successfully:', entryId);
      return entry;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  // Delete a journal entry
  static async deleteEntry(entryId, userId) {
    console.log('Deleting journal entry:', entryId, 'for user:', userId);

    try {
      const entry = await Journal.findOneAndDelete({ _id: entryId, userId });

      if (!entry) {
        console.log('Journal entry not found for deletion:', entryId);
        return null;
      }

      console.log('Journal entry deleted successfully:', entryId);
      return entry;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  // Get writing prompts
  static getWritingPrompts() {
    console.log('Fetching writing prompts');

    const prompts = [
      "What am I grateful for today?",
      "What challenged me today and how did I handle it?",
      "Describe a moment when I felt truly happy recently.",
      "What are three things I learned about myself this week?",
      "How did I show kindness to myself or others today?",
      "What emotions did I experience today and why?",
      "What would I tell my younger self about today's experiences?",
      "What are my hopes and dreams for tomorrow?",
      "How did I grow or change today?",
      "What made me smile today?",
      "What was the most meaningful part of my day?",
      "How did I take care of my mental health today?",
      "What patterns do I notice in my thoughts and feelings?",
      "What am I looking forward to?",
      "How can I be more compassionate with myself?"
    ];

    console.log('Returning writing prompts, count:', prompts.length);
    return prompts;
  }

  static async createJournal(userId, journalData) {
    console.log(`Creating journal entry for user: ${userId}`);
    console.log('Journal data:', journalData);

    try {
      const journal = new Journal({
        userId,
        ...journalData,
        wordCount: journalData.content ? journalData.content.split(/\s+/).length : 0
      });

      const savedJournal = await journal.save();
      console.log('Journal entry created:', savedJournal._id);

      return savedJournal;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw new Error('Failed to create journal entry: ' + error.message);
    }
  }

  static async getJournals(userId, limit = 50, skip = 0) {
    console.log(`Getting journals for user: ${userId}, limit: ${limit}, skip: ${skip}`);

    try {
      const journals = await Journal.find({ userId })
        .sort({ date: -1 })
        .limit(limit)
        .skip(skip);

      console.log(`Found ${journals.length} journal entries for user: ${userId}`);
      return journals;
    } catch (error) {
      console.error('Error getting journals:', error);
      throw new Error('Failed to retrieve journals: ' + error.message);
    }
  }

  static async getJournalsByDateRange(userId, startDate, endDate) {
    console.log(`Getting journals for user: ${userId} between ${startDate} and ${endDate}`);

    try {
      const journals = await Journal.find({
        userId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ date: -1 });

      console.log(`Found ${journals.length} journal entries in date range for user: ${userId}`);
      return journals;
    } catch (error) {
      console.error('Error getting journals by date range:', error);
      throw new Error('Failed to retrieve journals by date range: ' + error.message);
    }
  }

  static async getJournal(journalId, userId) {
    console.log(`Getting journal: ${journalId} for user: ${userId}`);

    try {
      const journal = await Journal.findOne({
        _id: journalId,
        userId
      });

      if (!journal) {
        throw new Error('Journal entry not found');
      }

      console.log('Journal entry found:', journal._id);
      return journal;
    } catch (error) {
      console.error('Error getting journal:', error);
      throw new Error('Failed to retrieve journal: ' + error.message);
    }
  }

  static async updateJournal(journalId, userId, updateData) {
    console.log(`Updating journal: ${journalId} for user: ${userId}`);
    console.log('Update data:', updateData);

    try {
      // Update word count if content is being updated
      if (updateData.content) {
        updateData.wordCount = updateData.content.split(/\s+/).length;
      }

      const journal = await Journal.findOneAndUpdate(
        { _id: journalId, userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!journal) {
        throw new Error('Journal entry not found');
      }

      console.log('Journal entry updated:', journal._id);
      return journal;
    } catch (error) {
      console.error('Error updating journal:', error);
      throw new Error('Failed to update journal: ' + error.message);
    }
  }

  static async deleteJournal(journalId, userId) {
    console.log(`Deleting journal: ${journalId} for user: ${userId}`);

    try {
      const journal = await Journal.findOneAndDelete({
        _id: journalId,
        userId
      });

      if (!journal) {
        throw new Error('Journal entry not found');
      }

      console.log('Journal entry deleted:', journal._id);
      return { success: true, message: 'Journal entry deleted successfully' };
    } catch (error) {
      console.error('Error deleting journal:', error);
      throw new Error('Failed to delete journal: ' + error.message);
    }
  }

  static async searchJournals(userId, searchTerm, limit = 20) {
    console.log(`Searching journals for user: ${userId}, term: ${searchTerm}`);

    try {
      const journals = await Journal.find({
        userId,
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      })
        .sort({ date: -1 })
        .limit(limit);

      console.log(`Found ${journals.length} journal entries matching search term`);
      return journals;
    } catch (error) {
      console.error('Error searching journals:', error);
      throw new Error('Failed to search journals: ' + error.message);
    }
  }
}

module.exports = JournalService;