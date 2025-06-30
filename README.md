```markdown
# CuraCompanion

CuraCompanion is a mobile-first mental health companion app that offers AI-powered therapeutic support through multiple interaction modes. The app features conversational therapy, mood tracking, journaling, and crisis support in a calm, accessible interface. Designed for underserved communities, the app supports offline capabilities and multilingual options, making mental health care more accessible and effective.

## Overview

CuraCompanion is built with a modern technology stack, leveraging both front-end and back-end frameworks to deliver a cohesive, responsive user experience.

### Architecture

The project consists of two main parts: the frontend and backend.

- **Frontend**:
  - Built with **ReactJS** and uses the **Vite** dev server.
  - Integrated with **shadcn-ui** component library and **Tailwind CSS** for styling.
  - Client-side routing managed with `react-router-dom`.
  - Mock data is used for frontend development and interactions with the backend.
  - Runs on **port 5173**.

- **Backend**:
  - Utilizes **Express** for server-side operations with REST API endpoints.
  - **MongoDB** is used for the database, with Mongoose for object data modeling.
  - Implements token-based authentication with JWT.
  - Runs on **port 3000**.

### Project Structure

- **Frontend (client/)**:
  - Components: `client/src/components`
  - Pages: `client/src/pages`
  - API Requests: `client/src/api`
  - Main Configuration Files: `client/package.json`, `client/vite.config.ts`, `client/tailwind.config.js`

- **Backend (server/)**:
  - Routes: `server/routes`
  - Services: `server/services`
  - Models: `server/models`
  - Configuration Files: `server/package.json`, `server/server.js`, `server/config/database.js`

## Features

### User Experience Flow
- **Initial Setup & Onboarding**: Simple registration, language selection, onboarding tour, and optional voice setup.
- **Dashboard**: Mood check-in, quick access to core features, mood trends, and offline indicators.
- **Therapy Modes**:
  - Text-Based: Conversational AI with CBT-informed guidance.
  - Voice Therapy: Real-time speech-to-text and natural AI voice responses.
  - Video Therapy: AI avatar with facial expressions and lip-sync.
- **Mood Tracking**: Color gradient slider for nuanced mood expression, weekly/monthly trends visualization.
- **Journaling System**:
  - Text Journaling: Therapeutic prompts, auto-saving, and search functionality.
  - Voice Journaling: Real-time transcription and recording.
- **Crisis Detection & Emergency Response**: Immediate crisis support, emergency contact calling, and grounding exercises.
- **Local Resources Discovery**: Location-based mental health resource listings.
- **Offline Experience**: Seamless functionality without internet connection.
- **Multilingual Support**: Multiple languages and accents for a natural user experience.

## Getting Started

### Requirements

Ensure the following tools are installed on your machine:
- **Node.js** (version 14 or higher)
- **npm** (Node Package Manager)
- **MongoDB**

### Quickstart

Follow these steps to get the project up and running:

1. **Clone the repository**:
   ```sh
   git clone https://github.com/your-username/CuraCompanion.git
   cd CuraCompanion
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Start the project**:
   ```sh
   npm run start
   ```

   This command will concurrently run both the frontend and backend servers.

### License

The project is proprietary (not open source).

© 2024. All rights reserved.
```

This README.md provides a comprehensive guide to the project, including an overview of the technology stack, key features, setup instructions, and licensing information. This ensures any developer or stakeholder can understand, set up, and contribute to the project effectively.