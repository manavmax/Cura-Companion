const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const SettingsService = require('../services/settingsService.js');

const router = express.Router();

// Get user settings
router.get('/', requireUser, async (req, res) => {
  try {
    console.log(`GET /api/settings - User: ${req.user._id}`);

    const settings = await SettingsService.getUserSettings(req.user._id);

    res.status(200).json(settings);
  } catch (error) {
    console.error(`Error in GET /api/settings: ${error.message}`);
    res.status(400).json({
      error: error.message || 'Failed to fetch user settings'
    });
  }
});

// Update user settings
router.put('/', requireUser, async (req, res) => {
  try {
    console.log(`PUT /api/settings - User: ${req.user._id}`);
    console.log('Settings data:', JSON.stringify(req.body, null, 2));

    const result = await SettingsService.updateUserSettings(req.user._id, req.body);

    res.status(200).json(result);
  } catch (error) {
    console.error(`Error in PUT /api/settings: ${error.message}`);
    res.status(400).json({
      error: error.message || 'Failed to update user settings'
    });
  }
});

// Export user data
router.get('/export', requireUser, async (req, res) => {
  try {
    console.log(`GET /api/settings/export - User: ${req.user._id}`);

    const exportData = await SettingsService.exportUserData(req.user._id);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="cura-data-export-${new Date().toISOString().split('T')[0]}.json"`);

    res.status(200).json(exportData);
  } catch (error) {
    console.error(`Error in GET /api/settings/export: ${error.message}`);
    res.status(500).json({
      error: error.message || 'Failed to export user data'
    });
  }
});

// Delete user account
router.delete('/account', requireUser, async (req, res) => {
  try {
    console.log(`DELETE /api/settings/account - User: ${req.user._id}`);

    const result = await SettingsService.deleteUserAccount(req.user._id);

    res.status(200).json(result);
  } catch (error) {
    console.error(`Error in DELETE /api/settings/account: ${error.message}`);
    res.status(500).json({
      error: error.message || 'Failed to delete user account'
    });
  }
});

module.exports = router;