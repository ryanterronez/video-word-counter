const express = require('express');
const cors = require('cors');
const YtDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const path = require('path');
const wav = require('wav');
const ffmpeg = require('fluent-ffmpeg');
const AWS = require('aws-sdk'); // Added line

const app = express();
const port = 3000;

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' }); // Update to your region

const transcribeService = new AWS.TranscribeService();

app.use(cors());
app.use(express.json());

app.post('/extract_audio', async (req, res) => {
  const videoUrl = req.body.video_url;
  const videoTitle = req.body.video_title;

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

    const audioFilePath = outputFile.replace('%(title)s', 'your_audio_file_name').replace('%(ext)s', 'mp3');
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`File not found: ${audioFilePath}`);
    }

    const transcript = await transcribeAudio(audioFilePath);
    res.status(200).json({ message: 'Audio extracted and transcribed successfully', transcript });
  } catch (error) {
    console.error(`Error: ${error}`);
    res.status(500).json({ error: error.message });
  }
});

async function transcribeAudio(audioFilePath) {
  return new Promise((resolve, reject) => {
    const tempWavPath = audioFilePath.replace('.mp3', '.wav');

    ffmpeg(audioFilePath)
      .toFormat('wav')
      .on('end', async () => {
        const audioStream = fs.createReadStream(tempWavPath);

        const params = {
          LanguageCode: 'en-US',
          Media: {
            MediaFileUri: `s3://your-bucket/${path.basename(tempWavPath)}`
          },
          TranscriptionJobName: `TranscriptionJob-${Date.now()}`,
          MediaFormat: 'wav',
          OutputBucketName: 'your-bucket'
        };

        try {
          await uploadToS3(tempWavPath, `your-bucket/${path.basename(tempWavPath)}`);
          const data = await transcribeService.startTranscriptionJob(params).promise();
          const jobName = data.TranscriptionJob.TranscriptionJobName;

          // Poll for job completion
          const checkJobStatus = async () => {
            const jobData = await transcribeService.getTranscriptionJob({ TranscriptionJobName: jobName }).promise();
            if (jobData.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
              const transcriptUri = jobData.TranscriptionJob.Transcript.TranscriptFileUri;
              const transcriptData = await axios.get(transcriptUri);
              resolve(transcriptData.data.results.transcripts[0].transcript);
            } else if (jobData.TranscriptionJob.TranscriptionJobStatus === 'FAILED') {
              reject(new Error('Transcription job failed'));
            } else {
              setTimeout(checkJobStatus, 5000);
            }
          };

          checkJobStatus();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      })
      .save(tempWavPath);
  });
}

async function uploadToS3(filePath, s3Key) {
  const s3 = new AWS.S3();
  const fileStream = fs.createReadStream(filePath);

  const params = {
    Bucket: 'your-bucket',
    Key: s3Key,
    Body: fileStream
  };

  return s3.upload(params).promise();
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});