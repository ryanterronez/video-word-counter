<script setup>
import axios from 'axios'
import { ref, getCurrentInstance } from 'vue'

const transcript = ref('')
const maxLength = ref('1000')
const truncatedTranscript = ref('')

const { emit } = getCurrentInstance()

function createTruncatedTranscript() {
  if (transcript.value.length > maxLength.value) {
    truncatedTranscript.value =
      transcript.value.substring(0, maxLength.value) + '...'
  }
}

async function getTranscript() {
  console.log('Getting transcript...')
  try {
    const response = await axios.get('http://localhost:3000/get_transcript')
    transcript.value = response.data
  } catch (error) {
    console.error('Error extracting audio:', error)
  }
  createTruncatedTranscript()
  emit('transcript-updated', transcript.value)
}
</script>

<template>
  <div class="transcript-container">
    <button @click="getTranscript">Get Transcript</button>
    <h3>Transcript:</h3>
    <p v-if="truncatedTranscript">{{ truncatedTranscript }}</p>
    <p v-else>{{ transcript }}</p>
  </div>
</template>

<style scoped></style>
