
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <Header />
      
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-2xl w-full px-4 py-16 text-center">
          <div className="space-y-6">
            <div className="mb-2 inline-block relative">
              <span className="absolute -inset-1 -z-10 rounded-full blur bg-gradient-to-r from-synergy-blue/20 to-synergy-green/20"></span>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                Welcome to <span className="bg-gradient-to-r from-synergy-blue to-synergy-green bg-clip-text text-transparent">IdeaSynergy</span>
              </h1>
            </div>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-xl mx-auto">
              Transform your brainstorming sessions with AI-powered creativity and real-time collaboration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                onClick={() => navigate('/join')}
                className="bg-synergy-green hover:bg-synergy-green/90 text-white px-8 py-6 text-lg shadow-lg shadow-synergy-green/20 hover:shadow-synergy-green/30 transition-all hover:scale-105"
              >
                Join Room
              </Button>
              
              <Button
                onClick={handleCreateRoom}
                variant="outline"
                className="border-2 border-synergy-orange text-synergy-orange hover:bg-synergy-orange/10 px-8 py-6 text-lg transition-all hover:scale-105 dark:border-synergy-orange dark:text-synergy-orange"
              >
                Create Room
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
