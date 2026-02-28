package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type FileStatus struct {
	LastSync        int64  `json:"lastSync"`
	TargetFilename  string `json:"targetFilename"`
	LastSyncVersion int64  `json:"version"`
}

const FileDataName = "fileData.json"
const DataPath = "./data/"

var fileInUseError = errors.New("file is already in use")
var badUserToken = errors.New("no valid token found")
var userToken string
var fileStatusInUse = false
var appDataFileInUse = false

func GenerateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		return nil, err
	}

	return b, nil
}

func GenerateRandomString(s int) (string, error) {
	b, err := GenerateRandomBytes(s)
	return base64.URLEncoding.EncodeToString(b), err
}

func createStatusFile(data *FileStatus) (*FileStatus, error) {
	file, err := os.Create(DataPath + FileDataName)

	if err != nil {
		return nil, err
	}

	defer file.Close()

	dataAsJson, err := json.Marshal(data)

	if err != nil {
		return nil, err
	}

	_, err = file.Write(dataAsJson)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func getFileStatusData() (*FileStatus, error) {
	if fileStatusInUse {
		return nil, fileInUseError
	}

	fileStatusInUse = true
	defer func() {
		fileStatusInUse = false
	}()
	fileBytes, err := os.ReadFile(DataPath + FileDataName)

	if os.IsNotExist(err) {
		data := &FileStatus{}
		data.LastSync = -1
		data.TargetFilename = "app_data.json"

		return createStatusFile(data)
	}

	if err != nil {
		return nil, err
	}

	data := &FileStatus{}
	err = json.Unmarshal(fileBytes, &data)

	if err != nil {
		return nil, err
	}

	return data, nil
}

func isValidAuth(authorization string) error {
	if authorization == "" {
		return badUserToken
	}

	parts := strings.Split(authorization, " ")
	if len(parts) != 2 {
		return badUserToken
	}

	if parts[0] != "PIA" || parts[1] != userToken {
		return badUserToken
	}

	return nil
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		err := isValidAuth(c.GetHeader("Authorization"))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
			return
		}

		c.Next()
	}
}

func main() {
	router := gin.Default()

	router.GET("/status", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "ok",
		})
	})

	authProtected := router.Group("/")
	authProtected.Use(authMiddleware())

	authProtected.GET("/check", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "ok",
		})
	})

	authProtected.DELETE("/reset", func(c *gin.Context) {
		data, err := getFileStatusData()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}

		err = os.Remove(DataPath + data.TargetFilename)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}

		err = os.Remove(DataPath + FileDataName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "reset with success",
		})
	})

	authProtected.GET("/last-sync", func(c *gin.Context) {
		data, err := getFileStatusData()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"timestamp": data.LastSync,
			"version":   data.LastSyncVersion,
		})
	})

	authProtected.GET("/sync-state/:version", func(c *gin.Context) {
		version, err := strconv.ParseInt(c.Param("version"), 10, 64)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "invalid version number",
			})
			return
		}

		data, err := getFileStatusData()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		whoHasNewest := "server"
		if data.LastSyncVersion < version {
			whoHasNewest = "client"
		}

		c.JSON(http.StatusOK, gin.H{
			"whoHasNewest": whoHasNewest,
		})
	})

	authProtected.GET("/download", func(c *gin.Context) {
		if appDataFileInUse {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "the data file is being used already, please wait",
			})
			return
		}

		appDataFileInUse = true
		defer func() {
			appDataFileInUse = false
		}()

		fileStatus, err := getFileStatusData()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		appData, err := os.ReadFile(DataPath + fileStatus.TargetFilename)
		if os.IsNotExist(err) {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "the requested resource does not exist, please upload it first",
			})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		var appDataJson map[string]interface{}
		err = json.Unmarshal(appData, &appDataJson)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, appDataJson)
	})

	authProtected.POST("/upload/:version", func(c *gin.Context) {
		if appDataFileInUse {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "a file is already being saved, please wait",
			})
			return
		}

		appDataFileInUse = true
		defer func() {
			appDataFileInUse = false
		}()

		version, err := strconv.ParseInt(c.Param("version"), 10, 64)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "invalid version number",
			})
			return
		}

		jsonData, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}

		fileStatus, err := getFileStatusData()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		savedFile, err := os.Create(DataPath + fileStatus.TargetFilename)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		defer savedFile.Close()

		_, err = savedFile.Write(jsonData)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		fileStatus.LastSync = time.Now().Unix()
		fileStatus.LastSyncVersion = version

		_, err = createStatusFile(fileStatus)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":   "file uploaded",
			"timestamp": fileStatus.LastSync,
		})
	})

	_, err := getFileStatusData()
	if err != nil {
		log.Fatal(err)
	}

	userToken = os.Getenv("pia_token")
	if userToken == "" {
		userToken, err = GenerateRandomString(64)
		if err != nil {
			log.Fatal(err)
		}
	}
	fmt.Println("user token:", userToken)

	err = router.Run()

	if err != nil {
		log.Fatal(err.Error())
	}
}
