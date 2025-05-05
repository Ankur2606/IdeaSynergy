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
  const lastTextRef = useRef<string>(''); // Keep track of the last text value
  const cursorPositionRef = useRef<{ start: number, end: number }>({ start: 0, end: 0 });
  const isUpdatingRef = useRef<boolean>(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      lastTextRef.current = initialText;
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
    if (!isEditing && initialText !== '') {
      // Only update if we have new text to append
      if (initialText.length > lastTextRef.current.length) {
        // Preserve existing text and append new content
        setText((prevText) => {
          // If the new text starts with the old text, just use the new text
          // This handles cases where the transcription engine might refine earlier parts
          if (initialText.startsWith(prevText)) {
            lastTextRef.current = initialText;
            return initialText;
          } else {
            // Otherwise append only the new portion
            lastTextRef.current = initialText;
            return prevText;
          }
        });
      }
    }
  }, [initialText, isEditing]);

  // Store cursor position before any updates
  const saveCursorPosition = () => {
    if (!isEditing || !textAreaRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (!textAreaRef.current.contains(range.commonAncestorContainer)) return;
    
    cursorPositionRef.current = {
      start: range.startOffset,
      end: range.endOffset
    };
  };
  
  // Restore cursor position after updates
  const restoreCursorPosition = () => {
    if (!isEditing || !textAreaRef.current || isUpdatingRef.current) return;
    
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      try {
        const textNode = findFirstTextNode(textAreaRef.current);
        if (!textNode) {
          // If no text node exists, create one
          const newTextNode = document.createTextNode(text);
          textAreaRef.current?.appendChild(newTextNode);
          
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            const position = Math.min(cursorPositionRef.current.start, text.length);
            range.setStart(newTextNode, position);
            range.setEnd(newTextNode, position);
            selection.removeAllRanges();
            selection.addRange(range);
          }
          return;
        }
        
        const selection = window.getSelection();
        if (!selection) return;
        
        const range = document.createRange();
        const startPosition = Math.min(cursorPositionRef.current.start, textNode.length);
        const endPosition = Math.min(cursorPositionRef.current.end, textNode.length);
        
        range.setStart(textNode, startPosition);
        range.setEnd(textNode, endPosition);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.error('Error restoring cursor position:', e);
      } finally {
        isUpdatingRef.current = false;
      }
    });
  };
  
  // Helper function to find the first text node
  const findFirstTextNode = (element: Node): Text | null => {
    if (element.nodeType === Node.TEXT_NODE) {
      return element as Text;
    }
    
    for (let i = 0; i < element.childNodes.length; i++) {
      const textNode = findFirstTextNode(element.childNodes[i]);
      if (textNode) {
        return textNode;
      }
    }
    
    return null;
  };

  // Focus textarea when entering edit mode and place cursor at the end
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
      
      // Place cursor at the end of content
      const range = document.createRange();
      const selection = window.getSelection();
      
      // First try to find a text node
      const textNode = findFirstTextNode(textAreaRef.current);
      
      if (textNode) {
        // If we have a text node, set cursor to the end of it
        range.setStart(textNode, textNode.length);
        range.setEnd(textNode, textNode.length);
      } else if (textAreaRef.current.childNodes.length > 0) {
        // Otherwise try to set it after the last child
        const lastNode = textAreaRef.current.lastChild;
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
        }
      } else {
        // If no nodes exist, just set the cursor in the element
        range.setStart(textAreaRef.current, 0);
        range.setEnd(textAreaRef.current, 0);
      }
      
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Set cursor position reference
      cursorPositionRef.current = { start: text.length, end: text.length };
    }
  }, [isEditing, text.length]);

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

  // Track cursor position when it changes
  const handleSelectionChange = () => {
    if (!isEditing || isUpdatingRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (!textAreaRef.current?.contains(range.commonAncestorContainer)) return;
    
    cursorPositionRef.current = {
      start: range.startOffset,
      end: range.endOffset
    };
  };

  // Set up selection change listener
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Handle content editable changes with improved cursor maintenance
  const handleTextChange = () => {
    if (!textAreaRef.current || isUpdatingRef.current) return;
    
    // Prevent rapid updates causing cursor issues
    isUpdatingRef.current = true;
    
    // Save cursor position before updating state
    saveCursorPosition();
    
    // Update the text state
    const newText = textAreaRef.current.innerText || '';
    setText(newText);
    
    // Restore cursor position after state update
    restoreCursorPosition();
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