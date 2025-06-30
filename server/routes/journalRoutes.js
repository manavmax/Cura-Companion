const express = require('express');
const router = express.Router();
const JournalService = require('../services/journalService');
const { requireUser } = require('./middleware/auth');
const { detectCrisis } = require('../services/crisisDetection');
const CrisisService = require('../services/crisisService');

console.log('=== JOURNAL ROUTES SETUP ===');
console.log('Auth middleware loaded:', typeof requireUser);

// Apply authentication middleware to all routes
router.use((req, res, next) => {
  console.log('=== JOURNAL ROUTE MIDDLEWARE ===');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Applying auth middleware...');
  requireUser(req, res, next);
});

// GET /api/journal-entries - Get all journal entries for the user
router.get('/', async (req, res) => {
  console.log('=== JOURNAL GET ROUTE HANDLER ===');
  console.log('User from req.user:', req.user ? req.user.email : 'No user');
  
  try {
    const entries = await JournalService.getEntriesByUserId(req.user._id);
    console.log('Found entries count:', entries.length);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({
      error: 'Failed to fetch journal entries: ' + error.message
    });
  }
});

// GET /api/journal-entries/prompts - Get writing prompts
router.get('/prompts', async (req, res) => {
  console.log('=== JOURNAL PROMPTS ROUTE HANDLER ===');
  console.log('User from req.user:', req.user ? req.user.email : 'No user');
  
  try {
    const prompts = JournalService.getWritingPrompts();
    console.log('Returning prompts count:', prompts.length);
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching writing prompts:', error);
    res.status(500).json({
      error: 'Failed to fetch writing prompts: ' + error.message
    });
  }
});

// POST /api/journal-entries - Create a new journal entry
router.post('/', async (req, res) => {
  console.log('=== JOURNAL POST ROUTE HANDLER ===');
  console.log('User from req.user:', req.user ? req.user.email : 'No user');
  
  try {
    const { title, content, mood, tags, type, audioUrl } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Content is required'
      });
    }

    const entryData = {
      title: title || '',
      content,
      mood,
      tags: tags || [],
      type: type || 'text',
      audioUrl
    };

    const newEntry = await JournalService.createEntry(req.user._id, entryData);
    console.log('Created new entry with ID:', newEntry._id);

    // --- Crisis Detection Logic ---
    console.log('Checking for crisis in journal entry:', newEntry.content);
    const crisisResult = detectCrisis({ content: newEntry.content });
    console.log('Crisis detection result:', crisisResult);
    if (crisisResult.crisis) {
      await CrisisService.triggerCrisisAlert(req.user._id, crisisResult.summary, 'journal');
      return res.status(201).json({
        success: true,
        message: 'Journal entry created. Crisis alert sent.',
        entry: newEntry,
        crisisAlertSent: true
      });
    }
    // --- End Crisis Detection ---

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      entry: newEntry
    });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({
      error: 'Failed to create journal entry: ' + error.message
    });
  }
});

// DELETE /api/journal-entries/:id - Delete a journal entry
router.delete('/:id', async (req, res) => {
  console.log('=== JOURNAL DELETE ROUTE HANDLER ===');
  console.log('User from req.user:', req.user ? req.user.email : 'No user');
  console.log('Entry ID to delete:', req.params.id);
  
  try {
    const deletedEntry = await JournalService.deleteEntry(req.params.id, req.user._id);

    if (!deletedEntry) {
      return res.status(404).json({
        error: 'Journal entry not found'
      });
    }

    console.log('Deleted entry with ID:', deletedEntry._id);
    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({
      error: 'Failed to delete journal entry: ' + error.message
    });
  }
});

console.log('=== JOURNAL ROUTES CONFIGURED ===');

module.exports = router;