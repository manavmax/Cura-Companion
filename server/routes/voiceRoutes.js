const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

ffmpeg.setFfmpegPath(ffmpegPath);

const upload = multer({ dest: 'uploads/' });

console.log('voiceRoutes.js loaded at', new Date());

// POST /api/voice/stt
router.post('/stt', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    console.error('[voiceRoutes] No audio file uploaded');
    return res.status(400).json({ error: 'No audio file uploaded' });
  }
  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `${req.file.filename}.wav`);
  try {
    console.log(`[voiceRoutes] Converting ${inputPath} to wav at ${outputPath}`);
    // Convert to wav
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('wav')
        .on('end', resolve)
        .on('error', (err) => {
          console.error('[voiceRoutes] ffmpeg error:', err);
          reject(err);
        })
        .save(outputPath);
    });
    console.log('[voiceRoutes] Conversion complete, sending to ElevenLabs...');
    // Send to ElevenLabs
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(outputPath));
    try {
      const elevenlabsRes = await axios.post(
        'https://api.elevenlabs.io/v1/speech-to-text',
        formData,
        {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            ...formData.getHeaders(),
          },
        }
      );
      console.log('[voiceRoutes] ElevenLabs response:', elevenlabsRes.data);
      // Cleanup
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
      res.json({ text: elevenlabsRes.data.text });
    } catch (err) {
      console.error('[voiceRoutes] ElevenLabs API error:', err?.response?.data || err.message, err.stack);
      fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      res.status(500).json({ error: err?.response?.data || err.message || 'Audio conversion or STT failed' });
    }
  } catch (err) {
    console.error('[voiceRoutes] Conversion or file error:', err.message, err.stack);
    fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    res.status(500).json({ error: err.message || 'Audio conversion or STT failed' });
  }
});

// POST /api/voice/video
router.post('/video', upload.single('video'), async (req, res) => {
  if (!req.file) {
    console.error('[voiceRoutes] No video file uploaded');
    return res.status(400).json({ error: 'No video file uploaded' });
  }
  const inputPath = req.file.path;
  const audioPath = path.join('uploads', `${req.file.filename}.wav`);
  try {
    console.log(`[voiceRoutes] Extracting audio from video ${inputPath} to ${audioPath}`);
    // Extract audio as wav
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec('pcm_s16le')
        .toFormat('wav')
        .on('end', resolve)
        .on('error', (err) => {
          console.error('[voiceRoutes] ffmpeg audio extraction error:', err);
          reject(err);
        })
        .save(audioPath);
    });
    console.log('[voiceRoutes] Audio extraction complete, sending to ElevenLabs...');
    // Send to ElevenLabs
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioPath));
    let transcript;
    try {
      const elevenlabsRes = await axios.post(
        'https://api.elevenlabs.io/v1/speech-to-text',
        formData,
        {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            ...formData.getHeaders(),
          },
        }
      );
      transcript = elevenlabsRes.data.text;
      console.log('[voiceRoutes] ElevenLabs transcript:', transcript);
    } catch (err) {
      console.error('[voiceRoutes] ElevenLabs API error:', err?.response?.data || err.message, err.stack);
      fs.unlinkSync(inputPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      return res.status(500).json({ error: err?.response?.data || err.message || 'Audio extraction or STT failed' });
    }
    // Call AI chat service (assume OpenAI for now)
    let aiReply = '';
    try {
      const openaiRes = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a compassionate mental health companion. Reply to the user in a supportive, empathetic, and helpful way.' },
            { role: 'user', content: transcript }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      aiReply = openaiRes.data.choices[0].message.content;
    } catch (err) {
      console.error('[voiceRoutes] OpenAI API error:', err?.response?.data || err.message, err.stack);
      fs.unlinkSync(inputPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      return res.status(500).json({ error: err?.response?.data || err.message || 'AI reply failed' });
    }
    // Optionally: TTS for reply (reuse ElevenLabs TTS if desired)
    let audioUrl = null;
    const ttsBody = { text: aiReply, model_id: 'eleven_multilingual_v2' };
    const ttsEndpoint = 'https://api.elevenlabs.io/v1/text-to-speech/' + process.env.ELEVENLABS_VOICE_ID;
    const ttsHeaders = {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    };
    console.log('[voiceRoutes] TTS endpoint:', ttsEndpoint);
    console.log('[voiceRoutes] TTS headers:', ttsHeaders);
    console.log('[voiceRoutes] TTS body:', ttsBody);
    console.log('[voiceRoutes] typeof ttsBody:', typeof ttsBody, ttsBody);
    try {
      let ttsRes = await axios.post(
        ttsEndpoint,
        ttsBody,
        {
          headers: ttsHeaders,
          responseType: 'arraybuffer'
        }
      );
      const ttsPath = path.join('uploads', `${req.file.filename}-reply.mp3`);
      fs.writeFileSync(ttsPath, Buffer.from(ttsRes.data));
      audioUrl = `/uploads/${req.file.filename}-reply.mp3`;
    } catch (err) {
      console.error('[voiceRoutes] ElevenLabs TTS error (full):', err?.response?.data || err.message, err.stack);
      // TTS is optional, so don't fail the request
    }
    // Cleanup
    fs.unlinkSync(inputPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    res.json({ text: aiReply, audioUrl });
  } catch (err) {
    console.error('[voiceRoutes] Video processing error:', err.message, err.stack);
    fs.unlinkSync(inputPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    res.status(500).json({ error: err.message || 'Video processing failed' });
  }
});

module.exports = router; 