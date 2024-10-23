require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://translator-wine.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 10000;
const TRANSLATION_ENDPOINT = process.env.AZURE_TRANSLATION_ENDPOINT;
const SUBSCRIPTION_KEY = process.env.AZURE_TRANSLATOR_KEY;
const REGION = process.env.AZURE_TRANSLATOR_REGION;

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

async function translateText(text, targetLanguage) {
  console.log(`Attempting to translate: "${text}" to ${targetLanguage}`);
  try {
    const response = await axios({
      baseURL: TRANSLATION_ENDPOINT,
      url: 'translate',
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        'Ocp-Apim-Subscription-Region': REGION,
        'Content-type': 'application/json',
      },
      params: {
        'api-version': '3.0',
        to: targetLanguage,
      },
      data: [{ text }],
      responseType: 'json',
    });

    console.log(
      'Translation API response:',
      JSON.stringify(response.data, null, 2)
    );
    return response.data[0].translations[0].text;
  } catch (error) {
    console.error(
      'Translation API error:',
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

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
    console.log(
      `${username} joined room ${room} with language ${language} and role ${role}`
    );

    if (messageHistory.has(room)) {
      const filteredHistory = messageHistory
        .get(room)
        .filter((msg) =>
          role === 'user'
            ? msg.type !== 'system' && msg.type !== 'private'
            : true
        );
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
    console.log(`Received message in room ${room}: ${message}`);
    const roomUsers = rooms.get(room);
    const timestamp = new Date().toISOString();
    if (roomUsers) {
      for (const [userId, user] of roomUsers) {
        try {
          let messageToSend;
          if (user.language !== language) {
            const translatedMessage = await translateText(
              message,
              user.language
            );
            messageToSend = {
              username: roomUsers.get(socket.id).username,
              text: translatedMessage,
              originalText: message,
              isTranslated: true,
              timestamp,
              type: 'public',
            };
          } else {
            messageToSend = {
              username: roomUsers.get(socket.id).username,
              text: message,
              originalText: message,
              isTranslated: false,
              timestamp,
              type: 'public',
            };
          }

          messageHistory.get(room).push(messageToSend);

          if (user.role !== 'user' || messageToSend.type !== 'system') {
            io.to(userId).emit('message', messageToSend);
          }
        } catch (error) {
          console.error(`Translation error for user ${user.username}:`, error);
          const errorMessage = {
            username: roomUsers.get(socket.id).username,
            text: message,
            originalText: message,
            isTranslated: false,
            error: 'Translation failed: ' + error.message,
            timestamp,
            type: 'public',
          };

          messageHistory.get(room).push(errorMessage);

          if (user.role !== 'user' || errorMessage.type !== 'system') {
            io.to(userId).emit('message', errorMessage);
          }
        }
      }
    } else {
      console.error(`Room ${room} not found`);
    }
  });

  socket.on('privateMessage', async ({ room, message, targetRole }) => {
    const roomUsers = rooms.get(room);
    const timestamp = new Date().toISOString();
    if (roomUsers) {
      const sender = roomUsers.get(socket.id);
      for (const [userId, user] of roomUsers) {
        if (
          (targetRole === 'supervisor' && user.role === 'supervisor') ||
          (targetRole === 'agent' && user.role === 'agent') ||
          userId === socket.id
        ) {
          try {
            let translatedMessage = message;
            if (user.language !== sender.language) {
              translatedMessage = await translateText(message, user.language);
            }
            const privateMessage = {
              username: sender.username,
              text: translatedMessage,
              originalText: message,
              isTranslated: translatedMessage !== message,
              timestamp,
              type: 'private',
              senderRole: sender.role,
              targetRole,
            };

            messageHistory.get(room).push(privateMessage);

            io.to(userId).emit('message', privateMessage);
          } catch (error) {
            console.error(`Translation error for private message:`, error);
            const errorMessage = {
              username: sender.username,
              text: message,
              originalText: message,
              isTranslated: false,
              error: 'Translation failed: ' + error.message,
              timestamp,
              type: 'private',
              senderRole: sender.role,
              targetRole,
            };

            messageHistory.get(room).push(errorMessage);

            io.to(userId).emit('message', errorMessage);
          }
        }
      }
    } else {
      console.error(`Room ${room} not found`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    for (const [room, users] of rooms) {
      if (users.has(socket.id)) {
        const { username, role } = users.get(socket.id);
        users.delete(socket.id);
        if (users.size === 0) {
          rooms.delete(room);
          messageHistory.delete(room);
        } else {
          const leaveMessage = {
            username: 'System',
            text: `${username} has left the chat`,
            timestamp: new Date().toISOString(),
            type: 'system',
          };

          messageHistory.get(room).push(leaveMessage);

          for (const [userId, user] of users) {
            if (user.role !== 'user') {
              io.to(userId).emit('message', leaveMessage);
            }
          }
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
