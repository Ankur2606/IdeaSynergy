import React, { useState, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import SpeechOverlay from './SpeechOverlay';

// Switched from MediaRecorder to Web Speech API with SpeechOverlay on May 5, 2025.

// Web Speech API interfaces
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onerror: (event: any) => void;
  onend: () => void;
  onstart: () => void;
  onresult: (event: any) => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface MicButtonProps {
  onRecordingComplete: (transcription: string) => void;
}

const MicButton: React.FC<MicButtonProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);
  
  const startRecording = async () => {
    try {
      // Reset states
      setErrorMessage('');
      setCurrentTranscript('');
      
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser. Please try Chrome or Edge.");
      }
      
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsRecording(true);
        setStatus('recording');
        setOverlayVisible(true);
        
        // Set a timeout to automatically stop recording after 30 seconds if no speech is detected
        recordingTimeoutRef.current = setTimeout(() => {
          if (currentTranscript.trim() === '') {
            console.log('No speech detected after timeout, stopping recording');
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          }
        }, 30000);
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update the transcript
        const newTranscript = finalTranscript || interimTranscript;
        setCurrentTranscript(newTranscript);
        
        // If we got some speech, clear the timeout
        if (newTranscript.trim() !== '' && recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        
        // Handle specific error types
        switch (event.error) {
          case 'no-speech':
            setErrorMessage('No speech detected. Please try again and speak clearly.');
            break;
          case 'audio-capture':
            setErrorMessage('Could not access microphone. Please check your device settings.');
            break;
          case 'not-allowed':
            setErrorMessage('Microphone permission was denied. Please allow microphone access.');
            break;
          case 'network':
            setErrorMessage('Network error occurred. Please check your connection.');
            break;
          default:
            setErrorMessage(`Error: ${event.error}. Please try again.`);
            break;
        }
        
        setStatus('error');
        setIsRecording(false);
        
        // Clear any timeouts
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        
        // Reset after showing the error
        setTimeout(() => {
          setStatus('idle');
          setErrorMessage('');
        }, 3000);
      };
      
      recognition.onend = () => {
        // Clear timeout if it exists
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        
        // Keep overlay open when recording ends unless there was an error
        if (status !== 'error') {
          setIsRecording(false);
          // We don't close the overlay here, user can review text
        } else {
          setOverlayVisible(false);
        }
      };
      
      recognition.start();
    } catch (error) {
      console.error("Error with speech recognition:", error);
      setStatus('error');
      setIsRecording(false);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error accessing speech recognition');
      
      // Reset after showing the error
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 3000);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Clear timeout if it exists
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const handleOverlayClose = () => {
    // Stop recording if it's active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.abort();
      setIsRecording(false);
    }
    
    // Close overlay
    setOverlayVisible(false);
    setStatus('idle');
    setCurrentTranscript('');
  };

  const handleOverlaySubmit = (text: string) => {
    // Close overlay first
    setOverlayVisible(false);
    
    // Show processing state
    setStatus('processing');
    
    // Submit the transcription
    onRecordingComplete(text);
    
    // Reset state after submission
    setTimeout(() => {
      setStatus('idle');
      setCurrentTranscript('');
    }, 2000);
  };

  const handleButtonClick = () => {
    if (status !== 'processing') {
      setOverlayVisible(true);
      if (!isRecording) {
        startRecording();
      }
    }
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <button
          onClick={handleButtonClick}
          disabled={status === 'processing'}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 dark:text-white ${
            status === 'recording'
              ? 'bg-red-500 text-white animate-recording shadow-red-500/30'
              : status === 'processing'
              ? 'bg-synergy-orange text-white shadow-synergy-orange/30'
              : status === 'error'
              ? 'bg-red-400 text-white shadow-red-400/30'
              : 'bg-synergy-green text-white hover:shadow-synergy-green/50 hover:scale-105 shadow-synergy-green/30'
          }`}
        >
          <Mic size={36} />
        </button>
        
        <div className="h-6 mt-3 text-center">
          {status === 'recording' && (
            <span className="text-red-500 dark:text-red-400 font-medium animate-pulse flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
              Recording...
            </span>
          )}
          {status === 'processing' && (
            <span className="text-synergy-orange dark:text-synergy-orange font-medium">Processing...</span>
          )}
          {status === 'error' && (
            <span className="text-red-500 dark:text-red-400 font-medium text-sm max-w-[200px]">{errorMessage}</span>
          )}
          {status === 'idle' && (
            <span className="text-gray-500 dark:text-gray-400">Share Idea</span>
          )}
        </div>
      </div>
      
      <SpeechOverlay 
        isOpen={overlayVisible}
        onClose={handleOverlayClose}
        onSubmit={handleOverlaySubmit}
        initialText={currentTranscript}
        isRecording={isRecording}
        onToggleRecording={toggleRecording}
      />
    </>
  );
};

export default MicButton;
