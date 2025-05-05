// Switched from Vosk to Web Speech API on May 5, 2025.
// This file now provides mock functions for compatibility with existing code.

/**
 * Initialize transcription service (no-op now that we use client-side Web Speech API)
 */
export async function setupVosk() {
  console.log('Using client-side Web Speech API for transcription');
  return Promise.resolve();
}

/**
 * No longer used - kept for compatibility
 */
export async function transcribeAudio(audioData: Buffer): Promise<string> {
  console.log('Server-side transcription bypassed, using client Web Speech API');
  return '';
}

/**
 * Fallback function for testing or when Web Speech API is not available
 */
export function mockTranscription(audioLength: number): string {
  // Generate a mock transcription for compatibility
  const options = [
    'I think we should create a mobile app that helps people track their water usage.',
    'What if we made a platform for connecting local farmers with restaurants?',
    'The biggest problem with current solutions is they don\'t consider user experience enough.',
    'Maybe we could implement a recommendation system based on previous purchases.',
    'I believe sustainability should be our main focus for this project.',
    'We could develop a blockchain solution for supply chain transparency.',
    'What about an AI assistant that helps with creative brainstorming?',
    'I think we should focus on accessibility features in our application.',
    'Could we create a tool that helps with remote team collaboration?',
    'The healthcare industry needs better patient management solutions.',
  ];
  
  return options[Math.floor(Math.random() * options.length)];
}