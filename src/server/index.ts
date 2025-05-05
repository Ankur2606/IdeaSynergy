import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { generateText } from './ai';
import { setupVosk } from './transcription';

// Load environment variables
dotenv.config();

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data structures
interface Room {
  code: string;
  participants: Set<WebSocket>;
  ideas: Idea[];
}

interface Idea {
  id: string;
  transcription: string;
  themes: string[];
  prompts: string[];
  comments: Comment[];
  timestamp: number;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: number;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

// In-memory data store
const rooms = new Map<string, Room>();

// Initialize express app
const app = express();
app.use(cors());
app.use(express.json());

// Configure proper MIME types for JavaScript modules
express.static.mime.define({
  'application/javascript': ['js', 'mjs'],
  'text/javascript': ['js', 'mjs']
});

// Serve static files from the React app build directory
const staticPath = path.resolve(__dirname, '../../');
if (fs.existsSync(path.join(staticPath, 'index.html'))) {
  app.use(express.static(staticPath, {
    setHeaders: (res, path) => {
      // Set proper content type for JavaScript modules
      if (path.endsWith('.js') || path.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
    }
  }));
  console.log(`Serving static files from ${staticPath}`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    roomCount: rooms.size,
    totalParticipants: Array.from(rooms.values())
      .reduce((total, room) => total + room.participants.size, 0)
  });
});

// API route to get room information
app.get('/api/rooms/:roomCode', (req, res) => {
  const room = rooms.get(req.params.roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    code: room.code,
    participants: room.participants.size,
    ideaCount: room.ideas.length
  });
});

// Handle React routing by serving the index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // In development, we might not have the built files
    next();
  }
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Initialize transcription service (now uses client-side Web Speech API)
console.log('Setting up speech recognition...');
setupVosk().catch(err => {
  console.error('Failed to set up speech recognition:', err);
});

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');
  
  let clientRoom: Room | null = null;
  
  // Setup ping/pong to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);

  // Handle incoming messages
  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      
      switch(data.type) {
        case 'join_room': {
          const roomCode = data.room_code;
          
          // Create room if it doesn't exist
          if (!rooms.has(roomCode)) {
            console.log(`Creating new room: ${roomCode}`);
            rooms.set(roomCode, {
              code: roomCode,
              participants: new Set(),
              ideas: [],
            });
          }
          
          clientRoom = rooms.get(roomCode)!;
          clientRoom.participants.add(ws);
          
          // Send existing ideas to new participant
          ws.send(JSON.stringify({
            type: 'ideas_update',
            ideas: clientRoom.ideas
          }));
          
          // Broadcast updated participant count
          broadcastToRoom(clientRoom, {
            type: 'room_update',
            participants: clientRoom.participants.size
          });
          
          console.log(`Client joined room ${roomCode} (${clientRoom.participants.size} participants)`);
          break;
        }
        
        case 'send_transcription': {
          if (!clientRoom) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not in a room'
            }));
            return;
          }
          
          const transcription = data.transcription;
          
          if (!transcription || transcription.trim() === '') {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Empty transcription'
            }));
            return;
          }
          
          console.log('Transcription received:', transcription);
          
          try {
            // Process with AI
            console.log('Analyzing with IBM Granite API...');
            const { themes, prompts } = await generateText(transcription);
            
            // Create new idea
            const idea: Idea = {
              id: uuidv4(),
              transcription,
              themes,
              prompts,
              comments: [],
              timestamp: Date.now()
            };
            
            // Add to room and broadcast
            clientRoom.ideas.push(idea);
            broadcastToRoom(clientRoom, {
              type: 'idea_update',
              idea
            });
            
            console.log('Idea processed and broadcast to room');
          } catch (error) {
            console.error('Error processing idea:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to process idea with AI'
            }));
          }
          
          break;
        }
        
        case 'send_audio': {
          if (!clientRoom) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not in a room'
            }));
            return;
          }
          
          // Send an error message since we no longer support server-side audio processing
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Server-side audio processing is no longer supported. Please upgrade your client to use Web Speech API.'
          }));
          
          break;
        }
        
        case 'add_comment': {
          if (!clientRoom) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not in a room'
            }));
            return;
          }
          
          const { idea_id, comment, author } = data;
          
          // Find the idea
          const idea = clientRoom.ideas.find(i => i.id === idea_id);
          if (!idea) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Idea not found'
            }));
            return;
          }
          
          // Add comment
          const newComment: Comment = {
            id: uuidv4(),
            text: comment,
            author: author || 'Anonymous',
            timestamp: Date.now()
          };
          
          idea.comments.push(newComment);
          
          // Broadcast updated idea
          broadcastToRoom(clientRoom, {
            type: 'idea_update',
            idea
          });
          
          console.log(`Comment added to idea ${idea_id} by ${author}`);
          break;
        }
        
        case 'chat_message': {
          if (!clientRoom) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not in a room'
            }));
            return;
          }
          
          const { message, sender } = data;
          
          // Create chat message
          const chatMessage = {
            id: uuidv4(),
            text: message,
            sender: sender || 'Anonymous',
            timestamp: Date.now()
          };
          
          // Broadcast to room
          broadcastToRoom(clientRoom, {
            type: 'chat_message',
            ...chatMessage
          });
          
          console.log(`Chat message from ${sender}: ${message}`);
          break;
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(pingInterval);
    
    if (clientRoom) {
      clientRoom.participants.delete(ws);
      
      // Broadcast updated participant count
      broadcastToRoom(clientRoom, {
        type: 'room_update',
        participants: clientRoom.participants.size
      });
      
      console.log(`Client left room ${clientRoom.code} (${clientRoom.participants.size} participants remaining)`);
      
      // Clean up empty rooms after some time
      if (clientRoom.participants.size === 0) {
        setTimeout(() => {
          // Double check it's still empty
          if (clientRoom && rooms.has(clientRoom.code) && rooms.get(clientRoom.code)!.participants.size === 0) {
            rooms.delete(clientRoom.code);
            console.log(`Room ${clientRoom.code} removed (empty)`);
          }
        }, 60000); // Keep empty room for 1 minute in case people rejoin
      }
    }
  });
  
  // Handle pong response
  ws.on('pong', () => {
    // Client is still connected
  });
});

// Utility to broadcast to all participants in a room
function broadcastToRoom(room: Room, message: any) {
  const messageStr = JSON.stringify(message);
  room.participants.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Clean up stale connections periodically
setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, 30000);

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │   IdeaSynergy Server Running                        │
  │   http://localhost:${PORT}                           │
  │   WebSocket: ws://localhost:${PORT}/ws               │
  │   Health Check: http://localhost:${PORT}/health      │
  │                                                     │
  └─────────────────────────────────────────────────────┘
  `);
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.terminate();
  });
  
  // Close the HTTP server
  server.close(() => {
    console.log('Server shut down successfully');
    process.exit(0);
  });
});

export default server;