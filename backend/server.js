const express = require('express');
const cors = require('cors');
const YtDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const axios = require('axios');
require('dotenv').config()

const app = express();
const port = 3000;
const s3Bucket = 'audio-transcription-node-20';

const s3Client = new S3Client({ region: 'us-east-2' });
const transcribeClient = new TranscribeClient({ region: 'us-east-2' });

app.use(cors());
app.use(express.json());

app.post('/extract_audio', async (req, res) => {
  const videoUrl = req.body.video_url;
  const videoTitle = req.body.video_title;

  const audioFilePath = await extractAudio(videoUrl, videoTitle);
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`File not found: ${audioFilePath}`);
  }

  if (process.env.VUE_APP_LOCAL) {
    console.log('Local mode, skipping transcription');
    res.status(200).json({ message: 'Local mode, skipping transcription' });
  } else {
  const transcript = await transcribeAudio(audioFilePath);
  res.status(200).json({ message: 'Audio extracted and transcribed successfully', transcript });
  }
});

async function extractAudio(videoUrl, videoTitle) {
  const outputDir = path.join(__dirname, 'downloads');
  const outputFile = path.join(outputDir, `${videoTitle}.mp3`);

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
  } catch (error) {
    console.error(`Error: ${error}`);
    throw error;
  }
  const audioFilePath = outputFile.replace('%(title)s', 'your_audio_file_name').replace('%(ext)s', 'mp3');

  return audioFilePath;
}

async function transcribeAudio(audioFilePath) {
  return new Promise((resolve, reject) => {
    const tempWavPath = audioFilePath.replace('.mp3', '.wav');

    ffmpeg(audioFilePath)
      .toFormat('wav')
      .on('end', async () => {

        const s3Key = `audio/${path.basename(tempWavPath)}`;
        await uploadToS3(tempWavPath, s3Key);

        const params = {
          LanguageCode: 'en-US',
          Media: {
            MediaFileUri: `s3://${s3Bucket}/${s3Key}`
          },
          TranscriptionJobName: `TranscriptionJob-${Date.now()}`,
          MediaFormat: 'wav',
        };

        try {
          const data = await transcribeClient.send(new StartTranscriptionJobCommand(params));
          const jobName = data.TranscriptionJob.TranscriptionJobName;
        
          const checkJobStatus = async () => {
            const jobData = await transcribeClient.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
            if (jobData.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
              const transcriptUri = jobData.TranscriptionJob.Transcript.TranscriptFileUri;
              console.log(`Transcript URI: ${transcriptUri}`);
              try {
                const transcriptData = await axios.get(transcriptUri);
                resolve(transcriptData.data.results.transcripts[0].transcript);
              } catch (fetchError) {
                console.error(`Error fetching transcript: ${fetchError.message}`);
                reject(fetchError);
              }
            } else if (jobData.TranscriptionJob.TranscriptionJobStatus === 'FAILED') {
              reject(new Error('Transcription job failed'));
            } else {
              setTimeout(checkJobStatus, 5000);
            }
          };
        
          checkJobStatus();
        } catch (error) {
          console.error(`Error starting transcription job: ${error.message}`);
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      })
      .save(tempWavPath);
  });
}

app.get('/get-transcript', (req, res) => {
  getTranscript(req, res);
});

async function getTranscript(req, res) {
  if (process.env.VUE_APP_LOCAL) {
    console.log('Local mode, grabbing local JSON file');
    const jsonFilePath = path.join(__dirname, 'downloads/asrOutput.json')
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading JSON file: ${err.message}`);
        res.status(500).json({ error: 'Failed to read JSON file' });
      }

      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (parseError) {
        console.error(`Error parsing JSON file: ${parseError.message}`);
        res.status(500).json({ error: 'Failed to parse JSON file' });
      }
    });
  } else {
    res.status(200).json({ error: 'Local mode not enabled, functionality not yet implemented' });
    }
}

async function uploadToS3(filePath, s3Key) {
  const fileStream = fs.createReadStream(filePath);

  const params = {
    Bucket: s3Bucket,
    Key: s3Key,
    Body: fileStream
  };

  return s3Client.send(new PutObjectCommand(params));
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});