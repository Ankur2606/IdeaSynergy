
import React, { useState } from 'react';
import { MessageSquare, Lightbulb } from 'lucide-react';

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
    <div className="idea-card">
      <h3 className="font-bold text-lg mb-3">{idea.transcription}</h3>
      
      <div className="mb-4">
        {idea.themes.map((theme, index) => (
          <span key={index} className="theme-tag">
            {theme}
          </span>
        ))}
      </div>
      
      {idea.prompts.length > 0 && (
        <div className="prompt-box">
          <div className="flex items-center mb-2">
            <Lightbulb size={18} className="text-synergy-green mr-2" />
            <span className="font-medium text-gray-700">AI Prompts</span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {idea.prompts.map((prompt, index) => (
              <li key={index} className="text-gray-600">{prompt}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-4">
        <div 
          className="flex items-center text-gray-500 mb-3 cursor-pointer"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare size={18} className="mr-2" />
          <span>{idea.comments.length} {idea.comments.length === 1 ? 'Comment' : 'Comments'}</span>
        </div>
        
        {showComments && (
          <>
            <div className="max-h-60 overflow-y-auto mb-3 space-y-2">
              {idea.comments.map((comment, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{comment.text}</p>
                  {comment.author && (
                    <p className="text-xs text-gray-500 mt-1">{comment.author}</p>
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
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-synergy-blue focus:ring-1 focus:ring-synergy-blue"
              />
              <button 
                type="submit" 
                disabled={!comment.trim()}
                className="bg-synergy-blue text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default IdeaCard;
