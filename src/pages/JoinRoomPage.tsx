
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <Header />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700"
        >
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Join a Brainstorming Room
          </h1>
          
          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <Input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter Room Code"
                className="w-full px-4 py-6 text-lg text-center uppercase font-mono tracking-wider dark:bg-gray-700 dark:text-white dark:border-gray-600"
                maxLength={6}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-synergy-blue hover:bg-synergy-blue/90 py-6 text-lg transition-transform hover:scale-105"
            >
              Join
            </Button>
            
            <div className="text-center">
              <Button 
                type="button" 
                onClick={() => navigate('/')} 
                variant="ghost"
                className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-sm flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Home
              </Button>
            </div>
          </form>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default JoinRoomPage;
