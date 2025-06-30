const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const CrisisService = require('../services/crisisService.js');

const router = express.Router();

// POST /api/crisis/detect - Analyze user's mental health data for crisis indicators
router.post('/detect', requireUser, async (req, res) => {
  try {
    console.log(`POST /api/crisis/detect - User: ${req.user._id}`);

    const crisisAnalysis = await CrisisService.detectCrisis(req.user._id);

    res.status(200).json(crisisAnalysis);
  } catch (error) {
    console.error(`Error in POST /api/crisis/detect: ${error.message}`);
    res.status(500).json({
      error: error.message || 'Failed to analyze crisis indicators'
    });
  }
});

// GET /api/crisis/resources - Get crisis resources
router.get('/resources', async (req, res) => {
  try {
    console.log('GET /api/crisis/resources');
    console.log('Query params:', req.query);

    const { location, crisisType } = req.query;
    
    const resources = await CrisisService.getCrisisResources(location, crisisType);

    res.status(200).json(resources);
  } catch (error) {
    console.error(`Error in GET /api/crisis/resources: ${error.message}`);
    res.status(500).json({
      error: error.message || 'Failed to retrieve crisis resources'
    });
  }
});

module.exports = router;