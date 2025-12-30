import { useState, useEffect } from 'react';
import axios from 'axios';

// In Electron (production), we need full URL. In Vite dev, we can use proxy or full URL.
// Since server enables CORS, we can use full URL everywhere to be safe.
const API_BASE = 'http://localhost:3001';

function App() {
  const [channelUrl, setChannelUrl] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // API Key State
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isKeyTested, setIsKeyTested] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [keyTestMessage, setKeyTestMessage] = useState('');

  // Load API Key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
      // We assume it's valid if it was saved, or user can re-test
      setIsKeyTested(false);
    }
  }, []);

  const handleTestKey = async () => {
    setIsKeyTested(true);
    setKeyTestMessage('Testing...');
    setIsKeyValid(false);

    try {
      const response = await axios.post(`${API_BASE}/api/test-gemini`, {
        apiKey: geminiApiKey
      });

      if (response.data.success) {
        setIsKeyValid(true);
        setKeyTestMessage('✅ Key is valid!');
        localStorage.setItem('gemini_api_key', geminiApiKey);
      }
    } catch (error) {
      setIsKeyValid(false);
      setKeyTestMessage('❌ Invalid Key: ' + (error.response?.data?.error || error.message));
    }
  };

  // Connect to SSE for real-time updates
  useEffect(() => {
    if (!jobId) return;

    // Don't reconnect if already completed
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      return;
    }

    const eventSource = new EventSource(`${API_BASE}/api/jobs/${jobId}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setJobStatus(data);

      if (data.status === 'completed' || data.status === 'failed') {
        setIsProcessing(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!channelUrl.trim()) {
      alert('Please enter a YouTube channel URL');
      return;
    }

    setIsProcessing(true);
    setJobStatus(null);

    try {
      const response = await axios.post(`${API_BASE}/api/convert`, {
        channelUrl,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        language: 'auto',
        maxResults: 500,
        geminiApiKey // Send the key
      });

      setJobId(response.data.jobId);
    } catch (error) {
      console.error('Error starting conversion:', error);
      alert('Failed to start conversion: ' + (error.response?.data?.error || error.message));
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (jobStatus?.downloadUrl) {
      window.location.href = `${API_BASE}${jobStatus.downloadUrl}`;
    }
  };

  const handleReset = () => {
    setJobId(null);
    setJobStatus(null);
    setIsProcessing(false);
    setChannelUrl('');
    setDateFrom('');
    setDateTo(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              📺 YouTube to Markdown
            </h1>
            <p className="text-gray-600">
              Convert YouTube channels to NotebookLM-ready markdown files
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {jobStatus?.status === 'completed' ? (
              /* Completed State */
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-800">Conversion Completed!</h2>

                <div className="bg-gray-50 p-4 rounded-lg text-left">
                  <h3 className="font-semibold text-gray-900 mb-3">Results:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Videos:</span>
                      <span className="ml-2 font-semibold">{jobStatus.totalVideos}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Processed:</span>
                      <span className="ml-2 font-semibold">{jobStatus.processedVideos}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Detail Files:</span>
                      <span className="ml-2 font-semibold">{jobStatus.result?.stats?.detailFiles || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Quarterly Files:</span>
                      <span className="ml-2 font-semibold">{jobStatus.result?.stats?.quarterlyFiles || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="ml-2 font-semibold">${jobStatus.actualCost?.toFixed(4) || '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ZIP Size:</span>
                      <span className="ml-2 font-semibold">
                        {jobStatus.result?.zipSize ? (jobStatus.result.zipSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  📥 Download ZIP File
                </button>

                <button
                  onClick={() => {
                    setJobStatus(null);
                    setIsProcessing(false);
                    setChannelUrl('');
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  ← Start New Conversion
                </button>
              </div>
            ) : !isProcessing && !jobStatus ? (
              /* Input Form */
              <div className="space-y-6">

                {/* API Key Section */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <label className="block text-sm font-medium text-indigo-900 mb-2">
                    🔑 Google Gemini API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => {
                        setGeminiApiKey(e.target.value);
                        setIsKeyTested(false);
                        setIsKeyValid(false);
                        setKeyTestMessage('');
                      }}
                      placeholder="Enter your Gemini API Key"
                      className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={!geminiApiKey}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isKeyValid
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300'
                        }`}
                    >
                      {isKeyValid ? 'Valid' : 'Test Key'}
                    </button>
                  </div>
                  {keyTestMessage && (
                    <p className={`text-sm mt-2 ${isKeyValid ? 'text-green-600' : 'text-red-600'}`}>
                      {keyTestMessage}
                    </p>
                  )}
                  <p className="text-xs text-indigo-600 mt-2">
                    Need a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold">Get one here</a>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube Channel URL *
                    </label>
                    <input
                      type="text"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      placeholder="https://www.youtube.com/@channelname"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date From (Optional)
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date To (Optional)
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">What will be generated:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Individual markdown files for each video</li>
                      <li>• Quarterly summary files (for NotebookLM 50-file limit)</li>
                      <li>• AI-generated summaries and key takeaways</li>
                      <li>• Timestamp links for easy navigation</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={!geminiApiKey && !localStorage.getItem('gemini_api_key')}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${geminiApiKey
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    🚀 Start Conversion
                  </button>
                </form>
              </div>
            ) : jobStatus?.status === 'failed' ? (
              /* Failed State */
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-bold text-red-600">Conversion Failed</h2>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800">{jobStatus.error || 'Unknown error occurred'}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              /* Processing State */
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Converting Channel...
                  </h2>
                  <p className="text-gray-600">{jobStatus?.currentStep || 'Initializing...'}</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{jobStatus?.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-500 ease-out"
                      style={{ width: `${jobStatus?.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                {jobStatus && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {jobStatus.totalVideos > 0 && (
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600 block">Total Videos</span>
                        <span className="text-lg font-bold text-gray-800">{jobStatus.totalVideos}</span>
                      </div>
                    )}
                    {jobStatus.processedVideos > 0 && (
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600 block">Processed</span>
                        <span className="text-lg font-bold text-gray-800">{jobStatus.processedVideos}</span>
                      </div>
                    )}
                    {jobStatus.actualCost > 0 && (
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600 block">Cost So Far</span>
                        <span className="text-lg font-bold text-gray-800">${jobStatus.actualCost.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Loading Spinner */}
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            <p>Powered by YouTube Data API v3, Google Gemini 3.0 Pro Preview, and NotebookLM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
