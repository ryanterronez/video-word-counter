<template>
  <div class="transcript-container">
    <button @click="getTranscript">Get Transcript</button>
    <h3>Transcript:</h3>
    <p>{{ truncatedTranscript }}</p>
    <div class="word-cloud-container">
      <input
        type="text"
        v-model="cloudWordSize"
        placeholder="Word cloud word size"
      />
      <input
        type="text"
        v-model="cloudWordCount"
        @input="limitInput"
        @keyup.enter="createCloud"
        placeholder="Word cloud word count"
      />
      <button @click="createCloud">Create Word Cloud</button>
      <div ref="wordCloudContainer" class="word-cloud"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import * as d3 from 'd3'
import cloud from 'd3-cloud'

export default {
  data() {
    return {
      transcript: '',
      cloudWordCount: '',
      cloudWordSize: '',
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

    async createCloud() {
      let words
      if (!this.transcript) {
        words = [
          'You',
          'have',
          'no',
          'transcript',
          'to',
          'generate',
          'a',
          'word',
          'cloud',
        ].map(function (d) {
          return { text: d, size: 10 + Math.random() * 90 }
        })
      } else {
        words = this.getNTopWords(this.transcript, this.cloudWordCount)
      }
      console.log(words)

      const layout = cloud()
        .size([600, 400])
        .words(words)
        .padding(5)
        .rotate(() => ~~(Math.random() * 2) * 90)
        .font('Impact')
        .fontSize((d) => d.size)
        .on('end', this.drawCloud)

      layout.start()
    },
    drawCloud(words) {
      const container = this.$refs.wordCloudContainer
      container.innerHTML = ''

      const svg = d3
        .select(container)
        .append('svg')
        .attr('width', 600)
        .attr('height', 400)

      const g = svg.append('g').attr('transform', 'translate(300,200)')

      g.selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', (d) => `${d.size}px`)
        .style('font-family', 'Impact')
        .style('fill', (d, i) => d3.schemeCategory10[i % 10])
        .attr('text-anchor', 'middle')
        .attr('transform', (d) => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
        .text((d) => d.text)
    },
  },
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

.word-cloud-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  margin: 10px 0;
  border: none;
  border-radius: 25px;
  background-color: #007bff;
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

input {
  width: 100%;
  max-width: 200px;
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
  border-color: #007bff;
  box-shadow: 0 2px 5px rgba(0, 123, 255, 0.5);
  outline: none;
}
</style>
