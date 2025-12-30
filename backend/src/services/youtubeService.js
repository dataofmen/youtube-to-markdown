import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Extract channel ID from various YouTube URL formats
 */
function extractChannelId(url) {
  const patterns = [
    /youtube\.com\/channel\/(UC[\w-]+)/,
    /youtube\.com\/c\/([\w-]+)/,
    /youtube\.com\/@([\w-]+)/,
    /youtube\.com\/user\/([\w-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return { type: pattern.source.includes('UC') ? 'id' : 'username', value: match[1] };
  }

  throw new Error('Invalid YouTube channel URL format');
}

/**
 * Get channel ID from username or handle
 */
export async function resolveChannelId(channelUrl) {
  const { type, value } = extractChannelId(channelUrl);

  if (type === 'id') {
    return value;
  }

  // For @handle or /c/channel or /user/username, we need to resolve to channel ID
  try {
    const response = await axios.get(channelUrl);
    const match = response.data.match(/"externalId":"(UC[\w-]+)"/);
    if (match) {
      return match[1];
    }
  } catch (error) {
    console.error('Error resolving channel ID:', error.message);
  }

  throw new Error('Could not resolve channel ID from URL');
}

/**
 * Parse ISO 8601 duration to minutes
 */
function parseDurationToMinutes(duration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = duration.match(regex);

  if (!match) return 0;

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  return hours * 60 + minutes + seconds / 60;
}

/**
 * Get channel details (title, etc.)
 */
export async function getChannelDetails(channelId) {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        key: YOUTUBE_API_KEY,
        id: channelId,
        part: 'snippet'
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].snippet;
    }
    return null;
  } catch (error) {
    console.error('Error fetching channel details:', error.message);
    return null;
  }
}

/**
 * Fetch all videos from a YouTube channel
 */
export async function fetchChannelVideos(channelUrl, options = {}) {
  const { dateFrom, dateTo, maxResults = 500 } = options;

  try {
    console.log(`🔍 Resolving channel ID from: ${channelUrl}`);
    const channelId = await resolveChannelId(channelUrl);
    console.log(`✅ Channel ID: ${channelId}`);

    const videos = [];
    let nextPageToken = '';
    let totalFetched = 0;

    do {
      // Fetch video IDs from search endpoint
      const searchUrl = `${YOUTUBE_API_BASE}/search`;
      const searchParams = {
        key: YOUTUBE_API_KEY,
        channelId,
        part: 'snippet',
        type: 'video',
        maxResults: 50,
        order: 'date',
        pageToken: nextPageToken
      };

      console.log(`📥 Fetching videos (page token: ${nextPageToken || 'first'})`);
      const searchResponse = await axios.get(searchUrl, { params: searchParams });
      const searchData = searchResponse.data;

      nextPageToken = searchData.nextPageToken || '';

      // Filter out live broadcasts and get video IDs
      const videoIds = searchData.items
        .filter(item => item.snippet.liveBroadcastContent === 'none')
        .map(item => item.id.videoId);

      if (videoIds.length === 0) {
        console.log('⚠️  No more videos found');
        break;
      }

      // Fetch detailed video information
      const videosUrl = `${YOUTUBE_API_BASE}/videos`;
      const videosParams = {
        key: YOUTUBE_API_KEY,
        part: 'snippet,contentDetails',
        id: videoIds.join(',')
      };

      const videosResponse = await axios.get(videosUrl, { params: videosParams });
      const videosData = videosResponse.data;

      for (const video of videosData.items) {
        const publishedAt = new Date(video.snippet.publishedAt);

        // Apply date filters
        if (dateFrom && publishedAt < new Date(dateFrom)) continue;
        if (dateTo && publishedAt > new Date(dateTo)) continue;

        const videoData = {
          videoId: video.id,
          link: `https://www.youtube.com/watch?v=${video.id}`,
          title: video.snippet.title,
          publishedAt: video.snippet.publishedAt,
          duration: parseDurationToMinutes(video.contentDetails.duration),
          thumbnail: `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`,
          description: video.snippet.description,
          transcript: [] // Will be filled by transcript service
        };

        videos.push(videoData);
        totalFetched++;
        console.log(`  ✓ ${videoData.title}`);
      }

      // Check if we've reached the maximum
      if (totalFetched >= maxResults) {
        console.log(`⚠️  Reached maximum videos limit: ${maxResults}`);
        break;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } while (nextPageToken && totalFetched < maxResults);

    console.log(`✅ Total videos fetched: ${videos.length}`);
    return videos;

  } catch (error) {
    console.error('❌ Error fetching channel videos:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}
