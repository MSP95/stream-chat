# Stream Chat

A real-time streaming chat application powered by Google Gemini API and Cloudflare Workers.

## Features

- Real-time text streaming from Gemini API
- Clean, responsive web interface
- Serverless backend using Cloudflare Workers
- TypeScript support

## Prerequisites

- Node.js (v18 or higher)
- pnpm (or npm)
- Cloudflare account
- Google AI API key

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd stream-chat
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file in the worker directory:

```bash
# apps/worker/.env
GEMINI_API_KEY=your_google_ai_api_key_here
```

## Local Development

### Option A: Local Development (Recommended for testing)

1. **Start the Cloudflare Worker locally:**

```bash
cd apps/worker
npx wrangler dev
```

This will start the worker locally and provide a URL like `http://localhost:8787`

2. **Update the worker URL in the web app:**

In `apps/web/src/App.tsx`, update the `WORKER_URL` constant:

```typescript
const WORKER_URL = 'http://localhost:8787/chat';
```

3. **Start the web application:**

```bash
cd apps/web
pnpm dev
```

The application will be available at `http://localhost:5173`

### Option B: Production Deployment

1. **Deploy the Cloudflare Worker:**

```bash
cd apps/worker
npx wrangler deploy
```

2. **Update the worker URL:**

In `apps/web/src/App.tsx`, update the `WORKER_URL` constant with your deployed worker URL:

```typescript
const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev/chat';
```

3. **Build and serve the web application:**

```bash
cd apps/web
pnpm build
pnpm preview
```

## Usage

1. Open the web application in your browser
2. Enter a prompt in the text area
3. Click "Send Prompt" to start streaming
4. Watch the response appear in real-time as Gemini generates it

## Project Structure

```
stream-chat/
├── apps/
│   ├── web/          # React frontend
│   └── worker/       # Cloudflare Worker backend
├── package.json      # Root package.json
└── README.md
```

## API

The worker exposes a single endpoint:

- `POST /chat` - Streams responses from Gemini API

Request body:
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Your prompt here"
        }
      ]
    }
  ]
}
```

## Development

### Quick Start (Local Development)

1. **Terminal 1 - Start the worker:**
```bash
cd apps/worker
npx wrangler dev
```

2. **Terminal 2 - Start the web app:**
```bash
cd apps/web
pnpm dev
```

3. **Update the worker URL in the web app** (if needed):
   - Open `apps/web/src/App.tsx`
   - Change `WORKER_URL` to `'http://localhost:8787/chat'`

### Environment Variables

For local development, create a `.env` file in the worker directory:

```bash
# apps/worker/.env
GEMINI_API_KEY=your_google_ai_api_key_here
```

### Building for Production

```bash
# Build web app
cd apps/web
pnpm build

# Deploy worker
cd apps/worker
npx wrangler deploy
```

## License

MIT
