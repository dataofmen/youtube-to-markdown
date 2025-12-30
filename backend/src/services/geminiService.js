
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_API_KEY = process.env.GEMINI_API_KEY;
// Updated to use 2.5 Flash as it is more stable/available for this key
const MODEL_NAME = 'gemini-2.5-flash';

// Helper to get model instance
const getModel = (apiKey) => {
    const key = apiKey || DEFAULT_API_KEY;
    if (!key) {
        throw new Error('Gemini API Key is missing. Please provide it in the interface.');
    }
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: MODEL_NAME });
};

// ... (rest of the file until testGeminiKey)

/**
 * Test the Gemini API Key
 */
export async function testGeminiKey(apiKey) {
    try {
        const model = getModel(apiKey);
        const result = await model.generateContent('Say "Hello"');
        const response = await result.response;
        const text = response.text();
        return { success: true, message: 'Valid key! Connected to ' + MODEL_NAME };
    } catch (error) {
        console.error('Gemini Key Test Failed:', error.message);

        // Handle Quota Exceeded as a "Valid Key" but with warning
        if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
            return {
                success: true,
                message: `Key is valid, but quota exceeded for ${MODEL_NAME}. You may need to wait or upgrade plan.`
            };
        }

        // Handle Model Not Found - maybe try another model? 
        if (error.message.includes('404') && error.message.includes('not found')) {
            return {
                success: false,
                error: `Key valid but model ${MODEL_NAME} not accessible. Try a different key.`
            };
        }

        return { success: false, error: error.message };
    }
}

const SYSTEM_PROMPT = `You are a helpful assistant that creates structured summaries of video transcripts. The transcripts are from YouTube videos and include timestamps.

Your task is to:
1. Create a concise 3-sentence summary
2. Extract key learning points as bullet points
3. Format the full transcript with proper paragraphs and embedded timestamp links

Return your response in the following markdown format:

# Summary
[3 sentence summary]

# Key Takeaways
- [Key point 1]
- [Key point 2]
- [Key point 3]

# Content
[Full transcript formatted into paragraphs with timestamp links at the end of each paragraph like: [*](VIDEO_URL?t=SECONDS)]`;

/**
 * Generate AI summary for a video transcript
 */
export async function generateSummary(video, apiKey = null) {
    try {
        console.log(`  🤖 Generating AI summary for: ${video.title} using ${MODEL_NAME}`);

        // Skip if no transcript
        if (!video.transcript || video.transcript.length === 0) {
            console.log('  ⚠️  No transcript available, skipping AI summary');
            return {
                summary: 'Transcript not available for this video.',
                keyTakeaways: [],
                content: 'No transcript available.'
            };
        }

        // Build transcript text with timestamps
        const videoLink = video.link;
        let transcriptText = `${video.title}\n${videoLink}\n\n`;

        for (const entry of video.transcript) {
            const timestamp = Math.floor(entry.start);
            transcriptText += `[${timestamp}] ${entry.script}\n`;
        }

        // Call Gemini API
        const startTime = Date.now();

        // Construct the prompt
        const prompt = `${SYSTEM_PROMPT}\n\nTranscript:\n${transcriptText}`;

        const model = getModel(apiKey);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        // Calculate cost (approximate, placeholder as Gemini pricing varies)
        const inputChars = transcriptText.length;
        const outputChars = text.length;
        const cost = 0; // Keeping it simple for now

        console.log(`  ✓ Generated (${duration}s, ${text.length} chars)`);

        // Parse the response
        const summaryMatch = text.match(/# Summary\n([\s\S]*?)(?=\n# Key Takeaways|$)/);
        const takeawaysMatch = text.match(/# Key Takeaways\n([\s\S]*?)(?=\n# Content|$)/);
        const contentMatch = text.match(/# Content\n([\s\S]*?)$/);

        return {
            summary: summaryMatch ? summaryMatch[1].trim() : text.substring(0, 500) + '...',
            keyTakeaways: takeawaysMatch ? takeawaysMatch[1].trim().split('\n').filter(line => line.trim()) : [],
            content: contentMatch ? contentMatch[1].trim() : '',
            metadata: {
                cost,
                inputTokens: Math.ceil(inputChars / 4), // Approx
                outputTokens: Math.ceil(outputChars / 4), // Approx
                duration: parseFloat(duration)
            }
        };

    } catch (error) {
        console.error(`  ❌ Error generating summary:`, error.message);

        // Return fallback content
        return {
            summary: `This is a video titled "${video.title}". Transcript processing encountered an error.`,
            keyTakeaways: ['Transcript available but AI summary failed'],
            content: video.transcript.map(entry =>
                `[${entry.script}](${video.link}?t=${Math.floor(entry.start)})`
            ).join(' '),
            metadata: {
                cost: 0,
                error: error.message
            }
        };
    }
}

/**
 * Process multiple videos with AI summaries
 */
export async function generateSummaries(videos, apiKey, onProgress) {
    const results = [];
    let processed = 0;
    let totalCost = 0;

    for (const video of videos) {
        try {
            const aiResult = await generateSummary(video, apiKey);

            results.push({
                ...video,
                ...aiResult
            });

            if (aiResult.metadata && aiResult.metadata.cost) {
                totalCost += aiResult.metadata.cost;
            }

            processed++;
            if (onProgress) {
                onProgress({
                    processed,
                    total: videos.length,
                    current: video.title,
                    percentage: Math.round((processed / videos.length) * 100),
                    totalCost
                });
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`Failed to process ${video.videoId}:`, error.message);
            results.push(video); // Continue without AI summary
        }
    }

    console.log(`\n💰 Total Estimated Cost: $${totalCost.toFixed(4)}`);
    return { videos: results, totalCost };
}


