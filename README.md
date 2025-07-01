# donna-chat

## Prerequisites

- **Node.js ≥ 18** (includes `npm`)

## Getting Started

1. **Clone the repo** and move into the project folder
   ```bash
   git clone https://github.com/tahahasan7/donna-chat.git
   cd donna-chat
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Add your Gemini API key**

   1. Visit <https://aistudio.google.com/apikey> and create a new API key.
   2. In the root of the project (same folder as `package.json`), create a file called `.env` and add the following line:
      ```dotenv
      GEMINI_API_KEY=YOUR_API_KEY_HERE
      ```

   > **Note**: the server will refuse to start if the `GEMINI_API_KEY` environment variable is missing or invalid.

## Running the App

The project contains **two processes**:

- the **frontend** (React/Vite)
- the **backend API** (Express) that proxies requests to Gemini so your API key is never exposed in the browser

For fast development you can start both of them together:

```bash
npm run dev:all
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3000>

If you prefer, you can run them independently:

```bash
# In one terminal
npm run dev        # starts Vite on port 5173

# In another terminal
npm run server     # starts the Express API on port 3000
```
