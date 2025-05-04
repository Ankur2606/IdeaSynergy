
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const JoinRoomPage = () => {
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a room code to join",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to the room
    navigate(`/room/${roomCode.toUpperCase()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-8">
            Join a Brainstorming Room
          </h1>
          
          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <Input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter Room Code"
                className="w-full px-4 py-6 text-lg text-center uppercase"
                maxLength={6}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-synergy-blue hover:bg-synergy-blue/90 py-6 text-lg button-hover"
            >
              Join
            </Button>
            
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => navigate('/')} 
                className="text-gray-500 hover:text-gray-800 text-sm"
              >
                Back to Home
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default JoinRoomPage;
