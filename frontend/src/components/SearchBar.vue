<template>
  <div class="search-bar">
    <div class="form-group">
      <label for="channel-id">Channel ID</label>
      <input
        type="text"
        id="channel-id"
        v-model="channelId"
        @input="limitInput"
        placeholder="Enter channel id"
      />
    </div>
    <div class="form-group">
      <label for="video-search-term">Video Search Term</label>
      <input
        type="text"
        id="video-search-term"
        v-model="videoSearchTerm"
        @input="limitInput"
        @keyup.enter="searchYouTube"
        placeholder="Enter search term"
      />
    </div>
    <button @click="searchYouTube">Search</button>
    <p>{{ remainingCharacters }} characters remaining</p>
    <div v-if="videos.length">
      <h3>Search Results:</h3>
      <ul>
        <li v-for="video in displayedVideos" :key="video.id.videoId">
          <a
            @click.prevent="extractAudio(video.id.videoId, video.snippet.title)"
            href="#"
            >{{ video.snippet.title }}</a
          >
        </li>
      </ul>
      <button v-if="!showAllVideos" @click="showAllVideos = true">
        Show All Videos
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      videoSearchTerm: '',
      videos: [],
      channelId: 'UCP6GE0Xs1S15lxdN4fQakQQ',
      searchCharLimit: 50,
      showAllVideos: false,
    }
  },
  computed: {
    remainingCharacters() {
      return this.searchCharLimit - this.videoSearchTerm.length
    },
    displayedVideos() {
      return this.showAllVideos ? this.videos : this.videos.slice(0, 5)
    },
  },
  methods: {
    limitInput() {
      if (this.videoSearchTerm.length > this.searchCharLimit) {
        this.videoSearchTerm = this.videoSearchTerm.slice(
          0,
          this.searchCharLimit
        )
      }
    },

    async searchYouTube() {
      // eslint-disable-next-line no-undef
      const apiKey = process.env.VUE_APP_YOUTUBE_API_KEY
      const query = this.videoSearchTerm
      const channelId = this.channelId
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${apiKey}&channelId=${channelId}&maxResults=10`

      try {
        const response = await axios.get(url)
        this.videos = response.data.items
      } catch (error) {
        console.error('Error fetching YouTube videos:', error)
      }
    },

    async extractAudio(videoId, title) {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
      console.log('Sending request to backend:', videoUrl)
      try {
        const response = await axios.post(
          'http://localhost:3000/extract_audio',
          { video_url: videoUrl, video_title: title }
        )
        console.log('Response from backend:', response.data)
        this.transcript = response.data.transcript
        console.log(response.data.message)
      } catch (error) {
        console.error('Error extracting audio:', error)
      }
    },
  },
}
</script>

<style scoped>
.search-bar {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

input[type='text'] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  display: inline-block;
  padding: 10px 20px;
  font-size: 16px;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

p {
  margin-top: 10px;
  color: #666;
}

h3 {
  margin-top: 20px;
  color: #333;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 10px;
}

a {
  color: #007bff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
