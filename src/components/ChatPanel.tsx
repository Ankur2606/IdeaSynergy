import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
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
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Chat</h2>
      </div>
      
      <div className="flex-grow overflow-hidden" ref={scrollAreaRef}>
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[80%] p-3 rounded-lg animate-fade-in ${
                  msg.sender === 'me' 
                    ? 'ml-auto bg-synergy-blue text-white rounded-br-none' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
                }`}
              >
                <div className="text-sm prose dark:prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
                <span className={`text-xs mt-1 ${
                  msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {msg.sender === 'me' ? 'You' : msg.sender} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 outline-none focus:border-synergy-blue focus:ring-1 focus:ring-synergy-blue dark:bg-gray-700 dark:text-white"
        />
        <button 
          type="submit" 
          disabled={!message.trim()}
          className="bg-synergy-blue text-white p-2 rounded-md disabled:opacity-50 transition-colors hover:bg-synergy-blue/90"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
