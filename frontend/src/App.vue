<!-- App.vue -->
<template>
  <div id="app">
    <SearchBar />
    <TranscriptContainer @transcript-updated="handleTranscriptUpdated" />
    <WordCloudContainer :transcript="currentTranscript" />
  </div>
</template>

<script>
import SearchBar from './components/SearchBar.vue'
import TranscriptContainer from './components/TranscriptContainer.vue'
import WordCloudContainer from './components/WordCloudContainer.vue'

export default {
  data() {
    return {
      currentTranscript: '',
    }
  },
  components: {
    SearchBar,
    TranscriptContainer,
    WordCloudContainer,
  },
  methods: {
    handleTranscriptUpdated(transcript) {
      this.currentTranscript = transcript
    },
  },
}
</script>

<style>
/* Add any global styles here */
</style>
