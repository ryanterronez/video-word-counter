const express = require('express');
const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/extract_audio', async (req, res) => {
  const videoUrl = req.body.video_url;
  const outputDir = path.join(__dirname, 'downloads');
  const outputFile = path.join(outputDir, '%(title)s.%(ext)s');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const ytDlpWrap = new YtDlpWrap();

  try {
    await ytDlpWrap.execPromise([
      videoUrl,
      '-x',
      '--audio-format', 'mp3',
      '-o', outputFile
    ]);

    res.status(200).json({ message: 'Audio extracted successfully' });
  } catch (error) {
    console.error(`Error: ${error}`);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});