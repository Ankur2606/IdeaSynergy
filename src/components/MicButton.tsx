
import React, { useState } from 'react';
import { Mic } from 'lucide-react';

interface MicButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

const MicButton: React.FC<MicButtonProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: BlobPart[] = [];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setStatus('processing');
        onRecordingComplete(audioBlob);

        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        
        // Reset after processing (would normally wait for server response)
        setTimeout(() => {
          setStatus('idle');
          setIsRecording(false);
        }, 2000);
      };

      setIsRecording(true);
      setStatus('recording');
      mediaRecorder.start();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const handleClick = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleClick}
        disabled={status === 'processing'}
        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg button-hover ${
          status === 'recording'
            ? 'bg-red-500 text-white animate-recording'
            : status === 'processing'
            ? 'bg-synergy-orange text-white'
            : 'bg-synergy-green text-white'
        }`}
      >
        <Mic size={36} />
      </button>
      
      <div className="h-6 mt-3 text-center">
        {status === 'recording' && (
          <span className="text-red-500 font-medium animate-pulse">Recording...</span>
        )}
        {status === 'processing' && (
          <span className="text-synergy-orange font-medium">Processing...</span>
        )}
        {status === 'idle' && (
          <span className="text-gray-500">Share Idea</span>
        )}
      </div>
    </div>
  );
};

export default MicButton;
