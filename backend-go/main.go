package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/ryanterronez/video-word-counter/backend-go/initializers"
)

func init() {
	initializers.LoadEnvVariables()
}

func main() {
	r := gin.Default()

	config := cors.Config{
		AllowOrigins: []string{"http://localhost:8080"},
		AllowMethods: []string{"GET", "POST"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}

	r.Use(cors.New(config))

	r.POST("/extract_audio", func(c *gin.Context) {

		c.JSON(200, gin.H{
			"message": "extract audio",
		})
	})

	r.GET("/get_transcript", func(c *gin.Context) {

		c.JSON(200, gin.H{
			"message": "get transcript",
		})
	})

	r.Run("localhost:3000")
}
