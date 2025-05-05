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
  const transcriptHistoryRef = useRef<string>('');  // Store accumulated transcript
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);
  
  const startRecognition = () => {
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
      
      // Set a timeout to automatically stop recording after 30 seconds if no speech is detected
      recordingTimeoutRef.current = setTimeout(() => {
        if (transcriptHistoryRef.current.trim() === currentTranscript.trim()) {
          console.log('No new speech detected after timeout, stopping recording');
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
      
      // Update the transcript, preserving previous content
      const newTranscript = finalTranscript || interimTranscript;
      
      // If we have final transcripts, append them to our history
      if (finalTranscript) {
        transcriptHistoryRef.current += ' ' + finalTranscript.trim();
        transcriptHistoryRef.current = transcriptHistoryRef.current.trim();
        setCurrentTranscript(transcriptHistoryRef.current);
      } else if (interimTranscript) {
        // For interim results, show the history plus the interim
        setCurrentTranscript((transcriptHistoryRef.current + ' ' + interimTranscript).trim());
      }
      
      // If we got some speech, clear the timeout
      if (newTranscript.trim() !== '') {
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
          
          // Reset the timeout for silence detection
          recordingTimeoutRef.current = setTimeout(() => {
            if (transcriptHistoryRef.current.trim() === currentTranscript.trim()) {
              console.log('No new speech detected after timeout, stopping recording');
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
            }
          }, 30000);
        }
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
      
      // For non-critical errors like "no-speech", try to restart recognition
      if (event.error === 'no-speech' || event.error === 'network') {
        if (isRecording) {
          console.log('Attempting to restart recognition after error:', event.error);
          // Attempt to restart after a brief pause
          restartTimeoutRef.current = setTimeout(() => {
            if (isRecording) {
              try {
                startRecognition();
              } catch (e) {
                console.error("Failed to restart recognition:", e);
                setStatus('error');
                setIsRecording(false);
              }
            }
          }, 1000);
          return;
        }
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
      console.log('Speech recognition ended');
      
      // Clear timeout if it exists
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      
      // If we're still supposed to be recording, restart the recognition
      // This handles cases where the recognition service stops unexpectedly
      if (isRecording && status !== 'error') {
        console.log('Recognition ended but still recording, restarting...');
        restartTimeoutRef.current = setTimeout(() => {
          if (isRecording) {
            try {
              startRecognition();
            } catch (e) {
              console.error("Failed to restart recognition:", e);
              setIsRecording(false);
            }
          }
        }, 500);
      } else {
        // Only update recording state if we're intentionally stopping
        setIsRecording(false);
      }
    };
    
    try {
      recognition.start();
    } catch (e) {
      console.error("Error starting speech recognition:", e);
      setIsRecording(false);
      setStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to start speech recognition');
    }
  };

  const startRecording = async () => {
    try {
      // Reset states
      setErrorMessage('');
      transcriptHistoryRef.current = ''; // Clear transcript history
      setCurrentTranscript('');
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      // Open overlay before starting recording
      setOverlayVisible(true);
      
      // Start recognition
      startRecognition();
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
    console.log('Stopping recording');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Clear all timeouts
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    setIsRecording(false);
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
    
    // Clear all timeouts
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    // Close overlay
    setOverlayVisible(false);
    setStatus('idle');
    setCurrentTranscript('');
    transcriptHistoryRef.current = '';
  };

  const handleOverlaySubmit = (text: string) => {
    // Close overlay first
    setOverlayVisible(false);
    
    // Show processing state
    setStatus('processing');
    
    // Clear any ongoing recording
    if (isRecording) {
      stopRecording();
    }
    
    // Submit the transcription
    onRecordingComplete(text);
    
    // Reset state after submission
    setTimeout(() => {
      setStatus('idle');
      setCurrentTranscript('');
      transcriptHistoryRef.current = '';
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
