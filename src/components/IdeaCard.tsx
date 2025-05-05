
import React, { useState } from 'react';
import { MessageSquare, Lightbulb, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  text: string;
  author?: string;
}

export interface Idea {
  id: string;
  transcription: string;
  themes: string[];
  prompts: string[];
  comments: Comment[];
}

interface IdeaCardProps {
  idea: Idea;
  onAddComment: (ideaId: string, comment: string) => void;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onAddComment }) => {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(idea.id, comment);
      setComment('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/30 p-6 mb-6 transition-all duration-300 hover:shadow-xl border border-gray-100 dark:border-gray-700 animate-fade-in">
      <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{idea.transcription}</h3>
      
      <div className="mb-4 flex flex-wrap gap-2">
        {idea.themes.map((theme, index) => (
          <span key={index} className="inline-block bg-synergy-blue/10 dark:bg-synergy-blue/20 text-synergy-blue px-3 py-1 rounded-full text-xs font-medium italic">
            {theme}
          </span>
        ))}
      </div>
      
      {idea.prompts.length > 0 && (
        <div className="bg-synergy-green-light dark:bg-synergy-green/10 rounded-lg p-4 my-4 border-l-4 border-synergy-green">
          <div className="flex items-center mb-2">
            <Lightbulb size={18} className="text-synergy-green mr-2" />
            <span className="font-medium text-gray-700 dark:text-gray-200">AI Prompts</span>
          </div>
          <ul className="space-y-2">
            {idea.prompts.map((prompt, index) => (
              <li key={index} className="text-gray-600 dark:text-gray-300 flex items-start">
                <span className="mr-2">•</span>
                <span>{prompt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div 
          className="flex items-center text-gray-500 dark:text-gray-400 mb-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare size={18} className="mr-2" />
          <span className="font-medium">{idea.comments.length} {idea.comments.length === 1 ? 'Comment' : 'Comments'}</span>
        </div>
        
        {showComments && (
          <>
            <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
              {idea.comments.map((comment, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-200">{comment.text}</p>
                  {comment.author && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{comment.author}</p>
                  )}
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:border-synergy-blue focus:ring-1 focus:ring-synergy-blue dark:bg-gray-700 dark:text-white"
              />
              <Button 
                type="submit" 
                disabled={!comment.trim()}
                className="bg-synergy-blue text-white px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 hover:bg-synergy-blue/90"
              >
                <Send size={16} />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default IdeaCard;
