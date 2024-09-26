```vue
<!-- SearchBar.vue -->
<template>
  <div class="search-bar">
    <input type="text" v-model="searchTerm" @input="limitInput" placeholder="Enter search term" />
    <p>{{ remainingCharacters }} characters remaining</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchTerm: ''
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

p {
  font-size: 14px;
  color: #666;
}
</style>