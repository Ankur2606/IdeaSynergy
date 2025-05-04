
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  roomCode?: string;
  participants?: number;
}

const Header: React.FC<HeaderProps> = ({ roomCode, participants }) => {
  const navigate = useNavigate();
  
  return (
    <header className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center">
      <div onClick={() => navigate('/')} className="flex items-center cursor-pointer">
        <h1 className="text-2xl font-bold text-synergy-blue">
          IdeaSynergy
        </h1>
      </div>
      
      {roomCode && (
        <div className="flex items-center space-x-6">
          <div className="bg-gray-100 px-4 py-2 rounded-full flex items-center">
            <span className="text-gray-500 mr-2">Room:</span>
            <span className="font-medium">{roomCode}</span>
          </div>
          
          <div className="bg-gray-100 px-4 py-2 rounded-full flex items-center">
            <span className="text-gray-500 mr-2">Thinkers:</span>
            <span className="font-medium">{participants || 1}</span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
