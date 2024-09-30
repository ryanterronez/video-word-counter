const express = require('express');
const cors = require('cors');
const YtDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const path = require('path');
const wav = require('wav');
const ffmpeg = require('fluent-ffmpeg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const axios = require('axios');

const app = express();
const port = 3000;

// Configure AWS SDK v3 clients
const s3Client = new S3Client({ region: 'us-east-2' });
const transcribeClient = new TranscribeClient({ region: 'us-east-2' });

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

        const s3Key = `audio/${path.basename(tempWavPath)}`;
        await uploadToS3(tempWavPath, s3Key);

        const params = {
          LanguageCode: 'en-US',
          Media: {
            MediaFileUri: `s3://audio-transcription-node-20/${s3Key}`
          },
          TranscriptionJobName: `TranscriptionJob-${Date.now()}`,
          MediaFormat: 'wav',
        };

        try {
          const data = await transcribeClient.send(new StartTranscriptionJobCommand(params));
          const jobName = data.TranscriptionJob.TranscriptionJobName;
        
          // Poll for job completion
          const checkJobStatus = async () => {
            const jobData = await transcribeClient.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
            if (jobData.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
              const transcriptUri = jobData.TranscriptionJob.Transcript.TranscriptFileUri;
              console.log(`Transcript URI: ${transcriptUri}`); // Debugging: Log the transcript URI
              try {
                const transcriptData = await axios.get(transcriptUri);
                resolve(transcriptData.data.results.transcripts[0].transcript);
              } catch (fetchError) {
                console.error(`Error fetching transcript: ${fetchError.message}`); // Debugging: Log fetch error
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
          console.error(`Error starting transcription job: ${error.message}`); // Debugging: Log start job error
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
  const fileStream = fs.createReadStream(filePath);

  const params = {
    Bucket: 'audio-transcription-node-20',
    Key: s3Key,
    Body: fileStream
  };

  return s3Client.send(new PutObjectCommand(params));
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});