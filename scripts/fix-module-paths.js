/**
 * This script fixes ES module import paths by adding .js extensions
 * to local imports, which is required for ES modules in Node.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '../dist/server');

// Create a package.json file in the dist/server directory to specify module type
console.log('Creating module configuration for server...');
const packageJsonContent = {
  name: "ideasynergy-server",
  type: "module",
  private: true
};

fs.writeFileSync(
  path.join(serverDir, 'package.json'), 
  JSON.stringify(packageJsonContent, null, 2)
);

// Fix import paths in server files
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      fixImportPaths(fullPath);
    }
  }
}

function fixImportPaths(filePath) {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix import statements for local files (not node modules)
  // Match imports like: import { something } from './file'; or import something from './file';
  const importRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+[^,]+|\w+)(?:\s*,\s*(?:{[^}]*}|\*\s+as\s+[^,]+|\w+))*)?(?:\s*,\s*)?(?:\s+from\s+)?['"](\.[^'"]+)['"];?/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    // Only add .js extension if it doesn't already have an extension
    if (!importPath.endsWith('.js') && !importPath.endsWith('.json') && !importPath.endsWith('.mjs')) {
      return match.replace(importPath, `${importPath}.js`);
    }
    return match;
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
}

try {
  processDirectory(serverDir);
  console.log('Module paths fixed successfully!');
} catch (error) {
  console.error('Error fixing module paths:', error);
  process.exit(1);
}