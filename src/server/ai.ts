import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Define TypeScript interfaces for the API responses
interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  expiration?: number;
}

interface ChatChoice {
  message: {
    content: string;
    role: string;
  };
  finish_reason: string;
  index: number;
}

interface GraniteResponse {
  choices: ChatChoice[];
  created: number;
  id: string;
  model: string;
  object: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Cache the token to reduce authentication requests
let cachedToken: string | null = null;
let tokenExpiration: number = 0;

/**
 * Get IBM Cloud IAM token for API authentication
 */
export async function getToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiration > Date.now()) {
    return cachedToken;
  }
  
  const apiKey = process.env.IBM_API_KEY;
  if (!apiKey) {
    throw new Error("IBM_API_KEY is not set in environment variables");
  }
  
  try {
    const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
        'apikey': apiKey
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to obtain token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as TokenResponse;
    cachedToken = data.access_token;
    
    // Set expiration time (token is valid for 60 minutes, we'll use 55 minutes to be safe)
    tokenExpiration = Date.now() + (55 * 60 * 1000);
    
    return cachedToken;
  } catch (error) {
    console.error('Error getting IBM Cloud token:', error);
    throw new Error('Failed to authenticate with IBM Cloud');
  }
}

/**
 * Process transcription through the IBM Granite API
 */
export async function generateText(transcription: string): Promise<{
  themes: string[];
  prompts: string[];
}> {
  try {
    const token = await getToken();
    const url = "https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29";
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
    
    const body = {
      messages: [
        {
          role: "system",
          content: `You are an AI assistant designed to enhance brainstorming sessions. Given a transcribed spoken idea, perform two tasks in sequence:
          
          1. **Analyze**: Identify key themes or categories in the text. Consider concepts, emotions, or actionable ideas. Output this analysis within <think> tags.
          2. **Generate**: Based on the identified themes and the original text, create 2-3 creative prompts to inspire further brainstorming. Output these prompts within <response> tags as a numbered list.
          
          Ensure the analysis is concise yet insightful, and the prompts are imaginative, specific, and relevant to the themes.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: transcription
            }
          ]
        }
      ],
      project_id: "b7ca2505-b0d4-4c6b-8cf8-58ede2848f9f",
      model_id: "ibm/granite-3-3-8b-instruct",
      frequency_penalty: 0,
      max_tokens: 2000,
      presence_penalty: 0,
      temperature: 0,
      top_p: 1
    };
    
    const response = await fetch(url, {
      headers,
      method: "POST",
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Non-200 response from Granite API: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json() as GraniteResponse;
    const content = result.choices[0].message.content;
    
    // Parse content using regex
    const thinkMatch = content.match(/<think>(.*?)<\/think>/s);
    const responseMatch = content.match(/<response>(.*?)<\/response>/s);
    
    // Extract themes as an array
    const themes = thinkMatch ? 
      thinkMatch[1].trim().split(',').map((theme: string) => theme.trim()) : 
      [];
    
    // Extract prompts as an array
    const prompts = responseMatch ? 
      responseMatch[1].trim().split(/\d+\./).filter(Boolean).map((line: string) => line.trim()) : 
      [];
    
    return { themes, prompts };
  } catch (error) {
    console.error('Error generating text with Granite API:', error);
    
    // Return fallback response in case of error
    return { 
      themes: ['Error processing themes'], 
      prompts: ['Could not generate prompts. Please try again.'] 
    };
  }
}