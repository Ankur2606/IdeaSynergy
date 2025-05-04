
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MicButton from '../components/MicButton';
import IdeaCard, { Idea } from '../components/IdeaCard';
import ChatPanel from '../components/ChatPanel';
import { useToast } from '@/hooks/use-toast';
import { 
  connectWebSocket, 
  sendMessage, 
  addMessageHandler, 
  removeMessageHandler,
  addStatusHandler,
  removeStatusHandler,
  isConnected
} from '../services/websocket';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
}

const RoomPage = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [participants, setParticipants] = useState<number>(1);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const { toast } = useToast();
  
  // This would be used for actual API interaction
  const WS_URL = 'wss://echo.websocket.org'; // Placeholder WebSocket server
  
  useEffect(() => {
    // Simulate connection to WebSocket server
    const initializeWebSocket = async () => {
      try {
        await connectWebSocket(WS_URL);
        
        // Once connected, join the room
        if (roomCode) {
          sendMessage({ type: 'join_room', room_code: roomCode });
        }
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to server. Please try again.",
          variant: "destructive",
        });
      }
    };

    initializeWebSocket();
    
    // Set up message handler
    const handleWSMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'idea_update') {
          setIdeas(prev => {
            // Check if idea already exists
            const existingIndex = prev.findIndex(idea => idea.id === data.idea.id);
            
            if (existingIndex >= 0) {
              // Update existing idea
              const updatedIdeas = [...prev];
              updatedIdeas[existingIndex] = data.idea;
              return updatedIdeas;
            } else {
              // Add new idea
              return [...prev, data.idea];
            }
          });
        } else if (data.type === 'room_update') {
          setParticipants(data.participants);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    // Set up connection status handler
    const handleConnectionStatus = (isConnected: boolean) => {
      setConnected(isConnected);
      
      if (isConnected) {
        toast({
          title: "Connected",
          description: "You're connected to the brainstorming room",
        });
      } else {
        toast({
          title: "Disconnected",
          description: "Lost connection to the server",
          variant: "destructive",
        });
      }
    };
    
    addMessageHandler(handleWSMessage);
    addStatusHandler(handleConnectionStatus);
    
    // Add some demo data for preview purposes
    const demoData = [
      {
        id: '1',
        transcription: "What if we integrate AI voice assistants into the shopping experience for personalized recommendations?",
        themes: ["AI", "retail", "personalization"],
        prompts: [
          "Consider how this could help people with accessibility needs",
          "How would privacy concerns be addressed?"
        ],
        comments: [
          { id: '1', text: "This reminds me of the system they're testing at Nordstrom", author: "Alex" },
          { id: '2', text: "We could use existing voice recognition APIs to keep costs down", author: "Jamie" }
        ]
      },
      {
        id: '2',
        transcription: "We should create a mobile app that gamifies sustainable commuting choices",
        themes: ["sustainability", "gamification", "mobile"],
        prompts: [
          "What rewards would motivate users?",
          "How could this integrate with city transit systems?"
        ],
        comments: [
          { id: '3', text: "This could partner with local businesses for rewards", author: "Taylor" }
        ]
      }
    ];
    
    setTimeout(() => {
      setIdeas(demoData);
      setParticipants(3);
      
      setMessages([
        { id: '1', text: "Hi everyone! Ready to brainstorm?", sender: "Jamie", timestamp: new Date() },
        { id: '2', text: "Definitely! I've been thinking about AI applications in retail", sender: "Alex", timestamp: new Date() },
        { id: '3', text: "Great idea, let's explore that", sender: "me", timestamp: new Date() },
      ]);
    }, 1000);
    
    // Cleanup function
    return () => {
      removeMessageHandler(handleWSMessage);
      removeStatusHandler(handleConnectionStatus);
    };
  }, [roomCode, toast]);
  
  const handleRecordingComplete = (audioBlob: Blob) => {
    // In a real application, you would upload the audio blob to the server
    console.log('Recording complete, audio blob:', audioBlob);
    
    // Simulate sending audio to server
    if (isConnected()) {
      sendMessage({ type: 'send_audio', audio_data: 'base64_encoded_audio_would_go_here' });
      
      toast({
        title: "Idea Submitted",
        description: "Your idea is being processed",
      });
      
      // Simulate server response with a new idea
      setTimeout(() => {
        const newIdea: Idea = {
          id: Date.now().toString(),
          transcription: "We could develop a blockchain-based platform for verifying product authenticity",
          themes: ["blockchain", "authentication", "supply chain"],
          prompts: [
            "How would this affect luxury goods markets?",
            "Could this help combat counterfeit medication?"
          ],
          comments: []
        };
        
        setIdeas(prev => [...prev, newIdea]);
      }, 2000);
    } else {
      toast({
        title: "Connection Error",
        description: "Not connected to server. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddComment = (ideaId: string, comment: string) => {
    // In a real app, you would send this to the server
    sendMessage({ type: 'add_comment', idea_id: ideaId, comment });
    
    // Update local state
    setIdeas(prev => 
      prev.map(idea => 
        idea.id === ideaId
          ? { 
              ...idea, 
              comments: [
                ...idea.comments, 
                { id: Date.now().toString(), text: comment, author: "me" }
              ]
            }
          : idea
      )
    );
  };
  
  const handleSendChatMessage = (text: string) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      sender: 'me',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // In a real app, you would send this to the server
    sendMessage({ 
      type: 'chat_message', 
      room_code: roomCode,
      message: text 
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <Header roomCode={roomCode} participants={participants} />
      
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <div className="flex-grow p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 flex justify-center">
              <MicButton onRecordingComplete={handleRecordingComplete} />
            </div>
            
            <div className="space-y-6">
              {ideas.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  <p>No ideas yet. Start by recording your first idea!</p>
                </div>
              ) : (
                ideas.map(idea => (
                  <IdeaCard 
                    key={idea.id} 
                    idea={idea} 
                    onAddComment={handleAddComment} 
                  />
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-80 lg:w-96 h-80 md:h-auto flex-shrink-0 border-t md:border-t-0">
          <ChatPanel 
            messages={messages}
            onSendMessage={handleSendChatMessage}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RoomPage;
