# 🎥 YouTube to Markdown Converter (Mac Desktop App)

[![Release](https://img.shields.io/github/v/release/dataofmen/youtube-to-markdown?style=flat-square&color=blue)](https://github.com/dataofmen/youtube-to-markdown/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Convert entire YouTube channels into high-quality, NotebookLM-ready Markdown files with AI-generated summaries. Now available as a native macOS application for a seamless experience.

---

## ✨ Features

- **🚀 Native Mac Experience**: Easy-to-use desktop application designed for macOS.
- **📥 Channel-to-Markdown**: Automatically convert all videos from a YouTube channel into structured Markdown.
- **🤖 AI-Powered Summaries**: Leverage **Google Gemini 1.5 Pro/Flash** to generate concise 3-sentence summaries and key takeaways for every video.
- **📂 NotebookLM Optimized**: 
  - Automatically bundles videos into quarterly files (e.g., `2024-Q1.md`).
  - Respects NotebookLM's 50-file limit by merging content efficiently.
- **🕒 Full Transcripts**: Includes timestamped links directly back to the YouTube video.
- **📊 Real-time Progress**: Monitor the conversion process with a live progress bar and status updates.
- **💰 Usage Insights**: Real-time estimation of Gemini API usage and costs.

---

## 🚀 Quick Start (Recommended)

### 1. Download
Go to the [**Releases**](https://github.com/dataofmen/youtube-to-markdown/releases) page and download the latest `.dmg` file.
- **Apple Silicon (M1/M2/M3)**: Choose `youtube-to-markdown-app-X.X.X-arm64.dmg`
- **Intel Mac**: Choose `youtube-to-markdown-app-X.X.X.dmg`
- **Universal**: Choose `youtube-to-markdown-app-X.X.X-universal.dmg`

### 2. Install
1. Open the `.dmg` file.
2. Drag **YouTube to Markdown** to your **Applications** folder.
3. Right-click the app and select **Open** (required for the first time on macOS).

### 3. Run
1. Open the app.
2. Enter your **YouTube Data API Key** and **Gemini API Key** (Settings/Configuration).
3. Paste a YouTube channel URL (e.g., `https://www.youtube.com/@dataofmen`).
4. Click **Start Conversion**.
5. Once complete, download the generated ZIP file containing your Markdown files.

---

## 🔑 Prerequisites (API Keys)

To use this app, you need two API keys from Google Cloud:

1.  **YouTube Data API v3 Key**: [Get it here](https://console.cloud.google.com/apis/library/youtube.googleapis.com)
2.  **Google Gemini API Key**: [Get it here](https://aistudio.google.com/app/apikey)

*Both APIs offer generous free tiers for personal usage.*

---

## 🛠️ Development & Building from Source

If you want to build the application manually or contribute:

### 1. Requirements
- Node.js (v18 or higher)
- npm

### 2. Setup
```bash
git clone https://github.com/dataofmen/youtube-to-markdown.git
cd youtube-to-markdown
npm install
npm run backend:install
npm run frontend:install
```

### 3. Run in Development Mode
```bash
npm run dev
```

### 4. Build the App
```bash
# Build frontend and package Mac app
npm run build:mac
```
The packaged app will be available in the `dist/` folder.

---

## 📁 Output Structure

The app generates a ZIP file with the following structure:
```
channel-name-timestamp.zip
├── details/
│   ├── 20240115-video-title.md      # Individual video notes
│   └── ...
├── quarterly/
│   ├── 2024-Q1.md                   # Bundled (max 50 videos) for NotebookLM
│   └── ...
└── index.md                         # Table of contents with links
```

---

## 📝 Markdown Format
Each video entry includes:
- **Title & Metadata**: URL, Publish Date, Duration.
- **Summary**: 3-sentence AI summary.
- **Key Takeaways**: Bullet points of main insights.
- **Content**: Full transcript with clickable [12:34](URL?t=754) timestamp links.

---

## 📄 License
MIT

## 🙏 Credits
- Inspired by and based on the original script by **Zsolt Viczián** from the video: [Turn any YouTube Channel into your AI Mentor](https://www.youtube.com/watch?v=l0cfhGwaAG8).
- Built for **NotebookLM** enthusiasts.
- Powered by **Google Gemini** and **YouTube Data API**.
