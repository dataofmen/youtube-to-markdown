# YouTube to Markdown Converter

Convert YouTube channel videos into NotebookLM-ready markdown files with AI-generated summaries.

## 🎯 Features

- **Channel Processing**: Convert entire YouTube channels to markdown
- **AI Summaries**: Google Gemini 3.0 Pro Preview generates summaries and key takeaways
- **NotebookLM Ready**: Automatic quarterly file bundling (50-file limit)
- **Real-time Progress**: Live updates via Server-Sent Events
- **Cost Control**: Monitor Gemini API usage
- **Date Filtering**: Optional date range for video selection
- **Web Interface**: Clean, responsive React UI

## 📋 Prerequisites

- Node.js 18+ and npm
- YouTube Data API v3 Key
- Google Gemini API Key

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Navigate to project directory
cd youtube-to-markdown

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure API Keys

Edit `backend/.env`:

```env
# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key_here

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.0-pro-preview

# Server Configuration
PORT=3001
NODE_ENV=development

# Processing Configuration
MAX_CONCURRENT_JOBS=3
MAX_VIDEOS_PER_JOB=500
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Use the Application

1. Open browser to `http://localhost:3000`
2. Enter YouTube channel URL (e.g., `https://www.youtube.com/@channelname`)
3. Optional: Set date filters
4. Click "Start Conversion"
5. Wait for processing (progress shown in real-time)
6. Download the generated ZIP file
7. Extract and upload `quarterly/` files to NotebookLM

## 📁 Output Structure

```
channel-name-YYYYMMDD-HHMMSS.zip
├── details/
│   ├── YYYYMMDD-video-title-1.md
│   ├── YYYYMMDD-video-title-2.md
│   └── ...
├── quarterly/
│   ├── YYYY-Q1.md (for NotebookLM - max 50 videos)
│   ├── YYYY-Q2.md
│   └── ...
└── index.md (overview with links)
```

## 📝 Markdown Format

Each video markdown includes:
- **Summary**: 3-sentence AI-generated summary
- **Key Takeaways**: Bullet points of main insights
- **Content**: Full transcript with timestamp links
- **Metadata**: Title, URL, publish date, duration

Example:
```markdown
# Video Title

**URL**: https://www.youtube.com/watch?v=VIDEO_ID
**Published**: 2024-01-15
**Duration**: 15.5 minutes

## Summary
[AI-generated 3-sentence summary]

## Key Takeaways
- [Key point 1]
- [Key point 2]
- [Key point 3]

## Content
[Formatted transcript with [timestamp links](URL?t=123)]
```

## 💰 Cost Estimation

- **YouTube API**: Free (10,000 units/day quota)
- **Google Gemini 3.0 Pro Preview**:
  - Pricing varies (Free tier available)
  - Pay-as-you-go pricing applies for higher usage

## 🔧 Configuration

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `YOUTUBE_API_KEY` | - | **Required**: YouTube Data API v3 key |
| `GEMINI_API_KEY` | - | **Required**: Google Gemini API key |
| `GEMINI_MODEL` | `gemini-3.0-pro-preview` | Gemini model to use |
| `PORT` | `3001` | Backend server port |
| `MAX_CONCURRENT_JOBS` | `3` | Max parallel conversion jobs |
| `MAX_VIDEOS_PER_JOB` | `500` | Max videos per conversion |

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

## 🎓 Usage with NotebookLM

1. Extract the downloaded ZIP file
2. Go to [NotebookLM](https://notebooklm.google.com)
3. Create a new notebook
4. Upload files from the `quarterly/` folder
   - Each quarterly file contains up to 50 videos
   - Upload multiple quarters as needed
5. Start asking questions about the videos!

## 🛠️ Development

### Project Structure

```
youtube-to-markdown/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── youtubeService.js    # YouTube Data API
│   │   │   ├── transcriptService.js # Transcript extraction
│   │   │   ├── geminiService.js     # AI summarization
│   │   │   └── markdownService.js   # Markdown generation
│   │   └── server.js                # Express API + SSE
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.jsx                  # Main React component
    │   ├── main.jsx                 # Entry point
    │   └── index.css                # Tailwind CSS
    ├── package.json
    └── vite.config.js
```

### API Endpoints

- `POST /api/convert` - Start conversion job
- `GET /api/jobs/:jobId` - Get job status
- `GET /api/jobs/:jobId/stream` - SSE real-time updates
- `GET /api/jobs/:jobId/download` - Download ZIP file

### Tech Stack

**Backend:**
- Node.js + Express
- YouTube Data API v3
- YouTube InnerTube API (transcripts)
- Google Gemini 3.0 Pro Preview
- Archiver (ZIP creation)
- Server-Sent Events (SSE)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Axios
- EventSource (SSE client)

## 📊 Monitoring

Watch the console for real-time processing logs:

```
🔍 Resolving channel ID from: https://www.youtube.com/@channelname
✅ Channel ID: UC...
📥 Fetching videos (page token: first)
  ✓ Video Title 1
  ✓ Video Title 2
✅ Total videos fetched: 25
🎬 Fetching transcript for: Video Title 1
  ✓ Transcript fetched (150 segments)
🤖 Generating AI summary for: Video Title 1
  ✓ Generated (2.5s, 1250 chars)
💰 Total Estimated Cost: $0.0000
```

## 🐛 Troubleshooting

**Issue**: "YouTube API quota exceeded"
- **Solution**: Wait 24 hours or use different API key

**Issue**: "Transcript not available"
- **Solution**: Video may have no captions; system skips and continues

**Issue**: "Gemini API error"
- **Solution**: Check API key and quota

**Issue**: "Port 3001 already in use"
- **Solution**: Change `PORT` in `.env` or kill existing process

## 📄 License

MIT

## 🙏 Credits

- Inspired by YouTube video: "Use Obsidian for PKM and Automation"
- Built for NotebookLM integration
- Uses YouTube Data API v3 and Google Gemini 3.0 Pro Preview
