
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const HomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateRoom = () => {
    // Generate a random room code (this would typically come from the server)
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/room/${roomCode}`);
    
    toast({
      title: "Room Created!",
      description: `Your room code is ${roomCode}`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-2xl w-full px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to IdeaSynergy
          </h1>
          
          <p className="text-xl text-gray-600 mb-12">
            Transform your brainstorming sessions with AI-powered creativity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/join')}
              className="bg-synergy-green hover:bg-synergy-green/90 text-white px-8 py-6 text-lg button-hover"
            >
              Join Room
            </Button>
            
            <Button
              onClick={handleCreateRoom}
              variant="outline"
              className="border-synergy-orange text-synergy-orange hover:bg-synergy-orange/10 px-8 py-6 text-lg button-hover"
            >
              Create Room
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
