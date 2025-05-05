import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Lightbulb, Send, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

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

// Number of comments to show initially
const COMMENTS_PER_PAGE = 2;

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onAddComment }) => {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [visibleComments, setVisibleComments] = useState(COMMENTS_PER_PAGE);
  
  const promptsSectionRef = useRef<HTMLDivElement>(null);
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle expanding of prompts section with auto-scrolling
  useEffect(() => {
    if (showPrompts && promptsSectionRef.current) {
      setTimeout(() => {
        promptsSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 300); // Small delay to allow animation to start
    }
  }, [showPrompts]);

  // Handle expanding of comments section with auto-scrolling
  useEffect(() => {
    if (showComments && commentsSectionRef.current) {
      setTimeout(() => {
        commentsSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 300); // Small delay to allow animation to start
    }
  }, [showComments]);

  // Load more comments
  const handleLoadMoreComments = () => {
    setVisibleComments(prev => Math.min(prev + COMMENTS_PER_PAGE, idea.comments.length));
    
    // Ensure the new comments are scrolled into view
    setTimeout(() => {
      if (commentsSectionRef.current) {
        const lastComment = commentsSectionRef.current.querySelector('.comment-item:last-child');
        lastComment?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }, 100);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(idea.id, comment);
      setComment('');
      // Show one more comment when adding a new one to include the one just added
      setVisibleComments(prev => Math.min(prev + 1, idea.comments.length + 1));
    }
  };

  return (
    <Card 
      ref={cardRef}
      className="bg-card animate-fade-in shadow-lg dark:shadow-gray-900/30 border-gray-100 dark:border-gray-700 transition-all"
    >
      <CardContent className="p-6">
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <h3 className="font-bold text-lg mb-4 text-foreground">{idea.transcription}</h3>
          
          <div className="mb-4 flex flex-wrap gap-2">
            {idea.themes.map((theme, index) => (
              <span key={index} className="inline-block bg-synergy-blue/10 dark:bg-synergy-blue/20 text-synergy-blue px-3 py-1 rounded-full text-xs font-medium italic">
                {theme}
              </span>
            ))}
          </div>
          
          {idea.prompts.length > 0 && (
            <div className="my-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrompts(!showPrompts)}
                className="flex items-center w-full justify-between text-left p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Lightbulb size={18} className="text-synergy-green mr-2" />
                  <span className="font-medium">AI Prompts ({idea.prompts.length})</span>
                </div>
                {showPrompts ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </Button>
              
              {showPrompts && (
                <div 
                  ref={promptsSectionRef}
                  className="mt-2 bg-synergy-green-light dark:bg-synergy-green/10 rounded-lg p-4 border-l-4 border-synergy-green animate-accordion-down"
                >
                  <ScrollArea className="max-h-60">
                    <ul className="space-y-2">
                      {idea.prompts.map((prompt, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-300 flex items-start">
                          <span className="mr-2 flex-shrink-0">•</span>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            >
                              {prompt}
                            </ReactMarkdown>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center w-full justify-between text-left p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <div className="flex items-center">
                <MessageSquare size={18} className="mr-2" />
                <span className="font-medium">{idea.comments.length} {idea.comments.length === 1 ? 'Comment' : 'Comments'}</span>
              </div>
              {showComments ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </Button>
            
            {showComments && (
              <div 
                ref={commentsSectionRef} 
                className="animate-accordion-down mt-2"
              >
                <ScrollArea className="max-h-60">
                  <div className="space-y-3">
                    {idea.comments.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No comments yet</p>
                    ) : (
                      idea.comments.slice(0, visibleComments).map((comment, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg comment-item">
                          <p className="text-sm text-gray-700 dark:text-gray-200">{comment.text}</p>
                          {comment.author && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{comment.author}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                {visibleComments < idea.comments.length && (
                  <div className="mt-3 flex justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                      onClick={handleLoadMoreComments}
                    >
                      <Plus size={12} />
                      <span>Load more comments</span>
                    </Button>
                  </div>
                )}
                
                <form onSubmit={handleSubmitComment} className="flex gap-2 mt-3">
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
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IdeaCard;
