import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sanitize filename by removing invalid characters
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[\\/:*?"<>#^\[\]|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200); // Limit length
}

/**
 * Add timestamp links to description
 */
function addTimestampLinks(description, baseURL) {
  if (!description) return '';

  const timestampRegex = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g;

  return description.replace(timestampRegex, (match, p1, p2, p3) => {
    let totalSeconds = parseInt(p1) * 60 + parseInt(p2);
    if (p3) {
      totalSeconds = parseInt(p1) * 3600 + parseInt(p2) * 60 + parseInt(p3);
    }
    return `[${match}](${baseURL}?t=${totalSeconds})`;
  });
}

/**
 * Generate markdown content for a single video
 */
function generateVideoMarkdown(video) {
  const createdDate = new Date(video.publishedAt).toISOString().split('T')[0];
  const minutes = Math.floor(video.duration);
  const seconds = String(Math.round((video.duration - minutes) * 60)).padStart(2, '0');

  let markdown = '';

  // Header
  markdown += `**Created**:: ${createdDate}\n`;
  markdown += `**Link**:: ${video.link}\n`;
  markdown += `**Duration**:: ${minutes}:${seconds}\n\n`;

  // Embedded video
  markdown += `![${video.title}](${video.link})\n\n`;

  // Summary (if available)
  if (video.summary) {
    markdown += `# Summary\n${video.summary}\n\n`;
  }

  // Key Takeaways (if available)
  if (video.keyTakeaways && video.keyTakeaways.length > 0) {
    markdown += `# Key Takeaways\n`;
    video.keyTakeaways.forEach(takeaway => {
      markdown += `${takeaway}\n`;
    });
    markdown += '\n';
  }

  // Content (if available)
  if (video.content) {
    markdown += `# Content\n${video.content}\n\n`;
  }

  // YouTube Details
  markdown += `# YouTube Details\n\n`;
  markdown += `## YouTube Description\n\n`;

  const descriptionWithLinks = addTimestampLinks(
    video.description
      .replace(/([^\n])\n--/g, '$1\n\n--')
      .replace(/--\n([^\n])/g, '--\n\n$1'),
    video.link
  );
  markdown += `${descriptionWithLinks}\n\n`;

  // Original Transcript
  markdown += `## YouTube Transcript\n\n`;
  if (video.transcript && video.transcript.length > 0) {
    const transcriptText = video.transcript
      .map(entry => `[${entry.script}](${video.link}?t=${Math.floor(entry.start)})`)
      .join(' ');
    markdown += `${transcriptText}\n\n`;
  } else {
    markdown += `*Transcript not available for this video.*\n\n`;
  }

  return markdown;
}

/**
 * Generate quarterly markdown file
 */
function generateQuarterlyMarkdown(videos) {
  let markdown = '';

  videos.forEach((video, index) => {
    if (index > 0) {
      markdown += '\n---\n\n';
    }

    markdown += `# ${video.title}\n\n`;
    markdown += `[Video](${video.link})\n\n`;
    markdown += `![thumbnail|500](${video.thumbnail})\n\n`;
    markdown += generateVideoMarkdown(video);
  });

  return markdown;
}

/**
 * Group videos by quarter
 */
function groupByQuarter(videos) {
  const grouped = {};

  videos.forEach(video => {
    const date = new Date(video.publishedAt);
    const year = date.getFullYear();
    const quarter = Math.floor((date.getMonth() + 3) / 3);
    const key = `${year}-Q${quarter}`;

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(video);
  });

  // Sort videos within each quarter by date (newest first)
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  });

  return grouped;
}

/**
 * Generate index markdown
 */
function generateIndexMarkdown(quarterlyGroups, detailsPath, quarterlyPath) {
  let markdown = '# Video Index\n\n';

  const years = [...new Set(Object.keys(quarterlyGroups).map(key => key.split('-')[0]))];
  years.sort((a, b) => b - a); // Newest year first

  years.forEach(year => {
    markdown += `\n# ${year}\n`;

    for (let q = 4; q >= 1; q--) {
      const key = `${year}-Q${q}`;
      if (!quarterlyGroups[key]) continue;

      const quarterlyFile = path.join(quarterlyPath, `${key}.md`);
      markdown += `\n## [Q${q}](${quarterlyFile})\n`;

      quarterlyGroups[key].forEach(video => {
        const filename = sanitizeFilename(video.title) + '.md';
        const filepath = path.join(detailsPath, filename);
        markdown += `- [${video.title}](${filepath})\n`;
      });
    }
  });

  return markdown;
}

/**
 * Generate all markdown files for a channel
 */
export async function generateMarkdownFiles(videos, outputPath) {
  try {
    console.log(`\n📝 Generating markdown files...`);

    // Create directories
    const detailsPath = path.join(outputPath, 'details');
    const quarterlyPath = path.join(outputPath, 'quarterly');

    await fs.mkdir(detailsPath, { recursive: true });
    await fs.mkdir(quarterlyPath, { recursive: true });

    console.log(`  📁 Output directory: ${outputPath}`);
    console.log(`  📁 Details: ${detailsPath}`);
    console.log(`  📁 Quarterly: ${quarterlyPath}`);

    // Generate individual video files
    console.log(`\n  📄 Generating ${videos.length} individual files...`);
    for (const video of videos) {
      const filename = sanitizeFilename(video.title) + '.md';
      const filepath = path.join(detailsPath, filename);
      const content = generateVideoMarkdown(video);

      await fs.writeFile(filepath, content, 'utf-8');
    }
    console.log(`  ✓ Generated ${videos.length} detail files`);

    // Group by quarter and generate quarterly files
    console.log(`\n  📄 Generating quarterly files...`);
    const quarterlyGroups = groupByQuarter(videos);
    const quarterKeys = Object.keys(quarterlyGroups).sort().reverse();

    for (const key of quarterKeys) {
      const filename = `${key}.md`;
      const filepath = path.join(quarterlyPath, filename);
      const content = generateQuarterlyMarkdown(quarterlyGroups[key]);

      await fs.writeFile(filepath, content, 'utf-8');
      console.log(`  ✓ ${key}.md (${quarterlyGroups[key].length} videos)`);
    }

    // Generate index file
    console.log(`\n  📄 Generating index file...`);
    const indexPath = path.join(outputPath, 'index.md');
    const indexContent = generateIndexMarkdown(quarterlyGroups, 'details', 'quarterly');
    await fs.writeFile(indexPath, indexContent, 'utf-8');
    console.log(`  ✓ index.md`);

    console.log(`\n✅ All markdown files generated successfully!`);

    return {
      detailsPath,
      quarterlyPath,
      indexPath,
      stats: {
        totalVideos: videos.length,
        detailFiles: videos.length,
        quarterlyFiles: quarterKeys.length,
        quarters: quarterKeys
      }
    };

  } catch (error) {
    console.error('❌ Error generating markdown files:', error);
    throw error;
  }
}
