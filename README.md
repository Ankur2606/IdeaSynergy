# IdeaSynergy

A collaborative brainstorming application that transcribes spoken ideas, analyzes them for themes, and generates creative prompts to inspire further ideation—all powered by the Granite-3.3-8B-Instruct model via the Watson X API.

![IdeaSynergy](https://github.com/user-attachments/assets/f90a9c87-95a6-4445-bb2c-724a1ab56f0e)

## Features

- **Real-time Collaboration**: Join rooms to brainstorm with team members
- **Speech-to-Text**: Record and transcribe your spoken ideas using Web Speech API
- **AI-Powered Analysis**: Analyze ideas for key themes and patterns
- **Creative Prompts**: Get AI-generated prompts to inspire further ideation
- **Idea Management**: Comment on and build upon ideas
- **Chat**: Communicate with room participants in real-time

## Browser Compatibility

IdeaSynergy uses the Web Speech API for voice transcription, which is supported in:
- Chrome/Edge (full support)
- Safari (requires user permission)
- Firefox (may have limited support)

For best results, use a Chromium-based browser (Chrome, Edge, Brave).

## Setup

### Prerequisites

- Node.js 16+ or Bun
- IBM Cloud account with API key for Granite API

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
bun install
```

3. Create `.env` file in the root directory and add your IBM Cloud API key:

```
# Server configuration
PORT=3001

# IBM Cloud API credentials
IBM_API_KEY=your_ibm_api_key_here

# WebSocket URL for frontend to connect to
VITE_WEBSOCKET_URL=ws://localhost:3001/ws
```

### Running the Application

#### Development Mode

Start the frontend development server:

```bash
npm run dev
# or
bun run dev
```

Start the backend server in a separate terminal:

```bash
npm run dev:server
# For building dist utils
npm run build
# or
bun run build
bun run dev:server
```

#### Production Mode

Build the application:

```bash
npm run build
# or
bun run build
```

Start the server:

```bash
npm run server
# or
bun run server
```

## Usage

1. Open the application in a **Chromium-based browser** (Chrome, Edge)
2. Create a new room or join an existing one with a room code
3. Click the microphone button to record your idea using Web Speech API
4. Allow microphone permissions when prompted
5. Your idea will be transcribed in the browser, analyzed by IBM Granite API, and displayed with themes and creative prompts
6. Comment on ideas to build upon them
7. Use the chat panel to communicate with other participants

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Web Speech API
- **Backend**: Node.js, Express.js, WebSockets
- **AI**: IBM Granite API (Granite-3.3-8B-Instruct model)

## Future Roadmap

### Notion Integration
- **Two-way Sync**: Seamlessly sync ideation sessions to Notion databases for further organization
- **Template Support**: Create customized Notion templates for different brainstorming methodologies
- **Automated Documentation**: Auto-generate structured documentation from brainstorming sessions

### Deep Research Capabilities
- **Academic Paper Analysis**: Integrate with research databases to validate ideas against existing research
- **Trend Analysis**: Connect with trend data sources to evaluate idea viability
- **Competitive Analysis**: Automated research on similar ideas or products in the market
- **Semantic Search**: Find connections between seemingly unrelated ideas across multiple sessions

### Advanced Analytics
- **Idea Evolution Tracking**: Visual representation of how ideas evolve over time
- **Contribution Metrics**: Track team member participation and idea development
- **Sentiment Analysis**: Gauge team enthusiasm for different concepts
- **Implementation Forecasting**: AI-powered suggestions on resources needed for implementation

### Enterprise Features
- **SSO Integration**: Enterprise authentication with major identity providers
- **Role-Based Access Control**: Granular permissions for different team members
- **Custom AI Training**: Train the AI on company-specific terminology and knowledge
- **Compliance Features**: Data retention policies and export capabilities

### Mobile Applications
- **Native Mobile Apps**: Dedicated iOS and Android applications for on-the-go ideation
- **Offline Mode**: Continue brainstorming without internet connectivity
- **Push Notifications**: Get alerted when teammates contribute to sessions

## Contributing

Contributions are welcome! Please check out our [contribution guidelines](CONTRIBUTING.md) before getting started.

## Deployment

IdeaSynergy can be deployed using Docker:

```bash
docker build -t ideasynergy .
docker run -p 3001:3001 -e IBM_API_KEY=your_key_here ideasynergy
```

Cloud deployment instructions coming soon.

## License

MIT

---

Created by Bhavya Pratap Singh Tomar, Team Leviathan
