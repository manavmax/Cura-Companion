const MoodService = require('./moodService');
const JournalService = require('./journalService');
const ChatService = require('./chatService');
const EmergencyContactService = require('./emergencyContactService');
const UserService = require('./userService');
const { sendSMS, makeCall } = require('./twilioService');
const CrisisAlert = require('../models/CrisisAlert');

class CrisisService {
  // Crisis keywords that indicate potential crisis situations
  static CRISIS_KEYWORDS = [
    'suicide', 'kill myself', 'end it all', 'worthless', 'hopeless',
    'can\'t go on', 'want to die', 'better off dead', 'no point',
    'give up', 'hurt myself', 'self harm', 'cut myself', 'overdose'
  ];

  static HIGH_RISK_KEYWORDS = [
    'depressed', 'anxious', 'panic', 'overwhelmed', 'stressed',
    'lonely', 'isolated', 'sad', 'crying', 'empty', 'numb'
  ];

  /**
   * Analyze user's mental health data and detect crisis level
   */
  static async detectCrisis(userId) {
    console.log(`Analyzing crisis indicators for user: ${userId}`);

    try {
      // Get recent data (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Analyze mood data
      const moodAnalysis = await this.analyzeMoodData(userId, sevenDaysAgo);
      // Analyze journal entries
      const journalAnalysis = await this.analyzeJournalData(userId, sevenDaysAgo);
      // Analyze chat sessions
      const chatAnalysis = await this.analyzeChatData(userId, sevenDaysAgo);

      // Calculate overall crisis score
      const crisisScore = this.calculateCrisisScore(moodAnalysis, journalAnalysis, chatAnalysis);
      // Determine crisis level and recommendations
      const crisisLevel = this.determineCrisisLevel(crisisScore);
      const recommendations = this.getRecommendations(crisisLevel, crisisScore);

      // Map to frontend-expected structure
      const result = {
        riskLevel: crisisLevel,
        riskScore: crisisScore,
        factors: {
          moodTrends: {
            score: moodAnalysis.score,
            trend: moodAnalysis.trend,
            description: `Mood trend is ${moodAnalysis.trend}. Average mood: ${moodAnalysis.averageMood ?? 'N/A'}`
          },
          journalSentiment: {
            score: journalAnalysis.score,
            sentiment: journalAnalysis.crisisKeywords > 0 ? "negative" : "neutral", // TODO: Real sentiment analysis
            description: `Journal contains ${journalAnalysis.crisisKeywords} crisis keywords.`
          },
          behaviorPatterns: {
            score: chatAnalysis.score,
            patterns: chatAnalysis.crisisMessages > 0 ? ["Crisis language detected in chat"] : [], // TODO: Real pattern analysis
            description: chatAnalysis.crisisMessages > 0 ? `Detected ${chatAnalysis.crisisMessages} crisis messages in chat.` : "No crisis patterns detected."
          },
          socialEngagement: {
            score: 0, // TODO: Implement real social engagement analysis
            level: "moderate",
            description: "Social engagement analysis not implemented."
          }
        },
        recommendations: recommendations.actions,
        lastUpdated: new Date().toISOString()
      };

      return result;
    } catch (error) {
      console.error('Error in crisis detection:', error);
      throw new Error('Failed to analyze crisis indicators: ' + error.message);
    }
  }

  /**
   * Analyze mood data for crisis indicators
   */
  static async analyzeMoodData(userId, since) {
    try {
      const moods = await MoodService.getMoodsByDateRange(userId, since, new Date());
      
      if (moods.length === 0) {
        return { score: 0, entryCount: 0, averageMood: null, trend: 'stable' };
      }

      // Calculate average mood (assuming mood is 1-10 scale)
      const moodValues = moods.map(m => m.mood || 5);
      const averageMood = moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length;

      // Detect trend (comparing first half vs second half)
      const midpoint = Math.floor(moodValues.length / 2);
      const firstHalf = moodValues.slice(0, midpoint);
      const secondHalf = moodValues.slice(midpoint);
      
      const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, mood) => sum + mood, 0) / firstHalf.length : averageMood;
      const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, mood) => sum + mood, 0) / secondHalf.length : averageMood;
      
      let trend = 'stable';
      if (secondAvg < firstAvg - 1) trend = 'declining';
      else if (secondAvg > firstAvg + 1) trend = 'improving';

      // Calculate crisis score based on mood data
      let score = 0;
      if (averageMood < 3) score += 30; // Very low mood
      else if (averageMood < 4) score += 20; // Low mood
      else if (averageMood < 5) score += 10; // Below average mood

      if (trend === 'declining') score += 15;

      // Check for concerning notes in mood entries
      const concerningNotes = moods.filter(mood => 
        mood.notes && this.containsCrisisKeywords(mood.notes)
      );
      score += concerningNotes.length * 10;

      return {
        score,
        entryCount: moods.length,
        averageMood,
        trend,
        concerningNotes: concerningNotes.length
      };

    } catch (error) {
      console.error('Error analyzing mood data:', error);
      return { score: 0, entryCount: 0, averageMood: null, trend: 'stable' };
    }
  }

  /**
   * Analyze journal entries for crisis indicators
   */
  static async analyzeJournalData(userId, since) {
    try {
      const journals = await JournalService.getJournalsByDateRange(userId, since, new Date());
      
      if (journals.length === 0) {
        return { score: 0, entryCount: 0, crisisKeywords: 0, riskKeywords: 0 };
      }

      let score = 0;
      let crisisKeywords = 0;
      let riskKeywords = 0;

      journals.forEach(journal => {
        const content = (journal.content || '').toLowerCase();
        
        // Check for crisis keywords
        const crisisMatches = this.CRISIS_KEYWORDS.filter(keyword => 
          content.includes(keyword.toLowerCase())
        );
        crisisKeywords += crisisMatches.length;
        score += crisisMatches.length * 25; // High weight for crisis keywords

        // Check for high-risk keywords
        const riskMatches = this.HIGH_RISK_KEYWORDS.filter(keyword => 
          content.includes(keyword.toLowerCase())
        );
        riskKeywords += riskMatches.length;
        score += riskMatches.length * 5; // Lower weight for risk keywords
      });

      return {
        score,
        entryCount: journals.length,
        crisisKeywords,
        riskKeywords
      };

    } catch (error) {
      console.error('Error analyzing journal data:', error);
      return { score: 0, entryCount: 0, crisisKeywords: 0, riskKeywords: 0 };
    }
  }

  /**
   * Analyze chat sessions for crisis indicators
   */
  static async analyzeChatData(userId, since) {
    try {
      const sessions = await ChatService.getSessionsByDateRange(userId, since, new Date());
      
      if (sessions.length === 0) {
        return { score: 0, sessionCount: 0, crisisMessages: 0 };
      }

      let score = 0;
      let crisisMessages = 0;

      for (const session of sessions) {
        const messages = await ChatService.getSessionMessages(session._id);
        
        messages.forEach(message => {
          if (message.sender === 'user') {
            const content = (message.content || '').toLowerCase();
            
            if (this.containsCrisisKeywords(content)) {
              crisisMessages++;
              score += 20;
            }
          }
        });
      }

      return {
        score,
        sessionCount: sessions.length,
        crisisMessages
      };

    } catch (error) {
      console.error('Error analyzing chat data:', error);
      return { score: 0, sessionCount: 0, crisisMessages: 0 };
    }
  }

  /**
   * Check if text contains crisis keywords
   */
  static containsCrisisKeywords(text) {
    const lowerText = text.toLowerCase();
    return this.CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * Calculate overall crisis score
   */
  static calculateCrisisScore(moodAnalysis, journalAnalysis, chatAnalysis) {
    return moodAnalysis.score + journalAnalysis.score + chatAnalysis.score;
  }

  /**
   * Determine crisis level based on score
   */
  static determineCrisisLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'moderate';
    if (score >= 10) return 'low';
    return 'minimal';
  }

  /**
   * Get recommendations based on crisis level
   */
  static getRecommendations(crisisLevel, crisisScore) {
    const recommendations = {
      critical: [
        'Contact emergency services (911) immediately',
        'Call National Suicide Prevention Lifeline: 988',
        'Go to nearest emergency room',
        'Contact your emergency contacts',
        'Do not be alone - stay with trusted person'
      ],
      high: [
        'Contact mental health professional immediately',
        'Call crisis hotline: 988',
        'Reach out to emergency contacts',
        'Consider going to emergency room',
        'Remove access to means of self-harm'
      ],
      moderate: [
        'Schedule appointment with therapist within 24-48 hours',
        'Contact trusted friend or family member',
        'Use coping strategies and grounding techniques',
        'Consider calling mental health helpline',
        'Increase therapy session frequency'
      ],
      low: [
        'Schedule regular therapy sessions',
        'Practice self-care activities',
        'Maintain social connections',
        'Use mood tracking and journaling',
        'Consider stress management techniques'
      ],
      minimal: [
        'Continue current mental health practices',
        'Maintain regular therapy if applicable',
        'Keep up with mood tracking',
        'Practice preventive self-care',
        'Stay connected with support system'
      ]
    };

    return {
      level: crisisLevel,
      actions: recommendations[crisisLevel] || recommendations.minimal,
      urgency: crisisLevel === 'critical' ? 'immediate' : 
               crisisLevel === 'high' ? 'urgent' : 
               crisisLevel === 'moderate' ? 'soon' : 'routine'
    };
  }

  /**
   * Identify specific risk factors
   */
  static identifyRiskFactors(moodAnalysis, journalAnalysis, chatAnalysis) {
    const factors = [];

    if (moodAnalysis.averageMood && moodAnalysis.averageMood < 3) {
      factors.push('Consistently very low mood');
    }

    if (moodAnalysis.trend === 'declining') {
      factors.push('Declining mood trend');
    }

    if (journalAnalysis.crisisKeywords > 0) {
      factors.push(`Crisis-related language in journal entries (${journalAnalysis.crisisKeywords} instances)`);
    }

    if (chatAnalysis.crisisMessages > 0) {
      factors.push(`Crisis-related messages in therapy sessions (${chatAnalysis.crisisMessages} instances)`);
    }

    if (moodAnalysis.entryCount === 0 && journalAnalysis.entryCount === 0) {
      factors.push('Lack of self-monitoring activity');
    }

    return factors;
  }

  /**
   * Get crisis resources (this could be enhanced to be location-based)
   */
  static async getCrisisResources(location = null, crisisType = null) {
    console.log(`Getting crisis resources for location: ${location}, type: ${crisisType}`);

    // For now, return static crisis resources
    // In a real implementation, this could query a database or external API
    const resources = [
      {
        id: 'crisis-1',
        name: 'National Suicide Prevention Lifeline',
        type: 'crisis_hotline',
        phone: '988',
        website: 'https://suicidepreventionlifeline.org',
        description: '24/7 free and confidential support for people in distress',
        availability: '24/7',
        location: 'National (US)',
        specialties: ['Suicide Prevention', 'Crisis Support', 'Mental Health Emergency']
      },
      {
        id: 'crisis-2',
        name: 'Crisis Text Line',
        type: 'crisis_text',
        phone: 'Text HOME to 741741',
        website: 'https://crisistextline.org',
        description: 'Free, 24/7 support via text message',
        availability: '24/7',
        location: 'National (US)',
        specialties: ['Text Support', 'Crisis Counseling', 'Immediate Help']
      },
      {
        id: 'crisis-3',
        name: 'Emergency Services',
        type: 'emergency',
        phone: '911',
        description: 'Immediate emergency response for life-threatening situations',
        availability: '24/7',
        location: 'Local',
        specialties: ['Medical Emergency', 'Mental Health Crisis', 'Immediate Response']
      },
      {
        id: 'crisis-4',
        name: 'NAMI Helpline',
        type: 'support',
        phone: '1-800-950-6264',
        website: 'https://nami.org',
        description: 'Information and support for mental health concerns',
        availability: 'Mon-Fri 10AM-10PM ET',
        location: 'National (US)',
        specialties: ['Mental Health Information', 'Resource Referrals', 'Family Support']
      }
    ];

    // Filter by crisis type if specified
    let filteredResources = resources;
    if (crisisType) {
      filteredResources = resources.filter(resource => 
        resource.type === crisisType || 
        resource.specialties.some(specialty => 
          specialty.toLowerCase().includes(crisisType.toLowerCase())
        )
      );
    }

    return {
      location: location || 'General',
      crisisType: crisisType || 'All',
      resources: filteredResources,
      totalCount: filteredResources.length
    };
  }

  /**
   * Trigger crisis alert: notify emergency contacts and helplines via SMS/call
   */
  static async triggerCrisisAlert(userId, summary, source = 'unknown') {
    try {
      // 1. Fetch user info
      const user = await UserService.get(userId);
      // 2. Fetch emergency contacts
      const contacts = await EmergencyContactService.getEmergencyContacts(userId);
      // 3. Fetch helplines (US for now, can be location-based)
      const crisisResources = await this.getCrisisResources(user?.location || null);
      const helplines = (crisisResources.resources || []).filter(r => r.phone && r.type === 'crisis_hotline' || r.type === 'emergency');
      // 4. Prepare message
      const userFullName = user?.settings?.profile?.name || 'user';
      const message = `URGENT: Life Threatning Crisis detected for ${userFullName}, he/she is in a life threathning situation please contact as soon as possible. REASON: ${summary} phrase in journal/chat`;
      // 5. Notify emergency contacts
      for (const contact of contacts) {
        if (contact.phone) {
          await sendSMS(contact.phone, message);
          await makeCall(contact.phone);
        }
      }
      // 6. Notify helplines (call only)
      for (const helpline of helplines) {
        if (helpline.phone) {
          await makeCall(helpline.phone);
        }
      }
      // 7. Log the alert
      await CrisisAlert.create({
        userId,
        summary,
        source,
        notifiedContacts: contacts.map(c => c.phone),
        notifiedHelplines: helplines.map(h => h.phone),
        timestamp: new Date()
      });
      console.log('Crisis alert triggered for user', userId);
    } catch (err) {
      console.error('Failed to trigger crisis alert:', err.message);
    }
  }
}

module.exports = CrisisService;