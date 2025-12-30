
import axios from 'axios';

const channelUrl = 'https://www.youtube.com/@SiliconValleyGirl';

async function testResolve() {
  console.log(`Testing URL: ${channelUrl}`);
  try {
    const response = await axios.get(channelUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    console.log('Status:', response.status);
    // console.log('Data preview:', response.data.substring(0, 500));
    
    const match = response.data.match(/"externalId":"(UC[\w-]+)"/);
    if (match) {
      console.log('Found ID:', match[1]);
    } else {
      console.log('ID NOT found in response');
      // Look for other patterns
      const otherMatch = response.data.match(/channelId" content="([a-zA-Z0-9_-]+)"/); // meta tag
      if (otherMatch) {
          console.log('Found ID via meta tag:', otherMatch[1]);
      } else {
        const browseId = response.data.match(/"browseId":"(UC[\w-]+)"/);
        if (browseId) {
             console.log('Found ID via browseId:', browseId[1]);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testResolve();
