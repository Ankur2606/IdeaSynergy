
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Button } from "@/components/ui/button";

interface HeaderProps {
  roomCode?: string;
  participants?: number;
}

const Header: React.FC<HeaderProps> = ({ roomCode, participants }) => {
  const navigate = useNavigate();
  
  return (
    <header className="w-full border-b dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm py-4 px-6 flex justify-between items-center">
      <div onClick={() => navigate('/')} className="flex items-center cursor-pointer group">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-synergy-blue via-synergy-blue to-synergy-blue-light bg-clip-text text-transparent group-hover:scale-[1.01] transition-transform">
          IdeaSynergy
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {roomCode && (
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full flex items-center">
              <span className="text-gray-500 dark:text-gray-400 mr-2">Room:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{roomCode}</span>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full flex items-center">
              <span className="text-gray-500 dark:text-gray-400 mr-2">Thinkers:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{participants || 1}</span>
            </div>
          </div>
        )}
        
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
