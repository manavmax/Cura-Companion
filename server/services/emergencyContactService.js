const EmergencyContact = require('../models/EmergencyContact');

class EmergencyContactService {
  /**
   * Create a new emergency contact
   */
  static async createEmergencyContact(userId, contactData) {
    console.log(`Creating emergency contact for user: ${userId}`);
    console.log('Contact data:', contactData);

    try {
      const contact = new EmergencyContact({
        userId,
        ...contactData
      });

      const savedContact = await contact.save();
      console.log('Emergency contact created:', savedContact._id);
      
      return savedContact;
    } catch (error) {
      console.error('Error creating emergency contact:', error);
      throw new Error('Failed to create emergency contact: ' + error.message);
    }
  }

  /**
   * Get all emergency contacts for a user
   */
  static async getEmergencyContacts(userId) {
    console.log(`Getting emergency contacts for user: ${userId}`);

    try {
      const contacts = await EmergencyContact.find({ userId })
        .sort({ isPrimary: -1, createdAt: 1 }); // Primary contacts first, then by creation date

      console.log(`Found ${contacts.length} emergency contacts for user: ${userId}`);
      return contacts;
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      throw new Error('Failed to retrieve emergency contacts: ' + error.message);
    }
  }

  /**
   * Get a single emergency contact by ID
   */
  static async getEmergencyContact(contactId, userId) {
    console.log(`Getting emergency contact: ${contactId} for user: ${userId}`);

    try {
      const contact = await EmergencyContact.findOne({ 
        _id: contactId, 
        userId 
      });

      if (!contact) {
        throw new Error('Emergency contact not found');
      }

      console.log('Emergency contact found:', contact._id);
      return contact;
    } catch (error) {
      console.error('Error getting emergency contact:', error);
      throw new Error('Failed to retrieve emergency contact: ' + error.message);
    }
  }

  /**
   * Update an emergency contact
   */
  static async updateEmergencyContact(contactId, userId, updateData) {
    console.log(`Updating emergency contact: ${contactId} for user: ${userId}`);
    console.log('Update data:', updateData);

    try {
      const contact = await EmergencyContact.findOneAndUpdate(
        { _id: contactId, userId },
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!contact) {
        throw new Error('Emergency contact not found');
      }

      console.log('Emergency contact updated:', contact._id);
      return contact;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      throw new Error('Failed to update emergency contact: ' + error.message);
    }
  }

  /**
   * Delete an emergency contact
   */
  static async deleteEmergencyContact(contactId, userId) {
    console.log(`Deleting emergency contact: ${contactId} for user: ${userId}`);

    try {
      const contact = await EmergencyContact.findOneAndDelete({ 
        _id: contactId, 
        userId 
      });

      if (!contact) {
        throw new Error('Emergency contact not found');
      }

      console.log('Emergency contact deleted:', contact._id);
      return { success: true, message: 'Emergency contact deleted successfully' };
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      throw new Error('Failed to delete emergency contact: ' + error.message);
    }
  }

  /**
   * Get primary emergency contact for a user
   */
  static async getPrimaryEmergencyContact(userId) {
    console.log(`Getting primary emergency contact for user: ${userId}`);

    try {
      const contact = await EmergencyContact.findOne({ 
        userId, 
        isPrimary: true 
      });

      if (contact) {
        console.log('Primary emergency contact found:', contact._id);
      } else {
        console.log('No primary emergency contact found for user:', userId);
      }

      return contact;
    } catch (error) {
      console.error('Error getting primary emergency contact:', error);
      throw new Error('Failed to retrieve primary emergency contact: ' + error.message);
    }
  }

  /**
   * Set a contact as primary (and unset others)
   */
  static async setPrimaryContact(contactId, userId) {
    console.log(`Setting primary contact: ${contactId} for user: ${userId}`);

    try {
      // First, unset all primary contacts for this user
      await EmergencyContact.updateMany(
        { userId },
        { isPrimary: false }
      );

      // Then set the specified contact as primary
      const contact = await EmergencyContact.findOneAndUpdate(
        { _id: contactId, userId },
        { isPrimary: true, updatedAt: new Date() },
        { new: true }
      );

      if (!contact) {
        throw new Error('Emergency contact not found');
      }

      console.log('Primary contact set:', contact._id);
      return contact;
    } catch (error) {
      console.error('Error setting primary contact:', error);
      throw new Error('Failed to set primary contact: ' + error.message);
    }
  }
}

module.exports = EmergencyContactService;