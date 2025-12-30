# Testing Guide

## Pre-Testing Checklist

### 1. Verify API Keys

```bash
cd backend
cat .env
```

Ensure the following are set:
- ✅ `YOUTUBE_API_KEY=AIzaSyDO0QdZn-4JHXO9U1SvsYxrzbFGxwNRzK8`
- ✅ `OPENAI_API_KEY=sk-605AAMuk77RrAg6c6OjqLA`
- ✅ `OPENAI_MODEL=gpt-4o-mini`
- ✅ `PORT=3001`

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

Expected output:
```
added 150 packages in 15s
```

## Test Execution Steps

### Step 1: Backend Server Test

**Terminal 1:**
```bash
cd backend
npm start
```

**Expected Output:**
```
🚀 Server running on port 3001
📁 Output directory ready: /path/to/backend/output
```

**Verify:**
- ✅ No error messages
- ✅ Server listening on port 3001
- ✅ Output directory created

### Step 2: Frontend Development Server Test

**Terminal 2:**
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**Verify:**
- ✅ Vite dev server running
- ✅ No compilation errors
- ✅ Accessible at http://localhost:3000

### Step 3: UI Functionality Test

**Open Browser:** `http://localhost:3000`

**Test Cases:**

#### TC-01: Page Load
- ✅ Page loads without errors
- ✅ Title: "📺 YouTube to Markdown"
- ✅ Input form visible
- ✅ Default channel URL populated

#### TC-02: Form Validation
1. Clear channel URL field
2. Click "🚀 Start Conversion"
3. **Expected:** Alert "Please enter a YouTube channel URL"

#### TC-03: Date Filters (Optional)
1. Set "Date From": `2024-01-01`
2. Set "Date To": `2024-12-31`
3. **Expected:** Dates accepted without error

### Step 4: End-to-End Conversion Test

**Test Channel:** `https://www.youtube.com/@Emmanueltrades`

#### Phase 1: Job Submission
1. Enter channel URL: `https://www.youtube.com/@Emmanueltrades`
2. Leave date filters empty
3. Click "🚀 Start Conversion"

**Expected Backend Logs:**
```
🔍 Resolving channel ID from: https://www.youtube.com/@Emmanueltrades
✅ Channel ID: UC...
📥 Fetching videos (page token: first)
  ✓ Video Title 1
  ✓ Video Title 2
  ...
```

**Expected Frontend:**
- ✅ Form disappears
- ✅ Progress screen appears
- ✅ "Converting Channel..." message
- ✅ Progress bar at 0%

#### Phase 2: Processing Progress
**Monitor Real-time Updates:**

1. **Fetching Videos**
   - Progress: 10-20%
   - Message: "Fetching channel videos..."

2. **Fetching Transcripts**
   - Progress: 20-60%
   - Message: "Fetching transcripts (X/Y)"
   - Video count updates in real-time

3. **Generating Summaries**
   - Progress: 60-90%
   - Message: "Generating AI summaries (X/Y)"
   - Cost counter updates

4. **Creating Files**
   - Progress: 90-95%
   - Message: "Generating markdown files..."

5. **Creating ZIP**
   - Progress: 95-100%
   - Message: "Creating ZIP archive..."

**Expected Metrics:**
- ✅ Total Videos: varies (e.g., 25)
- ✅ Processed: increments to match total
- ✅ Cost: increases (e.g., $0.1250)

#### Phase 3: Completion
**Expected:**
- ✅ Checkmark: "✅"
- ✅ Message: "Conversion Completed!"
- ✅ Results summary displayed
- ✅ Download button: "📥 Download ZIP File"
- ✅ Next steps instructions visible

**Verify Results:**
```
Total Videos: 25
Processed: 25
Detail Files: 25
Quarterly Files: 2
Total Cost: $0.1250
ZIP Size: 0.5 MB
```

#### Phase 4: Download Test
1. Click "📥 Download ZIP File"
2. **Expected:** Browser downloads ZIP file
3. **Filename format:** `emmanueltrades-YYYYMMDD-HHMMSS.zip`

#### Phase 5: ZIP Content Verification
```bash
unzip emmanueltrades-*.zip -d test-output
cd test-output
ls -la
```

**Expected Structure:**
```
details/
  20240115-video-title-1.md
  20240116-video-title-2.md
  ...
quarterly/
  2024-Q1.md
  2024-Q2.md
index.md
```

**Verify File Counts:**
```bash
ls details/*.md | wc -l    # Should match "Detail Files" count
ls quarterly/*.md | wc -l  # Should match "Quarterly Files" count
```

#### Phase 6: Markdown Quality Check
```bash
head -50 details/$(ls details/*.md | head -1)
```

**Expected Content:**
```markdown
# [Video Title]

**URL**: https://www.youtube.com/watch?v=...
**Published**: YYYY-MM-DD
**Duration**: X.X minutes

## Summary
[3 sentence AI-generated summary]

## Key Takeaways
- [Key point 1]
- [Key point 2]
- [Key point 3]

## Content
[Formatted transcript with timestamp links]
```

**Verify:**
- ✅ All metadata fields present
- ✅ Summary is coherent
- ✅ Key takeaways are bullet points
- ✅ Content has timestamp links format: `[text](URL?t=123)`

#### Phase 7: Quarterly File Check
```bash
cat quarterly/2024-Q1.md
```

**Expected:**
- ✅ Multiple video sections
- ✅ Each video has summary and key takeaways
- ✅ Videos grouped by publish date
- ✅ Max 50 videos per file

### Step 5: Error Handling Tests

#### TC-04: Invalid Channel URL
1. Enter: `https://www.youtube.com/watch?v=invalid`
2. Click "🚀 Start Conversion"
3. **Expected:**
   - Processing starts
   - Error state triggered
   - Message: "Conversion Failed"
   - Error details shown

#### TC-05: Network Interruption
1. Start conversion
2. Kill backend server mid-process
3. **Expected:**
   - SSE connection closes
   - Frontend shows last known state
   - No infinite loading

#### TC-06: Transcript Not Available
1. Convert channel with videos without captions
2. **Expected:**
   - Processing continues
   - Videos without transcripts get fallback message
   - Other videos process normally

### Step 6: Performance Tests

#### TC-07: Large Channel (50+ videos)
1. Test with channel having 50+ videos
2. **Monitor:**
   - ✅ Progress updates smoothly
   - ✅ No memory leaks
   - ✅ Completion time < 10 minutes for 50 videos

#### TC-08: Concurrent Jobs
1. Open 2 browser tabs
2. Start conversion in both
3. **Expected:**
   - Both jobs run independently
   - No interference
   - Both complete successfully

### Step 7: NotebookLM Integration Test

1. Go to [NotebookLM](https://notebooklm.google.com)
2. Create new notebook
3. Upload `quarterly/2024-Q1.md`
4. **Verify:**
   - ✅ File uploads successfully
   - ✅ Content is readable
   - ✅ Can ask questions about video content
5. Upload additional quarterly files if present
6. **Verify:**
   - ✅ All files accepted
   - ✅ Cross-video queries work

## Test Results Template

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** macOS/Windows/Linux

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-01: Page Load | ✅ PASS | |
| TC-02: Form Validation | ✅ PASS | |
| TC-03: Date Filters | ✅ PASS | |
| TC-04: Invalid URL | ✅ PASS | |
| TC-05: Network Error | ✅ PASS | |
| TC-06: No Transcript | ✅ PASS | |
| TC-07: Large Channel | ✅ PASS | 50 videos in 8 min |
| TC-08: Concurrent Jobs | ✅ PASS | |
| E2E: Full Conversion | ✅ PASS | 25 videos, $0.13 |
| NotebookLM Upload | ✅ PASS | |

## Common Issues and Solutions

### Issue: "Cannot find module"
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Issue: "Port 3001 already in use"
```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID [PID] /F
```

### Issue: "YouTube API quota exceeded"
- Wait 24 hours for quota reset
- Or use different API key

### Issue: "OpenAI API error"
- Verify API key is valid
- Check account has credits

### Issue: Frontend can't connect to backend
- Verify backend is running on port 3001
- Check `vite.config.js` proxy settings
- Check CORS configuration in `server.js`

## Success Criteria

All tests pass when:
- ✅ Application starts without errors
- ✅ UI is responsive and functional
- ✅ Conversion completes successfully
- ✅ ZIP file downloads correctly
- ✅ Markdown files have correct structure
- ✅ Content quality is good
- ✅ NotebookLM accepts files
- ✅ Error handling works properly
- ✅ Cost tracking is accurate

## Next Steps After Testing

1. ✅ **Documentation Complete**: README.md covers all usage
2. ✅ **Testing Guide**: This file provides test procedures
3. 🎯 **Ready for Production**: Deploy to hosting service
4. 📝 **User Feedback**: Gather feedback from real users
5. 🚀 **Iterate**: Add features based on usage patterns
