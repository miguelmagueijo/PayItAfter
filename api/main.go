package main

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type FileStatus struct {
	LastSync       int64  `json:"lastSync"`
	TargetFilename string `json:"targetFilename"`
}

const FileDataName = "fileData.json"
const DataPath = "./data/"

var fileInUseError = errors.New("file is already in use")
var fileStatusInUse = false
var appDataFileInUse = false

func createStatusFile(data *FileStatus) (*FileStatus, error) {
	file, err := os.Create(DataPath + FileDataName)

	if err != nil {
		return nil, err
	}

	dataAsJson, err := json.Marshal(data)

	if err != nil {
		return nil, err
	}

	_, err = file.Write(dataAsJson)
	if err != nil {
		return nil, err
	}

	err = file.Close()
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

func main() {
	router := gin.Default()

	router.GET("/status", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "ok",
		})
	})

	router.GET("/last-sync", func(c *gin.Context) {
		data, err := getFileStatusData()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"timestamp": data.LastSync,
		})
	})

	router.GET("/sync-state/:timestamp", func(c *gin.Context) {
		timestamp, err := strconv.ParseInt(c.Param("timestamp"), 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "invalid timestamp",
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
		if data.LastSync < timestamp {
			whoHasNewest = "client"
		}

		c.JSON(http.StatusOK, gin.H{
			"whoHasNewest": whoHasNewest,
		})
	})

	router.GET("/download", func(c *gin.Context) {
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

	router.POST("/upload", func(c *gin.Context) {
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

		_, err = savedFile.Write(jsonData)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		err = savedFile.Close()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}

		fileStatus.LastSync = time.Now().Unix()

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

	err = router.Run()

	if err != nil {
		log.Fatal(err.Error())
	}
}
