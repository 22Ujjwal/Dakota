# OpenAI Dakota 🤖

**OpenAI Dakota** is the more sentient autonomy stack for the browser. It fuses OpenAI's multimodal reasoning with Browserbase cloud sessions, Playwright automation, realtime vision, and an expressive avatar so Dakota can see the page, act on it, and respond like a living teammate.

## 🌟 What makes Dakota different?
- **OpenAI-native cognition:** GPT-4o (and friends) drive planning, grounding, and evaluation for every step Dakota takes.
- **End-to-end web automation:** Browserbase + Playwright give Dakota resilient, observable browser sessions that are safe to share.
- **Vision in the loop:** A companion Python service performs frame-by-frame analysis so Dakota understands what is happening visually, not just in the DOM.
- **Live responsive avatar:** A WebGL avatar mirrors Dakota's state, gestures, and speech so collaborators feel the agent's presence in real time.
# OpenAI Dakota 🤖

**OpenAI Dakota** is the more sentient autonomy stack for the browser. It fuses OpenAI's multimodal reasoning with Browserbase cloud sessions, Playwright automation, realtime vision, and an expressive avatar so Dakota can see the page, act on it, and respond like a living teammate.

## 🌟 What makes Dakota different?
- **OpenAI-native cognition:** GPT-4o (and friends) drive planning, grounding, and evaluation for every step Dakota takes.
- **End-to-end web automation:** Browserbase + Playwright give Dakota resilient, observable browser sessions that are safe to share.
- **Vision in the loop:** A companion Python service performs frame-by-frame analysis so Dakota understands what is happening visually, not just in the DOM.
- **Live responsive avatar:** A WebGL avatar mirrors Dakota's state, gestures, and speech so collaborators feel the agent's presence in real time.
- **Human-friendly UI:** A glass-morphism control room delivers chat, actions, and observability without drowning you in dashboards.

## 🧠 Core capabilities

### Web automation autopilot
- Observe → Decide → Act → Evaluate loop with recovery, retries, and confidence scoring.
- Task library for flows such as research, form filling, and marketplace interactions.
- Screenshot capture, DOM introspection, and multi-step plans orchestrated automatically.

### Vision-grounded perception
- `computer_vision/` hosts a lightweight OpenCV + Python service for face and object detection.
- Dakota streams browser frames for visual validation, reinforcing GPT-4o's reasoning with pixels.
- Vision insights are surfaced inside chat so you can course-correct quickly.

### Live responsive avatar
- `public/avatarController.js` connects Socket.io events to a WebGL rig in `public/webgl/`.
- Lip-sync, idle loops, and intent-based animations make Dakota feel like a co-present teammate.
- Avatar mirrors automation state (observing, acting, asking for help) in real time.

### Shared cockpit experience
- Glass UI (`public/index.html`, `public/styles.css`) blends chat, browser feed, and telemetry.
- Activity timeline surfaces every action Dakota performs for auditability.
- Upload support lets you hand Dakota context files, prompts, and credentials securely.

## 🚀 Getting started

### Requirements
- Node.js 18+
- npm
- Python 3.10+ (for the optional vision service)
- Browserbase account + API key
- OpenAI API key with access to GPT-4o or GPT-4 Turbo family models

### 1. Clone the project
```bash
git clone <repository-url>
cd Dakota
```

### 2. Install Node dependencies
```bash
npm install
```

Key packages: `@browserbasehq/sdk`, `playwright-core`, `openai`, `socket.io`, `sharp`, `express`.

### 3. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` and add the following (replace placeholders with your credentials):
```bash
OPENAI_API_KEY=your_openai_api_key_here
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here
VISION_SERVICE_URL=http://localhost:5000          # Optional: Python vision service endpoint
PORT=3000
```
Dakota speaks OpenAI natively; only OpenAI credentials are required.

### 4. Launch Dakota
```bash
npm start
```
Visit `http://localhost:3000` to enter the command center.

### 5. (Optional) Start the vision service
```bash
cd computer_vision
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python start_vision_service.py
```
Dakota will automatically stream frames to `VISION_SERVICE_URL` when available.

## 🗂️ Project tour
```
Dakota/
├── lib/
│   ├── BrowserAgent.js             # Base automation engine (Browserbase + Playwright)
│   └── EnhancedBrowserAgent.js     # OpenAI-powered Observe → Decide → Act → Evaluate loop
├── computer_vision/
│   ├── main.py                     # Core detection logic
│   └── start_vision_service.py     # FastAPI wrapper for vision streaming
├── public/
│   ├── index.html / script.js      # Glass UI + Socket.io wiring
│   ├── avatarController.js         # Avatar state orchestration
│   ├── styles.css                  # Glass morphism styling
│   └── webgl/                      # WebGL avatar build
├── server.js                       # Express + Socket.io backend and agent router
├── uploads/                        # Secure file-drop for Dakota
└── package.json                    # Node project manifest
```

## 🧭 Orchestrating tasks with code
```javascript
const EnhancedBrowserAgent = require('./lib/EnhancedBrowserAgent');

(async () => {
  const agent = new EnhancedBrowserAgent({
   browserbaseApiKey: process.env.BROWSERBASE_API_KEY,
   browserbaseProjectId: process.env.BROWSERBASE_PROJECT_ID,
   openaiApiKey: process.env.OPENAI_API_KEY
  });

  await agent.initialize();

  const result = await agent.executeAutonomousTask(
   'Compare pricing tiers for popular video conferencing tools and summarise pros/cons'
  );

  console.log(result.summary);
  await agent.cleanup();
})();
```
Dakota handles observation, planning, action execution, evaluation, and transcript generation—your code only supplies intent.

## 🎛️ Configuration reference
| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | Required. Grants Dakota access to GPT-4o / GPT-4 Turbo for reasoning + vision. |
| `BROWSERBASE_API_KEY` | Required. Authenticates Browserbase cloud sessions. |
| `BROWSERBASE_PROJECT_ID` | Required. Routes sessions to your Browserbase project. |
| `VISION_SERVICE_URL` | Optional. URL for the Python vision service (defaults to disabled). |
| `SESSION_TIMEOUT` | Session lifetime in ms (default `300000`). |
| `MAX_RETRIES` | Maximum retries for a single action (default `3`). |
| `SCREENSHOT_QUALITY` | JPEG quality for captured frames (default `80`). |
| `ENABLE_LOGGING` | Enable verbose logs (`true`/`false`). |

## 🧪 Troubleshooting
- **OpenAI key errors:** Confirm `OPENAI_API_KEY` is present and the account has GPT-4o access.
- **Browserbase session failures:** Ensure the project ID and API key are correct and quotas are available.
- **Vision service offline:** Dakota will continue without it—start `start_vision_service.py` to re-enable perception.
- **Avatar not animating:** Check Socket.io connection in the browser console and confirm `avatarController.js` logs.

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes and add tests when relevant
4. Submit a pull request

## 📄 License
MIT License — see `LICENSE` for details.
