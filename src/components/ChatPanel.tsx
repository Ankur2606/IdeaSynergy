
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Live Chat</h2>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[75%] p-3 rounded-lg animate-fade-in ${
                msg.sender === 'me' 
                  ? 'ml-auto bg-synergy-blue text-white rounded-br-none' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <span className={`text-xs mt-1 ${
                msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {msg.sender === 'me' ? 'You' : msg.sender} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-synergy-blue focus:ring-1 focus:ring-synergy-blue"
        />
        <button 
          type="submit" 
          disabled={!message.trim()}
          className="bg-synergy-blue text-white p-2 rounded-md disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
