const ChatSession = require('../models/ChatSession');

class ChatService {
  // Create a new chat session
  static async createSession(userId, sessionData = {}) {
    console.log(`Creating chat session for user: ${userId}`);
    console.log('Session data:', sessionData);

    try {
      const session = new ChatSession({
        userId,
        mode: sessionData.mode || 'text',
        status: 'active',
        startedAt: new Date(),
        ...sessionData
      });

      const savedSession = await session.save();
      console.log('Chat session created:', savedSession._id);

      return savedSession;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Failed to create chat session: ' + error.message);
    }
  }

  // Get all chat sessions for a user
  static async getSessions(userId, limit = 50, skip = 0) {
    console.log(`Getting chat sessions for user: ${userId}, limit: ${limit}, skip: ${skip}`);

    try {
      const sessions = await ChatSession.find({ userId })
        .sort({ startedAt: -1 })
        .limit(limit)
        .skip(skip);

      console.log(`Found ${sessions.length} chat sessions for user: ${userId}`);
      return sessions;
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      throw new Error('Failed to retrieve chat sessions: ' + error.message);
    }
  }

  // Get chat sessions by date range
  static async getSessionsByDateRange(userId, startDate, endDate) {
    console.log(`Getting chat sessions for user: ${userId} between ${startDate} and ${endDate}`);

    try {
      const sessions = await ChatSession.find({
        userId,
        startedAt: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ startedAt: -1 });

      console.log(`Found ${sessions.length} chat sessions in date range for user: ${userId}`);
      return sessions;
    } catch (error) {
      console.error('Error getting chat sessions by date range:', error);
      throw new Error('Failed to retrieve chat sessions by date range: ' + error.message);
    }
  }

  // Get a single chat session by ID
  static async getSession(sessionId, userId) {
    console.log(`Getting chat session: ${sessionId} for user: ${userId}`);

    try {
      const session = await ChatSession.findOne({
        _id: sessionId,
        userId
      });

      if (!session) {
        throw new Error('Chat session not found');
      }

      console.log('Chat session found:', session._id);
      return session;
    } catch (error) {
      console.error('Error getting chat session:', error);
      throw new Error('Failed to retrieve chat session: ' + error.message);
    }
  }

  // Get messages from a chat session
  static async getSessionMessages(sessionId) {
    console.log(`Getting messages for chat session: ${sessionId}`);

    try {
      const session = await ChatSession.findById(sessionId);

      if (!session) {
        throw new Error('Chat session not found');
      }

      console.log(`Found ${session.messages.length} messages for session: ${sessionId}`);
      return session.messages;
    } catch (error) {
      console.error('Error getting session messages:', error);
      throw new Error('Failed to retrieve session messages: ' + error.message);
    }
  }

  // Add a message to a chat session
  static async addMessage(sessionId, userId, messageData) {
    console.log(`Adding message to session: ${sessionId} for user: ${userId}`);
    console.log('Message data:', messageData);

    try {
      const session = await ChatSession.findOne({
        _id: sessionId,
        userId
      });

      if (!session) {
        throw new Error('Chat session not found');
      }

      const message = {
        sender: messageData.sender || 'user',
        content: messageData.content,
        timestamp: new Date(),
        type: messageData.type || 'text'
      };

      session.messages.push(message);
      session.lastMessageAt = new Date();

      const updatedSession = await session.save();
      const addedMessage = updatedSession.messages[updatedSession.messages.length - 1];

      console.log('Message added to session:', addedMessage._id);
      return addedMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      throw new Error('Failed to add message: ' + error.message);
    }
  }

  // End a chat session
  static async endSession(sessionId, userId) {
    console.log(`Ending chat session: ${sessionId} for user: ${userId}`);

    try {
      const session = await ChatSession.findOneAndUpdate(
        { _id: sessionId, userId },
        {
          status: 'completed',
          endedAt: new Date()
        },
        { new: true }
      );

      if (!session) {
        throw new Error('Chat session not found');
      }

      console.log('Chat session ended:', session._id);
      return session;
    } catch (error) {
      console.error('Error ending chat session:', error);
      throw new Error('Failed to end chat session: ' + error.message);
    }
  }

  // Update a chat session
  static async updateSession(sessionId, userId, updateData) {
    console.log(`Updating chat session: ${sessionId} for user: ${userId}`);
    console.log('Update data:', updateData);

    try {
      const session = await ChatSession.findOneAndUpdate(
        { _id: sessionId, userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!session) {
        throw new Error('Chat session not found');
      }

      console.log('Chat session updated:', session._id);
      return session;
    } catch (error) {
      console.error('Error updating chat session:', error);
      throw new Error('Failed to update chat session: ' + error.message);
    }
  }

  // Delete a chat session
  static async deleteSession(sessionId, userId) {
    console.log(`Deleting chat session: ${sessionId} for user: ${userId}`);

    try {
      const session = await ChatSession.findOneAndDelete({
        _id: sessionId,
        userId
      });

      if (!session) {
        throw new Error('Chat session not found');
      }

      console.log('Chat session deleted:', session._id);
      return { success: true, message: 'Chat session deleted successfully' };
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw new Error('Failed to delete chat session: ' + error.message);
    }
  }

  // Alias for compatibility with route usage
  static async getSessionById(sessionId, userId) {
    return this.getSession(sessionId, userId);
  }
}

module.exports = ChatService;