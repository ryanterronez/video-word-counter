const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  env: {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY
  }
})
