const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const EmergencyContactService = require('../services/emergencyContactService.js');

const router = express.Router();

// GET /api/users/:userId/emergency-contacts - Get all emergency contacts for a user
router.get('/users/:userId/emergency-contacts', requireUser, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`GET /api/users/${userId}/emergency-contacts - Requesting user: ${req.user._id}`);

    // Ensure user can only access their own emergency contacts
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied: You can only view your own emergency contacts'
      });
    }

    const contacts = await EmergencyContactService.getEmergencyContacts(userId);

    res.status(200).json({
      success: true,
      contacts,
      totalCount: contacts.length
    });
  } catch (error) {
    console.error(`Error in GET /api/users/:userId/emergency-contacts: ${error.message}`);
    res.status(500).json({
      error: error.message || 'Failed to retrieve emergency contacts'
    });
  }
});

// POST /api/users/:userId/emergency-contacts - Create a new emergency contact
router.post('/users/:userId/emergency-contacts', requireUser, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`POST /api/users/${userId}/emergency-contacts - Requesting user: ${req.user._id}`);
    console.log('Contact data:', req.body);

    // Ensure user can only create emergency contacts for themselves
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied: You can only create emergency contacts for yourself'
      });
    }

    const { name, relationship, phone, email, isPrimary, notes } = req.body;

    if (!name || !relationship || !phone) {
      return res.status(400).json({
        error: 'Name, relationship, and phone are required fields'
      });
    }

    const contact = await EmergencyContactService.createEmergencyContact(userId, {
      name,
      relationship,
      phone,
      email,
      isPrimary: isPrimary || false,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Emergency contact created successfully',
      contact
    });
  } catch (error) {
    console.error(`Error in POST /api/users/:userId/emergency-contacts: ${error.message}`);
    res.status(400).json({
      error: error.message || 'Failed to create emergency contact'
    });
  }
});

// GET /api/users/:userId/emergency-contacts/:contactId - Get a specific emergency contact
router.get('/users/:userId/emergency-contacts/:contactId', requireUser, async (req, res) => {
  try {
    const { userId, contactId } = req.params;
    console.log(`GET /api/users/${userId}/emergency-contacts/${contactId} - Requesting user: ${req.user._id}`);

    // Ensure user can only access their own emergency contacts
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied: You can only view your own emergency contacts'
      });
    }

    const contact = await EmergencyContactService.getEmergencyContact(contactId, userId);

    res.status(200).json({
      success: true,
      contact
    });
  } catch (error) {
    console.error(`Error in GET /api/users/:userId/emergency-contacts/:contactId: ${error.message}`);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to retrieve emergency contact'
    });
  }
});

// PUT /api/users/:userId/emergency-contacts/:contactId - Update an emergency contact
router.put('/users/:userId/emergency-contacts/:contactId', requireUser, async (req, res) => {
  try {
    const { userId, contactId } = req.params;
    console.log(`PUT /api/users/${userId}/emergency-contacts/${contactId} - Requesting user: ${req.user._id}`);
    console.log('Update data:', req.body);

    // Ensure user can only update their own emergency contacts
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied: You can only update your own emergency contacts'
      });
    }

    const contact = await EmergencyContactService.updateEmergencyContact(contactId, userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Emergency contact updated successfully',
      contact
    });
  } catch (error) {
    console.error(`Error in PUT /api/users/:userId/emergency-contacts/:contactId: ${error.message}`);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      error: error.message || 'Failed to update emergency contact'
    });
  }
});

// DELETE /api/users/:userId/emergency-contacts/:contactId - Delete an emergency contact
router.delete('/users/:userId/emergency-contacts/:contactId', requireUser, async (req, res) => {
  try {
    const { userId, contactId } = req.params;
    console.log(`DELETE /api/users/${userId}/emergency-contacts/${contactId} - Requesting user: ${req.user._id}`);

    // Ensure user can only delete their own emergency contacts
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied: You can only delete your own emergency contacts'
      });
    }

    const result = await EmergencyContactService.deleteEmergencyContact(contactId, userId);

    res.status(200).json(result);
  } catch (error) {
    console.error(`Error in DELETE /api/users/:userId/emergency-contacts/:contactId: ${error.message}`);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to delete emergency contact'
    });
  }
});

// PUT /api/users/:userId/emergency-contacts/:contactId/primary - Set contact as primary
router.put('/users/:userId/emergency-contacts/:contactId/primary', requireUser, async (req, res) => {
  try {
    const { userId, contactId } = req.params;
    console.log(`PUT /api/users/${userId}/emergency-contacts/${contactId}/primary - Requesting user: ${req.user._id}`);

    // Ensure user can only update their own emergency contacts
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied: You can only update your own emergency contacts'
      });
    }

    const contact = await EmergencyContactService.setPrimaryContact(contactId, userId);

    res.status(200).json({
      success: true,
      message: 'Primary contact updated successfully',
      contact
    });
  } catch (error) {
    console.error(`Error in PUT /api/users/:userId/emergency-contacts/:contactId/primary: ${error.message}`);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to set primary contact'
    });
  }
});

module.exports = router;