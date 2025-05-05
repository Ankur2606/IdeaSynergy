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
    
    // Add some demo data for preview purposes with more test cases for UI robustness
    const demoData = [
      {
        id: '1',
        transcription: "What if we integrate AI voice assistants into the shopping experience for personalized recommendations?",
        themes: ["AI", "retail", "personalization"],
        prompts: [
          "Consider how this could help people with accessibility needs",
          "How would privacy concerns be addressed?",
          "What kind of voice recognition technology would be most suitable?",
          "How could this be integrated with existing shopping applications?",
          "Would this work better in physical stores or online shopping?",
          "How would you handle multiple languages and accents?",
          "What metrics would you use to measure success?",
          "How would you train the AI to understand product-specific terminology?"
        ],
        comments: [
          { id: '1', text: "This reminds me of the system they're testing at Nordstrom", author: "Alex" },
          { id: '2', text: "We could use existing voice recognition APIs to keep costs down", author: "Jamie" },
          { id: '3', text: "I'm concerned about privacy implications, especially in public spaces", author: "Taylor" },
          { id: '4', text: "Would be great to integrate this with inventory management systems too", author: "Morgan" },
          { id: '5', text: "Could enhance accessibility for visually impaired customers significantly", author: "Casey" }
        ]
      },
      {
        id: '2',
        transcription: "We should create a mobile app that gamifies sustainable commuting choices",
        themes: ["sustainability", "gamification", "mobile"],
        prompts: [
          "What rewards would motivate users?",
          "How could this integrate with city transit systems?",
          "What metrics would you track to measure environmental impact?",
          "How would you verify that users are actually using sustainable transportation?",
          "Could this include social features to encourage friendly competition?"
        ],
        comments: [
          { id: '3', text: "This could partner with local businesses for rewards", author: "Taylor" },
          { id: '4', text: "We'd need to integrate with city APIs for transit data", author: "Alex" },
          { id: '5', text: "Could we add challenges for different sustainable activities?", author: "Jamie" }
        ]
      },
      {
        id: '3',
        transcription: "Create a collaborative platform for scientists to share research data in real-time",
        themes: ["science", "collaboration", "data sharing"],
        prompts: [
          "How would you handle intellectual property concerns?",
          "What security measures would be necessary?",
          "How could AI help in analyzing cross-discipline data?",
          "Would this work better as a web platform or desktop application?",
          "What visualization tools would be most useful?",
          "How would you handle large datasets across different bandwidth capabilities?",
          "Could this integrate with existing research publication workflows?"
        ],
        comments: [
          { id: '6', text: "This could revolutionize how interdisciplinary research is conducted", author: "Morgan" },
          { id: '7', text: "Data formatting standards would be a major challenge", author: "Casey" },
          { id: '8', text: "Would need robust citation and attribution systems", author: "Taylor" },
          { id: '9', text: "Could integrate with existing academic repositories", author: "Alex" }
        ]
      }
    ];
    
    setTimeout(() => {
      setIdeas(demoData);
      setParticipants(5);
      
      setMessages([
        { id: '1', text: "Hi everyone! Ready to brainstorm?", sender: "Jamie", timestamp: new Date() },
        { id: '2', text: "Definitely! I've been thinking about AI applications in retail", sender: "Alex", timestamp: new Date() },
        { id: '3', text: "Great idea, let's explore that", sender: "me", timestamp: new Date() },
        { id: '4', text: "I like the sustainable commuting idea too", sender: "Morgan", timestamp: new Date() },
        { id: '5', text: "The scientific platform could have huge impact", sender: "Casey", timestamp: new Date() },
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
