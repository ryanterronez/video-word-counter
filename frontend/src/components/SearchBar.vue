<template>
  <div class="search-bar">
    <input type="text" v-model="searchTerm" @input="limitInput" @keyup.enter="searchYouTube" placeholder="Enter search term" />
    <button @click="searchYouTube">Search</button>
    <p>{{ remainingCharacters }} characters remaining</p>
    <div v-if="videos.length">
      <h3>Search Results:</h3>
      <ul>
        <li v-for="video in videos" :key="video.id.videoId">
          <a @click.prevent="extractAudio(video.id.videoId, video.snippet.title)" href="#">{{ video.snippet.title }}</a>
        </li>
      </ul>
    </div>
    <div class="transcript-container">
      <button @click="getTranscript">Get Transcript</button>
      <h3>Transcript:</h3>
      <p>{{ transcript }}</p>
    </div>
    <div>
      <button @click="createCloud">Create Word Cloud</button>
      <div ref="wordCloudContainer" class="word-cloud"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

export default {
  data() {
    return {
      searchTerm: '',
      videos: [],
      channelId: 'UCP6GE0Xs1S15lxdN4fQakQQ',
      transcript: ''
    }
  },
  computed: {
    remainingCharacters() {
      return 250 - this.searchTerm.length;
    }
  },
  methods: {
    limitInput() {
      if (this.searchTerm.length > 250) {
        this.searchTerm = this.searchTerm.slice(0, 250);
      }
    },

    async searchYouTube() {
      // eslint-disable-next-line no-undef
      const apiKey = process.env.VUE_APP_YOUTUBE_API_KEY;
      const query = this.searchTerm;
      const channelId = this.channelId;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${apiKey}&channelId=${channelId}&maxResults=10`;

      try {
        const response = await axios.get(url);
        this.videos = response.data.items;
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
      }
    },

    async getTranscript() {
      // eslint-disable-next-line no-undef
      try {
        const response = await axios.get('http://localhost:3000/get-transcript');
        console.log('Response from backend:', response.data);
        this.transcript = response.data.results.transcripts[0].transcript;
        console.log(this.transcript);
      } catch (error) {
        console.error('Error extracting audio:', error);
      }
    },

    async extractAudio(videoId, title) {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log('Sending request to backend:', videoUrl);
      try {
        const response = await axios.post('http://localhost:3000/extract_audio', { video_url: videoUrl, video_title: title });
        console.log('Response from backend:', response.data);
        this.transcript = response.data.transcript;
        console.log(response.data.message);
      } catch (error) {
        console.error('Error extracting audio:', error);
      }
    },

    async createCloud() {
      let words;
      if (!this.transcript) {
        words = ["Hello", "world", "normally", "you", "want", "more", "words", "than", "this"]
        .map(function(d) {
        return {text: d, size: 10 + Math.random() * 90};
        });
      } else {
        words = this.transcript.split(/\s+/).map(word => ({ text: word, size: 10 + Math.random() * 90 }));
      }


    const layout = cloud()
        .size([600, 400])
        .words(words)
        .padding(5)
        .rotate(() => ~~(Math.random() * 2) * 90)
        .font('Impact')
        .fontSize(d => d.size)
        .on('end', this.drawCloud);

      layout.start();
    },
    drawCloud(words) {
      const container = this.$refs.wordCloudContainer;
      container.innerHTML = ''; // Clear previous content

      const svg = d3.select(container).append('svg')
        .attr('width', 600)
        .attr('height', 400);

      const g = svg.append('g')
        .attr('transform', 'translate(300,200)');

      g.selectAll('text')
        .data(words)
        .enter().append('text')
        .style('font-size', d => `${d.size}px`)
        .style('font-family', 'Impact')
        .style('fill', (d, i) => d3.schemeCategory10[i % 10])
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
        .text(d => d.text);
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px;
}

.transcript-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

input {
  width: 100%;
  max-width: 400px;
  padding: 10px 15px;
  margin: 10px 0;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 25px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  transition: all 0.3s ease;
}

input:focus {
  border-color: #007BFF;
  box-shadow: 0 2px 5px rgba(0, 123, 255, 0.5);
  outline: none;
}

button {
  padding: 10px 20px;
  margin: 10px 0;
  border: none;
  border-radius: 25px;
  background-color: #007BFF;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

p {
  font-size: 14px;
  color: #666;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin: 10px 0;
}

a {
  color: #007BFF;
  text-decoration: none;
  cursor: pointer;
}

a:hover {
  text-decoration: underline;
}
</style>