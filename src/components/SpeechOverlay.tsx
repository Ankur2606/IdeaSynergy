import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Edit2, Check, Send } from 'lucide-react';

interface SpeechOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  initialText?: string;
  isRecording?: boolean;
  onToggleRecording?: () => void;
}

const SpeechOverlay: React.FC<SpeechOverlayProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialText = '',
  isRecording = false,
  onToggleRecording
}) => {
  const [text, setText] = useState<string>(initialText);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const textAreaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setIsEditing(false);
    }
  }, [isOpen, initialText]);

  // Handle ESC key to close overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Update text when initialText changes (during speech)
  useEffect(() => {
    if (!isEditing && initialText !== text) {
      setText(initialText);
    }
  }, [initialText, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [isEditing]);

  // Handle overlay click to prevent closing when clicking inside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Toggle editing mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing && onToggleRecording && isRecording) {
      // Stop recording when switching to edit mode
      onToggleRecording();
    }
  };

  // Handle submit
  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  // Handle content editable changes
  const handleTextChange = () => {
    if (textAreaRef.current) {
      setText(textAreaRef.current.innerText || '');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300"
      onClick={handleOverlayClick}
      ref={overlayRef}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {isRecording ? 'Listening...' : 'Review Your Idea'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div 
            ref={textAreaRef}
            contentEditable={isEditing}
            onInput={handleTextChange}
            className={`min-h-32 max-h-64 overflow-y-auto p-3 rounded-md border ${
              isEditing 
                ? 'border-synergy-green focus:ring-2 focus:ring-synergy-green/50 focus:outline-none' 
                : 'border-gray-200 dark:border-gray-700'
            } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
            suppressContentEditableWarning
          >
            {text || (
              isRecording 
                ? <span className="text-gray-400 dark:text-gray-500">Speak now...</span>
                : <span className="text-gray-400 dark:text-gray-500">No text captured yet. Click the mic button to start recording.</span>
            )}
          </div>

          <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <div>
              {isRecording && (
                <span className="flex items-center animate-pulse">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Recording...
                </span>
              )}
            </div>
            <div>{text.length} characters</div>
          </div>
        </div>

        <div className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button 
              onClick={onToggleRecording}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              {isRecording ? 'Stop' : 'Record'}
            </button>
            
            <button 
              onClick={toggleEdit}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${
                isEditing 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
              {isEditing ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            
            <button 
              onClick={handleSubmit}
              disabled={!text.trim()}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-md bg-synergy-green text-white ${
                text.trim() ? 'hover:bg-synergy-green/90' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechOverlay;