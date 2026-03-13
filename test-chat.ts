import { io } from 'socket.io-client';
import * as crypto from 'crypto';

const API_KEY = 'your_api_key'; // Replace with real key from DB
const API_SECRET = 'your_api_secret'; // Replace with real secret from DB
const BASE_URL = 'http://localhost:3000/chat';

function generateHmacHeaders() {
  const timestamp = new Date().toISOString();
  const message = `${timestamp}`;
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(message)
    .digest('hex');

  return {
    'x-api-key': API_KEY,
    'x-timestamp': timestamp,
    'x-signature': signature,
  };
}

const socket = io(BASE_URL, {
  extraHeaders: generateHmacHeaders(),
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');

  // Identify yourself
  socket.emit('identify', {}, (response) => {
    console.log('🆔 Identification response:', response);

    // Send a message
    const targetUserId = 'TARGET_USER_ID'; // Replace with real receiver userId
    socket.emit('send_message', {
      receiverId: targetUserId,
      content: 'Hello from verification script!',
    }, (res) => {
        console.log('📨 Message send response:', res);
    });
  });
});

socket.on('receive_message', (data) => {
  console.log('📩 New message received:', data);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});
