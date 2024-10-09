<template>
  <div class="transcript-container">
    <button @click="getTranscript">Get Transcript</button>
    <h3>Transcript:</h3>
    <p>{{ truncatedTranscript }}</p>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      transcript: '',
    }
  },
  computed: {
    truncatedTranscript() {
      const maxLength = 1000
      return this.transcript.length > maxLength
        ? this.transcript.substring(0, maxLength) + '...'
        : this.transcript
    },
  },
  methods: {
    limitInput() {
      if (this.cloudWordCount.length > 2) {
        this.cloudWordCount = this.cloudWordCount.slice(0, 2)
      }
    },
    getNTopWords(text, n) {
      const words = text.split(/[^a-zA-Z0-9']+/)
      const wordCounts = words.reduce((counts, word) => {
        if (word.length < this.cloudWordSize) {
          return counts
        } else {
          counts[word] = (counts[word] || 0) + 1
          return counts
        }
      }, {})
      const sortedWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1])
      return sortedWords
        .slice(0, n)
        .map(([word, count]) => ({ text: word, size: 10 + count * 2 }))
    },

    async getTranscript() {
      console.log('Getting transcript...')
      try {
        const response = await axios.get('http://localhost:3000/get-transcript')
        this.transcript = response.data
      } catch (error) {
        console.error('Error extracting audio:', error)
      }
    },
  },
}
</script>

<style scoped></style>
