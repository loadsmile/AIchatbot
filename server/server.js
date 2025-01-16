require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ['GET', 'POST'],
    credentials: true,
    transports: ['websocket', 'polling']
  },
});

// Configuration
const PORT = process.env.PORT || 10000;
const TRANSLATION_ENDPOINT = 'https://api.cognitive.microsofttranslator.com';
const SUBSCRIPTION_KEY = process.env.AZURE_TRANSLATOR_KEY;
const REGION = process.env.AZURE_TRANSLATOR_REGION;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Knowledge Base
const knowledgeBase = [
  {
    id: '1',
    title: 'Product Returns',
    content: 'Process for handling product returns and refunds',
    solutions: [
      'Please provide your order number',
      'I can help you initiate a return',
      'Let me explain our refund policy'
    ]
  },
  {
    id: '2',
    title: 'Technical Support',
    content: 'Common technical issues and solutions',
    solutions: [
      'Have you tried restarting the device?',
      'Let\'s verify your connection settings',
      'I can guide you through troubleshooting'
    ]
  }
];

async function translateText(text, targetLanguage) {
  try {
    const response = await axios({
      baseURL: TRANSLATION_ENDPOINT,
      url: '/translate',
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        'Ocp-Apim-Subscription-Region': REGION,
        'Content-Type': 'application/json'
      },
      params: {
        'api-version': '3.0',
        'to': targetLanguage
      },
      data: [{
        'text': text
      }]
    });
    return response.data[0].translations[0].text;
  } catch (error) {
    console.error('Translation error:', error.message);
    throw error;
  }
}

async function analyzeMessage(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `As a customer service assistant, analyze this message and provide relevant solutions based on the knowledge base:
    User message: "${text}"
    Knowledge base: ${JSON.stringify(knowledgeBase)}
    Provide 3 short, relevant solutions.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().split('\n').filter(s => s.trim());
  } catch (error) {
    console.error('Analysis error:', error);
    return [];
  }
}

// API endpoints
app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    const suggestions = await analyzeMessage(text);
    res.json({ suggestions });
  } catch (error) {
    console.error('Analysis endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

const rooms = new Map();
const messageHistory = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', ({ room, username, language, role }) => {
    socket.join(room);
    if (!rooms.has(room)) {
      rooms.set(room, new Map());
    }
    rooms.get(room).set(socket.id, { username, language, role });

    if (messageHistory.has(room)) {
      const filteredHistory = messageHistory
        .get(room)
        .filter((msg) => role === 'user' ? msg.type !== 'system' && msg.type !== 'private' : true);
      socket.emit('messageHistory', filteredHistory);
    }

    const joinMessage = {
      username: 'System',
      text: `${username} has joined the chat`,
      timestamp: new Date().toISOString(),
      type: 'system',
    };

    if (!messageHistory.has(room)) {
      messageHistory.set(room, []);
    }
    messageHistory.get(room).push(joinMessage);
    io.to(room).emit('message', joinMessage);
  });

  socket.on('chatMessage', async ({ room, message, language }) => {
    const roomUsers = rooms.get(room);
    const timestamp = new Date().toISOString();

    if (roomUsers) {
      const sender = roomUsers.get(socket.id);

      if (sender.role === 'user') {
        try {
          const suggestions = await analyzeMessage(message);
          for (const [userId, user] of roomUsers) {
            if (user.role === 'agent') {
              io.to(userId).emit('suggestions', suggestions);
            }
          }
        } catch (error) {
          console.error('Analysis error:', error);
        }
      }

      for (const [userId, user] of roomUsers) {
        try {
          let messageToSend;
          if (user.language !== language) {
            const translatedMessage = await translateText(message, user.language);
            messageToSend = {
              username: sender.username,
              text: translatedMessage,
              originalText: message,
              isTranslated: true,
              timestamp,
              type: 'public',
              role: sender.role
            };
          } else {
            messageToSend = {
              username: sender.username,
              text: message,
              originalText: message,
              isTranslated: false,
              timestamp,
              type: 'public',
              role: sender.role
            };
          }

          messageHistory.get(room).push(messageToSend);
          io.to(userId).emit('message', messageToSend);
        } catch (error) {
          console.error(`Translation error for user ${user.username}:`, error);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    for (const [room, users] of rooms) {
      if (users.has(socket.id)) {
        const { username } = users.get(socket.id);
        users.delete(socket.id);
        if (users.size === 0) {
          rooms.delete(room);
          messageHistory.delete(room);
        }
        console.log(`${username} left room ${room}`);
        break;
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server is ready to accept connections`);
});

module.exports = app;
