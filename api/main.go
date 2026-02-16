package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
)

type FileStatus struct {
	LastSync       int64  `json:"lastSync"`
	TargetFilename string `json:"targetFilename"`
}

const FileDataName = "fileData.json"
const DataPath = "./data/"

var fileInUseError = errors.New("file is already in use")
var isFileInUse = false

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
	if isFileInUse {
		return nil, fileInUseError
	}

	isFileInUse = true
	defer func() {
		isFileInUse = false
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

	_, err := getFileStatusData()
	if err != nil {
		log.Fatal(err)
	}

	err = router.Run()

	if err != nil {
		log.Fatal(err.Error())
	}
}
