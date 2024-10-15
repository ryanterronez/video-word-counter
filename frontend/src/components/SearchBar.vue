<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const videoSearchTerm = ref('')
const videos = ref([])
const channelId = ref('UCP6GE0Xs1S15lxdN4fQakQQ')
const showAllVideos = ref(false)
const searchCharLimit = 50

const remainingCharacters = computed(() => {
  return searchCharLimit - videoSearchTerm.value.length
})

function limitInput() {
  if (videoSearchTerm.value.length > searchCharLimit) {
    videoSearchTerm.value = videoSearchTerm.value.slice(0, searchCharLimit)
  }
}

const displayedVideos = computed(() => {
  return showAllVideos.value ? videos.value : videos.value.slice(0, 5)
})

async function searchYouTube() {
  // eslint-disable-next-line no-undef
  const apiKey = process.env.VUE_APP_YOUTUBE_API_KEY
  const query = videoSearchTerm.value
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${apiKey}&channelId=${channelId.value}&maxResults=10`
  try {
    const response = await axios.get(url)
    videos.value = response.data.items
    showAllVideos.value = false
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
  }
}

async function extractAudio(videoId, title) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  console.log('Sending request to backend:', videoUrl)
  try {
    const response = await axios.post('http://localhost:3000/extract_audio', {
      video_url: videoUrl,
      video_title: title,
    })
    console.log('Response from backend:', response.data)
    console.log(response.data.message)
  } catch (error) {
    console.error('Error extracting audio:', error)
  }
}
</script>

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
        class="search-input"
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
        class="search-input"
      />
    </div>
    <button @click="searchYouTube">Search</button>
    <p>
      {{
        remainingCharacters == 1
          ? '1 character remaining'
          : `${remainingCharacters} characters remaining`
      }}
    </p>
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

<style scoped></style>
