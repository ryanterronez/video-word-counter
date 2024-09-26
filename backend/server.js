const express = require('express');
const YtDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const path = require('path');
const DeepSpeech = require('deepspeech');
const wav = require('wav');
const Sox = require('sox-stream');

const app = express();
const port = 3000;

const MODEL_PATH = 'deepspeech-0.9.3-models.pbmm';
const SCORER_PATH = 'deepspeech-0.9.3-models.scorer';

const model = new DeepSpeech.Model(MODEL_PATH);
model.enableExternalScorer(SCORER_PATH);

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

    const audioFilePath = outputFile.replace('%(title)s', 'your_audio_file_name').replace('%(ext)s', 'mp3');
    const transcript = await transcribeAudio(audioFilePath);
    res.status(200).json({ message: 'Audio extracted and transcribed successfully', transcript });
  } catch (error) {
    console.error(`Error: ${error}`);
    res.status(500).json({ error: error.message });
  }
});

async function transcribeAudio(audioFilePath) {
  return new Promise((resolve, reject) => {
    const audioStream = fs.createReadStream(audioFilePath)
      .pipe(Sox({
        output: {
          bits: 16,
          rate: 16000,
          channels: 1,
          type: 'wav'
        }
      }))
      .pipe(new wav.Reader());

    let audioBuffer = [];

    audioStream.on('data', (data) => {
      audioBuffer.push(data);
    });

    audioStream.on('end', () => {
      audioBuffer = Buffer.concat(audioBuffer);
      const result = model.stt(audioBuffer);
      resolve(result);
    });

    audioStream.on('error', (error) => {
      reject(error);
    });
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});