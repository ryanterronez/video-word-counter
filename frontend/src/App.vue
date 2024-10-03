<!-- App.vue -->
<template>
  <div id="app">
    <SearchBar />
    <TranscriptContainer />
  </div>
</template>

<script>
import SearchBar from './components/SearchBar.vue'
import TranscriptContainer from './components/TranscriptContainer.vue'

export default {
  components: {
    SearchBar,
    TranscriptContainer,
  },
}
</script>

<style>
/* Add any global styles here */
</style>
