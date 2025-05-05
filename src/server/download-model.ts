import fs from 'fs';
import path from 'path';
import https from 'https';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';

// Small English model URL
const MODEL_URL = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';
const MODEL_PATH = process.env.VOSK_MODEL_PATH || './model';

// Function to download and extract the Vosk model
export async function downloadModel() {
  if (fs.existsSync(path.join(MODEL_PATH, 'final.mdl'))) {
    console.log('Vosk model already exists, skipping download');
    return;
  }
  
  console.log('Downloading Vosk model...');
  console.log('This may take a few minutes...');

  // Create directory if it doesn't exist
  if (!fs.existsSync(MODEL_PATH)) {
    fs.mkdirSync(MODEL_PATH, { recursive: true });
  }
  
  // Download zip file
  const zipPath = path.join(MODEL_PATH, 'model.zip');
  const file = createWriteStream(zipPath);
  
  return new Promise((resolve, reject) => {
    https.get(MODEL_URL, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('Model download complete. Extracting...');
        
        // We would normally extract the zip here, but for simplicity in this demo,
        // we'll just prompt the user to extract it manually
        console.log(`
          Please extract the downloaded zip file manually:
          1. Navigate to ${path.resolve(MODEL_PATH)}
          2. Extract the model.zip file
          3. Restart the server
        `);
        
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlinkSync(zipPath);
      reject(err);
    });
  });
}

// Only run when script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  downloadModel()
    .then(() => console.log('Model download process complete'))
    .catch(err => console.error('Error downloading model:', err));
}