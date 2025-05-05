import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

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
    
    const data = await response.json();
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

1. **Analyze**: Extract 3-5 key themes or domains from the idea as single-word or very short (1-2 words maximum) labels. Examples: "Healthcare", "Blockchain", "Remote Work", "AI Ethics", "UX Design". Place each theme on a new line starting with "•". Output this analysis within <think> tags.

2. **Generate**: Based on the identified themes and the original idea, create 3 creative prompts that would help expand this brainstorming idea further. Format each as a numbered item with a bold header followed by a question. Output these prompts within <response> tags.

Example format:
<think>
• Healthcare
• AI Ethics
• Data Privacy
• Patient Care
</think>

<response>
1. **Implementation**: How could this solution be integrated with existing systems?
2. **Ethics**: What privacy safeguards would need to be in place?
3. **Impact**: How would this technology change patient outcomes?
</response>

Be extremely concise with theme labels - each MUST be only 1-2 words maximum.`
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
    
    const result = await response.json();
    const content = result.choices[0].message.content;
    
    // Improved parsing of content using more robust regex
    // Parse and extract the content between <think> and </think> tags
    const themeMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    const themes = themeMatch 
      ? parseThemes(themeMatch[1]) 
      : ['Idea', 'Concept', 'Innovation'];
    
    // Parse and extract the content between <response> and </response> tags
    const promptMatch = content.match(/<response>([\s\S]*?)<\/response>/);
    const prompts = promptMatch 
      ? parsePrompts(promptMatch[1]) 
      : ['**Exploration**: How might this idea be developed further?'];
    
    console.log('Parsed themes:', themes);
    console.log('Parsed prompts:', prompts);
    
    return { themes, prompts };
  } catch (error) {
    console.error('Error generating text with Granite API:', error);
    
    // Return fallback response in case of error
    return { 
      themes: ['Idea', 'Concept', 'Innovation'], 
      prompts: ['**Exploration**: Could not generate specific prompts. Please try again.'] 
    };
  }
}

/**
 * Parse theme bullet points from the extracted content
 */
function parseThemes(content: string): string[] {
  // Clean up and trim the content
  const cleanedContent = content.trim();
  
  // Split by bullet points and filter out empty lines
  const themeLines = cleanedContent.split(/•/).map(line => line.trim()).filter(Boolean);
  
  if (themeLines.length === 0) {
    // If no themes found with bullets, try splitting by newlines
    return cleanedContent
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        // Remove any numbers, bullets, or other markers at the start
        return line.replace(/^[\d\.\s•-]*/, '').trim();
      });
  }
  
  return themeLines;
}

/**
 * Parse prompts from the extracted content, preserving markdown formatting
 */
function parsePrompts(content: string): string[] {
  // Clean up and trim the content
  const cleanedContent = content.trim();
  
  // Use regex to match numbered items, preserving markdown formatting
  const promptRegex = /(\d+\.\s*)(.*?)(?=\n\d+\.|\n*$)/gs;
  const matches = [...cleanedContent.matchAll(promptRegex)];
  
  if (matches.length > 0) {
    return matches.map(match => match[2].trim());
  }
  
  // Fallback: split by newlines if numbered regex doesn't work
  return cleanedContent
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      // Remove any numbers at the start but preserve markdown
      return line.replace(/^\d+\.\s*/, '').trim();
    });
}