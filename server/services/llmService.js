const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = 'anthropic/claude-3-sonnet-20240229';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendRequestToOpenRouter(model, messages) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model: model || DEFAULT_MODEL,
          messages: messages,
          max_tokens: 1024,
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      // OpenRouter returns choices like OpenAI
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error(`Error sending request to OpenRouter (attempt ${i + 1}):`, error.message, error.stack);
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY);
    }
  }
}

async function sendLLMRequest(provider, model, messages) {
  // Ignore provider, just use OpenRouter
  return sendRequestToOpenRouter(model, messages);
}

module.exports = {
  sendLLMRequest
};
