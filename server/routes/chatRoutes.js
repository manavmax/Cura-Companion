const express = require('express');
const router = express.Router();
const ChatService = require('../services/chatService');
const { requireUser } = require('./middleware/auth');
const { detectCrisis } = require('../services/crisisDetection');
const CrisisService = require('../services/crisisService');

// Apply authentication middleware to all routes
router.use(requireUser);

// POST /api/chat-sessions - Create a new chat session
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/chat-sessions - Creating chat session for user:', req.user._id);

    const { mode, sessionType } = req.body;

    // Validate mode
    if (mode && !['text', 'voice', 'video'].includes(mode)) {
      return res.status(400).json({
        error: 'Mode must be one of: text, voice, video'
      });
    }

    // Validate session type
    if (sessionType && !['therapy', 'crisis', 'general'].includes(sessionType)) {
      return res.status(400).json({
        error: 'Session type must be one of: therapy, crisis, general'
      });
    }

    const sessionData = {
      mode: mode || 'text',
      sessionType: sessionType || 'therapy'
    };

    const newSession = await ChatService.createSession(req.user._id, sessionData);

    res.status(201).json({
      success: true,
      message: 'Chat session created successfully',
      session: {
        id: newSession._id.toString(),
        mode: newSession.mode,
        status: newSession.status,
        sessionType: newSession.sessionType,
        startedAt: newSession.startedAt,
        messages: newSession.messages
      }
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      error: 'Failed to create chat session: ' + error.message
    });
  }
});

// GET /api/chat-sessions - Get all chat sessions for user
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/chat-sessions - Fetching chat sessions for user:', req.user._id);

    const limit = parseInt(req.query.limit) || 50;
    const sessions = await ChatService.getSessions(req.user._id, limit);

    // Format response to match frontend expectations
    const formattedSessions = sessions.map(session => ({
      id: session._id.toString(),
      mode: session.mode,
      status: session.status,
      sessionType: session.sessionType,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.duration,
      messageCount: session.messages ? session.messages.length : 0
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch chat sessions: ' + error.message
    });
  }
});

// GET /api/chat-sessions/:id - Get a single chat session
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/chat-sessions/:id - Fetching chat session:', req.params.id);

    const session = await ChatService.getSessionById(req.params.id, req.user._id);

    if (!session) {
      return res.status(404).json({
        error: 'Chat session not found'
      });
    }

    // Format response to match frontend expectations
    const formattedSession = {
      id: session._id.toString(),
      mode: session.mode,
      status: session.status,
      sessionType: session.sessionType,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.duration,
      messages: session.messages.map(msg => ({
        id: msg._id.toString(),
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp,
        type: msg.type
      }))
    };

    res.json(formattedSession);
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({
      error: 'Failed to fetch chat session: ' + error.message
    });
  }
});

// POST /api/chat-sessions/:id/end - End a chat session
router.post('/:id/end', async (req, res) => {
  try {
    console.log('POST /api/chat-sessions/:id/end - Ending chat session:', req.params.id);

    const endedSession = await ChatService.endSession(req.params.id, req.user._id);

    if (!endedSession) {
      return res.status(404).json({
        error: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      message: 'Chat session ended successfully',
      session: {
        id: endedSession._id.toString(),
        status: endedSession.status,
        endedAt: endedSession.endedAt,
        duration: endedSession.duration
      }
    });
  } catch (error) {
    console.error('Error ending chat session:', error);
    res.status(500).json({
      error: 'Failed to end chat session: ' + error.message
    });
  }
});

// POST /api/chat-sessions/:id/messages - Add a message to a chat session
router.post('/:id/messages', async (req, res) => {
  try {
    console.log('POST /api/chat-sessions/:id/messages - Adding message to session:', req.params.id);

    const { content, sender, type } = req.body;

    if (!content || !sender) {
      return res.status(400).json({
        error: 'Content and sender are required'
      });
    }

    if (!['user', 'ai'].includes(sender)) {
      return res.status(400).json({
        error: 'Sender must be either "user" or "ai"'
      });
    }

    const messageData = {
      content: content.trim(),
      sender,
      type: type || 'text'
    };

    const updatedSession = await ChatService.addMessage(req.params.id, req.user._id, messageData);

    if (!updatedSession) {
      return res.status(404).json({
        error: 'Chat session not found'
      });
    }

    const addedMessage = updatedSession.messages[updatedSession.messages.length - 1];

    // --- Crisis Detection Logic ---
    const crisisResult = detectCrisis({ content: addedMessage.content });
    if (crisisResult.crisis) {
      await CrisisService.triggerCrisisAlert(req.user._id, crisisResult.summary, 'chat');
      return res.status(201).json({
        success: true,
        message: 'Message added. Crisis alert sent.',
        messageData: {
          id: addedMessage._id.toString(),
          content: addedMessage.content,
          sender: addedMessage.sender,
          timestamp: addedMessage.timestamp,
          type: addedMessage.type
        },
        crisisAlertSent: true
      });
    }
    // --- End Crisis Detection ---

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      messageData: {
        id: addedMessage._id.toString(),
        content: addedMessage.content,
        sender: addedMessage.sender,
        timestamp: addedMessage.timestamp,
        type: addedMessage.type
      }
    });
  } catch (error) {
    console.error('Error adding message to session:', error);
    res.status(500).json({
      error: 'Failed to add message: ' + error.message
    });
  }
});

// GET /api/chat-sessions/:id/messages - Get messages from a chat session
router.get('/:id/messages', async (req, res) => {
  try {
    console.log('GET /api/chat-sessions/:id/messages - Fetching messages for session:', req.params.id);

    const messages = await ChatService.getSessionMessages(req.params.id, req.user._id);

    if (messages === null) {
      return res.status(404).json({
        error: 'Chat session not found'
      });
    }

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp,
      type: msg.type
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching session messages:', error);
    res.status(500).json({
      error: 'Failed to fetch messages: ' + error.message
    });
  }
});

// POST /api/chat-sessions/:id/ai-message - Add a user message and get AI response
router.post('/:id/ai-message', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Add user message to session
    const userMessage = {
      content: content.trim(),
      sender: 'user',
      type: 'text'
    };
    await ChatService.addMessage(req.params.id, req.user._id, userMessage);

    // --- Crisis Detection Logic (AI endpoint) ---
    const crisisResult = detectCrisis({ content: userMessage.content });
    if (crisisResult.crisis) {
      await CrisisService.triggerCrisisAlert(req.user._id, crisisResult.summary, 'chat');
      return res.json({
        content: aiContent,
        isCrisis,
        crisisAlertSent: true
      });
    }
    // --- End Crisis Detection ---

    // Get session history for context
    const session = await ChatService.getSession(req.params.id, req.user._id);
    const history = session.messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Call Claude Sonnet 3.5 via OpenRouter (default)
    const { sendLLMRequest } = require('../services/llmService');
    const aiContent = await sendLLMRequest('openrouter', 'anthropic/claude-3-sonnet-20240229', history);

    // Add AI message to session
    const isCrisis = CrisisService.containsCrisisKeywords(aiContent);
    const aiMessage = {
      content: aiContent,
      sender: 'ai',
      type: isCrisis ? 'crisis' : 'text'
    };
    await ChatService.addMessage(req.params.id, req.user._id, aiMessage);

    res.json({
      content: aiContent,
      isCrisis
    });
  } catch (error) {
    console.error('Error in AI message endpoint:', error);
    res.status(500).json({ error: 'Failed to get AI response: ' + error.message });
  }
});

module.exports = router;