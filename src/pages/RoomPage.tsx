import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MicButton from '../components/MicButton';
import IdeaCard, { Idea } from '../components/IdeaCard';
import ChatPanel from '../components/ChatPanel';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
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

// Generate a random username for this session
const username = `User_${Math.floor(Math.random() * 1000)}`;

const RoomPage = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [participants, setParticipants] = useState<number>(1);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialize WebSocket connection
    const initializeWebSocket = async () => {
      try {
        await connectWebSocket(); // Uses the environment variable URL
        
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
        
        switch(data.type) {
          case 'idea_update':
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
            break;
            
          case 'ideas_update':
            // Batch update of all ideas in the room
            setIdeas(data.ideas);
            break;
            
          case 'room_update':
            setParticipants(data.participants);
            break;
            
          case 'chat_message':
            // New chat message from another user
            setMessages(prev => [...prev, {
              id: data.id,
              text: data.text,
              sender: data.sender,
              timestamp: new Date(data.timestamp)
            }]);
            break;
            
          case 'error':
            console.error('Error from server:', data.message);
            toast({
              title: "Error",
              description: data.message,
              variant: "destructive",
            });
            break;
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
          description: "Lost connection to the server. Reconnecting...",
          variant: "destructive",
        });
      }
    };
    
    addMessageHandler(handleWSMessage);
    addStatusHandler(handleConnectionStatus);
    
    // Cleanup function
    return () => {
      removeMessageHandler(handleWSMessage);
      removeStatusHandler(handleConnectionStatus);
    };
  }, [roomCode, toast]);
  
  // Updated to handle direct transcription instead of audio blobs
  const handleRecordingComplete = (transcription: string) => {
    if (isConnected()) {
      // Send transcription directly to server
      sendMessage({ 
        type: 'send_transcription', 
        transcription: transcription 
      });
      
      toast({
        title: "Processing",
        description: "Your idea is being analyzed",
      });
    } else {
      toast({
        title: "Connection Error",
        description: "Not connected to server. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddComment = (ideaId: string, comment: string) => {
    if (!comment.trim()) return;
    
    // Send comment to server
    sendMessage({ 
      type: 'add_comment', 
      idea_id: ideaId, 
      comment,
      author: username
    });
  };
  
  const handleSendChatMessage = (text: string) => {
    if (!text.trim()) return;
    
    // Send chat message to server
    sendMessage({ 
      type: 'chat_message', 
      room_code: roomCode,
      message: text,
      sender: username
    });
    
    // Optimistically add message to UI
    const newMessage = {
      id: `local-${Date.now().toString()}`,
      text,
      sender: 'me', // Local display always shows as "me"
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Header roomCode={roomCode} participants={participants} />
      
      <main className="flex-grow overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={75} className="relative">
            <ScrollArea className="h-full">
              <div className="max-w-4xl mx-auto p-6">
                <div className="mb-12 flex justify-center">
                  <MicButton onRecordingComplete={handleRecordingComplete} />
                </div>
                
                <Carousel className="w-full relative">
                  <CarouselContent>
                    {ideas.length === 0 ? (
                      <CarouselItem>
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                          <p className="text-lg">No ideas yet. Start by recording your first idea!</p>
                        </div>
                      </CarouselItem>
                    ) : (
                      ideas.map(idea => (
                        <CarouselItem key={idea.id} className="pb-10">
                          <IdeaCard 
                            idea={idea} 
                            onAddComment={handleAddComment} 
                          />
                        </CarouselItem>
                      ))
                    )}
                  </CarouselContent>
                  {ideas.length > 1 && (
                    <>
                      <CarouselPrevious className="left-0 lg:-left-12" />
                      <CarouselNext className="right-0 lg:-right-12" />
                    </>
                  )}
                </Carousel>
              </div>
            </ScrollArea>
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-gray-200 dark:bg-gray-700" />
          
          <ResizablePanel defaultSize={25} className="h-full">
            <ChatPanel 
              messages={messages}
              onSendMessage={handleSendChatMessage}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      
      <Footer />
    </div>
  );
};

export default RoomPage;
