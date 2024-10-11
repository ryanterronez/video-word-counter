<script setup>
import * as d3 from 'd3'
import cloud from 'd3-cloud'
import { ref } from 'vue'

const cloudWordCount = ref('21')
const cloudWordSize = ref('6')
const wordCloudContainer = ref(null)

const props = defineProps(['transcript'])

function limitInput() {
  if (cloudWordCount.value.length > 2) {
    cloudWordCount.value = cloudWordCount.value.slice(0, 2)
  }
}

function getNTopWords(text, n) {
  const words = text.split(/[^a-zA-Z0-9']+/)
  const wordCounts = words.reduce((counts, word) => {
    if (word.length < cloudWordSize.value) {
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
}

async function createCloud() {
  let words
  if (!props.transcript) {
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
    words = getNTopWords(props.transcript, cloudWordCount.value)
  }
  console.log(words)

  const layout = cloud()
    .size([900, 700])
    .words(words)
    .padding(5)
    .rotate(() => ~~(Math.random() * 2) * 90)
    .font('Impact')
    .fontSize((d) => d.size)
    .on('end', drawCloud)

  layout.start()
}

function drawCloud(words) {
  const container = wordCloudContainer.value
  container.innerHTML = ''

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', 600)
    .attr('height', 400)
    .attr('class', 'centered-svg')

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
}
</script>
<template>
  <div class="word-cloud-container">
    <label for="cloud-word-size">Word size</label>
    <input
      id="cloud-word-size"
      type="text"
      v-model="cloudWordSize"
      class="number-input"
    />
    <label for="cloud-word-count">Word count</label>
    <input
      id="cloud-word-count"
      type="text"
      v-model="cloudWordCount"
      @input="limitInput"
      @keyup.enter="createCloud"
      class="number-input"
    />
    <button @click="createCloud">Create Word Cloud</button>
    <div ref="wordCloudContainer" class="word-cloud"></div>
  </div>
</template>
