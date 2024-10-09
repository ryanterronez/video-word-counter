<!-- App.vue -->
<template>
  <div id="app">
    <SearchBar />
    <TranscriptContainer />
    <WordCloudContainer />
  </div>
</template>

<script>
import SearchBar from './components/SearchBar.vue'
import TranscriptContainer from './components/TranscriptContainer.vue'
import WordCloudContainer from './components/WordCloudContainer.vue'

export default {
  components: {
    SearchBar,
    TranscriptContainer,
    WordCloudContainer,
  },
}
</script>

<style>
/* Add any global styles here */
</style>
