# Auralist Client — Voice Controlled Task Manager Front-End

This is the front-end single page web application for **Auralist**, designed to allow users to manage their daily agendas completely through natural voice conversation. It is built using **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS v4**.

🔗 **Live Demo**: [voice-ai-task-manager-azam.netlify.app](https://voice-ai-task-manager-azam.netlify.app)

---

## 🎨 Key Features

1. **State-of-the-Art Voice Orb UI**:
   - Implements a premium, glowing glassmorphic orb that morphs styles dynamically based on the AI Agent's current state (`idle` | `listening` | `thinking` | `speaking`).
   - Micro-animations and hover transitions for an interactive, fluid feel.

2. **Web Speech API Integration**:
   - **Speech-to-Text (STT)**: Utilizes browser `SpeechRecognition` to capture live microphone input, displaying interim transcripts in real-time, sending finished utterances, and auto-canceling output on interruption.
   - **Text-to-Speech (TTS)**: Utilizes browser `speechSynthesis` to speak response text. Integrates user-configurable TTS voices via the settings panel.

3. **Real-time Synchronization**:
   - Maintains a WebSocket connection to the backend voice engine. Shows instant status notifications (e.g., connection indicators, thinking indicators).
   - Dynamically updates the Task Agenda layout immediately as the agent applies creations, edits, or deletions.

4. **Conversation HUD**:
   - Shows chronological scroll-to-bottom chat history.
   - Exposes system log terminals showing backend database operations and a quick session-reset trigger.

---

## 📁 Project Structure

```text
Frontend-Voice-Controlled-Task-Manager-Azam/
├── src/
│   ├── assets/              # Static files and global icons
│   ├── components/          # Reusable view components:
│   │   ├── auth/            # Auth forms (login, registration)
│   │   ├── dashboard/       # Dashboard widgets (Orb, HUD, Agenda)
│   │   ├── ui/              # Shadcn primitives (Button, Dialog, etc.)
│   ├── hooks/               # Custom React hooks (refactored):
│   │   ├── useSpeechSynthesis.ts   # Core TTS synthesiser
│   │   ├── useSpeechRecognition.ts # Continuous Speech-to-Text listeners
│   │   ├── useVoiceAgentWebSocket.ts # WS connection and message routing
│   │   └── useVoiceAgent.ts        # Coordinator orchestrating the sub-hooks
│   ├── lib/                 # Core utilities and REST client definitions
│   ├── screens/             # Root screens (Auth, Dashboard)
│   ├── App.tsx              # Routing and authorization setup
│   ├── index.css            # Base Tailwind and glassmorphism styles
│   └── main.tsx             # Application mount point
├── .env                     # Configuration variables (gitignored)
├── package.json             # NPM dependencies & scripts
├── tsconfig.json            # Compiler configurations
└── vite.config.ts           # Bundler config
```

---

## 🛠️ Refactored Architecture (Voice Module)

To enhance maintainability and readability, the central voice engine state has been modularized into separate, isolated React hooks:

- **[useSpeechSynthesis.ts](src/hooks/useSpeechSynthesis.ts)**: Configures TTS voice selection, parses incoming markdown formatting out of spoken text, and tracks the start/end of spoken responses.
- **[useSpeechRecognition.ts](src/hooks/useSpeechRecognition.ts)**: Configures continuous speech recognition, tracks microphone toggle status, manages silence timeouts (3.5 seconds), and feeds transcriptions forward.
- **[useVoiceAgentWebSocket.ts](src/hooks/useVoiceAgentWebSocket.ts)**: Manages clean socket connections, JWT token handshake authorization, automatic backoff reconnections, and payload message parsing.
- **[useVoiceAgent.ts](src/hooks/useVoiceAgent.ts)**: Serves as the central coordinator, connecting hooks, maintaining session state (chat logs, task objects, and logs), and avoiding stale closures using React mutable refs.

---

## 🛠️ Prerequisites & Setup

### Browser Support
>
> [!IMPORTANT]
> The Web Speech API is natively supported in **Google Chrome**, **Microsoft Edge**, and **Safari**. Ensure you use a supported browser and explicitly grant microphone permissions when prompted.

### 1. Install Dependencies

Run this command inside the frontend root directory:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the frontend root directory:

```ini
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

### 3. Run the Development Server

```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Build for Production

To bundle the static application for production:

```bash
npm run build
```

The optimized bundle will be compiled into the `dist/` directory.
