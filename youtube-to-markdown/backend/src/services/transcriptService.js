import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';

/**
 * Parse transcript XML to structured data
 */
function parseTranscriptXml(xmlString) {
  try {
    // Simple XML parsing without external dependencies
    const textMatches = xmlString.matchAll(/<text start="([^"]+)"[^>]*>([^<]+)<\/text>/g);
    const entries = [];

    for (const match of textMatches) {
      const start = parseFloat(match[1]);
      const text = match[2]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();

      if (text) {
        entries.push({ start, script: text });
      }
    }

    return entries;
  } catch (error) {
    console.error('Error parsing transcript XML:', error.message);
    return [];
  }
}

/**
 * Fetch YouTube transcript using InnerTube API
 */
export async function fetchTranscript(videoId, lang = 'auto') {
  try {
    console.log(`  📝 Fetching transcript for: ${videoId}`);

    // Validate video ID
    if (videoId.length > 11) {
      const match = videoId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (match && match.length > 1) {
        videoId = match[1];
      } else {
        throw new Error('Invalid YouTube video URL or ID');
      }
    }

    // Use YouTube's InnerTube API to fetch captions
    const response = await axios.post(
      'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      {
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240304.00.00',
            hl: 'en',
            gl: 'US',
            userAgent: USER_AGENT
          }
        },
        videoId: videoId,
        playbackContext: {
          contentPlaybackContext: {
            currentUrl: `/watch?v=${videoId}`,
            vis: 0,
            splay: false,
            autoCaptionsDefaultOn: false,
            autonavState: 'STATE_NONE',
            html5Preference: 'HTML5_PREF_WANTS',
            lactThreshold: -1
          }
        },
        racyCheckOk: false,
        contentCheckOk: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
          'Origin': 'https://www.youtube.com',
          'Referer': `https://www.youtube.com/watch?v=${videoId}`
        }
      }
    );

    const data = response.data;

    // Check if captions exist
    if (!data.captions || !data.captions.playerCaptionsTracklistRenderer) {
      console.log('  ⚠️  Transcript is disabled on this video');
      return [];
    }

    const captions = data.captions.playerCaptionsTracklistRenderer;

    if (!captions.captionTracks || captions.captionTracks.length === 0) {
      console.log('  ⚠️  No transcripts are available for this video');
      return [];
    }

    // Find the requested language or default to the first available
    let track;
    if (lang === 'auto') {
      // Prefer manual captions over auto-generated
      track = captions.captionTracks.find(t => !t.kind) || captions.captionTracks[0];
    } else {
      track = captions.captionTracks.find(t => t.languageCode === lang);
      if (!track) {
        const availableLangs = captions.captionTracks.map(t => t.languageCode).join(', ');
        console.log(`  ⚠️  No transcript in ${lang}. Available: ${availableLangs}`);
        track = captions.captionTracks[0]; // Fallback to first available
      }
    }

    if (!track) {
      console.log('  ⚠️  Could not find any suitable transcript');
      return [];
    }

    console.log(`  ✓ Found transcript in: ${track.languageCode}`);

    // Fetch the transcript XML
    const transcriptResponse = await axios.get(track.baseUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!transcriptResponse.data) {
      console.log('  ⚠️  Failed to fetch transcript data');
      return [];
    }

    // Parse and return transcript
    const transcript = parseTranscriptXml(transcriptResponse.data);
    console.log(`  ✓ Parsed ${transcript.length} transcript entries`);
    return transcript;

  } catch (error) {
    console.error(`  ❌ Error fetching transcript for ${videoId}:`, error.message);
    return []; // Return empty array instead of throwing to allow processing to continue
  }
}

/**
 * Fetch transcripts for multiple videos with progress tracking
 */
export async function fetchTranscripts(videos, onProgress) {
  const results = [];
  let processed = 0;

  for (const video of videos) {
    try {
      const transcript = await fetchTranscript(video.videoId);
      results.push({
        ...video,
        transcript
      });

      processed++;
      if (onProgress) {
        onProgress({
          processed,
          total: videos.length,
          current: video.title,
          percentage: Math.round((processed / videos.length) * 100)
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`Failed to fetch transcript for ${video.videoId}:`, error.message);
      // Continue with empty transcript
      results.push({
        ...video,
        transcript: []
      });
    }
  }

  return results;
}
