import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { fetchChannelVideos, getChannelDetails, resolveChannelId } from './services/youtubeService.js';
import { fetchTranscripts } from './services/transcriptService.js';
import { generateSummaries, testGeminiKey } from './services/geminiService.js';
import { generateMarkdownFiles } from './services/markdownService.js';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory job storage (in production, use Redis or database)
const jobs = new Map();

// SSE connections for real-time updates
const sseConnections = new Map();

/**
 * Send SSE update to client
 */
function sendSSEUpdate(jobId, data) {
  const connections = sseConnections.get(jobId) || [];
  const message = `data: ${JSON.stringify(data)}\n\n`;

  connections.forEach(res => {
    res.write(message);
  });
}

/**
 * Update job progress
 */
function updateJobProgress(jobId, updates) {
  const job = jobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
    sendSSEUpdate(jobId, job);
  }
}

/**
 * Process conversion job
 */
async function processConversionJob(jobId, channelUrl, options = {}) {
  try {
    const job = jobs.get(jobId);
    if (!job) return;

    // Step 1: Fetch videos
    updateJobProgress(jobId, {
      status: 'processing',
      currentStep: 'Fetching video list from YouTube...',
      progress: 10
    });



    // Fetch channel details to get the name
    const channelId = await resolveChannelId(channelUrl);
    const channelDetails = await getChannelDetails(channelId);
    if (channelDetails) {
      updateJobProgress(jobId, { channelTitle: channelDetails.title });
    }

    const videos = await fetchChannelVideos(channelUrl, {
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      maxResults: options.maxResults || 500
    });

    updateJobProgress(jobId, {
      totalVideos: videos.length,
      progress: 20,
      currentStep: `Found ${videos.length} videos`
    });

    // Step 2: Fetch transcripts
    updateJobProgress(jobId, {
      currentStep: 'Extracting transcripts...',
      progress: 25
    });

    const videosWithTranscripts = await fetchTranscripts(videos, (progressData) => {
      updateJobProgress(jobId, {
        currentStep: `Extracting transcripts: ${progressData.current}`,
        progress: 25 + Math.floor(progressData.percentage * 0.25),
        processedVideos: progressData.processed
      });
    });

    // Step 3: Generate AI summaries
    updateJobProgress(jobId, {
      currentStep: 'Generating AI summaries...',
      progress: 50
    });

    const { videos: processedVideos, totalCost } = await generateSummaries(
      videosWithTranscripts,
      options.geminiApiKey,
      (progressData) => {
        updateJobProgress(jobId, {
          currentStep: `Generating summaries: ${progressData.current}`,
          progress: 50 + Math.floor(progressData.percentage * 0.35),
          processedVideos: progressData.processed,
          actualCost: progressData.totalCost
        });
      }
    );

    // Step 4: Generate markdown files
    updateJobProgress(jobId, {
      currentStep: 'Generating markdown files...',
      progress: 85
    });

    const outputPath = path.join(__dirname, '..', 'output', jobId);
    const result = await generateMarkdownFiles(processedVideos, outputPath);

    // Step 5: Create ZIP file
    updateJobProgress(jobId, {
      currentStep: 'Creating ZIP archive...',
      progress: 95
    });

    const zipPath = path.join(__dirname, '..', 'output', `${jobId}.zip`);
    await createZipArchive(outputPath, zipPath);

    // Job completed
    updateJobProgress(jobId, {
      status: 'completed',
      currentStep: 'Conversion completed!',
      progress: 100,
      completedAt: new Date().toISOString(),
      actualCost: totalCost,
      downloadUrl: `/api/jobs/${jobId}/download`,
      result: {
        ...result,
        zipPath,
        zipSize: (await fs.promises.stat(zipPath)).size
      }
    });

  } catch (error) {
    console.error('Job processing error:', error);
    updateJobProgress(jobId, {
      status: 'failed',
      error: error.message,
      progress: 0
    });
  }
}

/**
 * Create ZIP archive of output folder
 */
async function createZipArchive(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✓ ZIP created: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// ==================== API ROUTES ====================

/**
 * POST /api/convert
 * Start a new conversion job
 */
app.post('/api/convert', async (req, res) => {
  try {
    const { channelUrl, dateFrom, dateTo, language, maxResults, geminiApiKey } = req.body;

    if (!channelUrl) {
      return res.status(400).json({ error: 'Channel URL is required' });
    }

    // Create new job
    const jobId = uuidv4();
    const job = {
      id: jobId,
      channelUrl,
      status: 'pending',
      progress: 0,
      totalVideos: 0,
      processedVideos: 0,
      estimatedCost: 0,
      actualCost: 0,
      createdAt: new Date().toISOString(),
      currentStep: 'Initializing...'
    };

    jobs.set(jobId, job);

    // Start processing in background
    setTimeout(() => {
      processConversionJob(jobId, channelUrl, {
        dateFrom,
        dateTo,
        language,
        maxResults,
        geminiApiKey
      });
    }, 100);

    res.json({
      jobId,
      status: 'pending',
      message: 'Conversion job started'
    });

  } catch (error) {
    console.error('Error starting conversion:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/test-gemini
 * Test the Gemini API Key
 */
app.post('/api/test-gemini', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API Key is required' });
    }

    const result = await testGeminiKey(apiKey);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs/:jobId
 * Get job status
 */
app.get('/api/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

/**
 * GET /api/jobs/:jobId/stream
 * SSE endpoint for real-time job updates
 */
app.get('/api/jobs/:jobId/stream', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add this connection to the job's connections
  if (!sseConnections.has(jobId)) {
    sseConnections.set(jobId, []);
  }
  sseConnections.get(jobId).push(res);

  // Send initial state
  res.write(`data: ${JSON.stringify(job)}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    const connections = sseConnections.get(jobId) || [];
    const index = connections.indexOf(res);
    if (index > -1) {
      connections.splice(index, 1);
    }
  });
});

/**
 * GET /api/jobs/:jobId/download
 * Download the generated ZIP file
 */
app.get('/api/jobs/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job not completed yet' });
    }

    const zipPath = path.join(__dirname, '..', 'output', `${jobId}.zip`);

    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ error: 'ZIP file not found' });
    }

    let filename = 'youtube-markdown.zip';

    if (job.channelTitle) {
      const sanitizedTitle = job.channelTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const now = new Date();
      const year = now.getFullYear();
      const quarter = Math.floor((now.getMonth() + 3) / 3);
      filename = `${sanitizedTitle}_${year}_Q${quarter}.zip`;
    }

    res.download(zipPath, filename);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeJobs: jobs.size
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n✅ Ready to convert YouTube channels to Markdown!\n`);
});
