package task

import (
	"encoding/json"
	"io/ioutil"
	"path"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
)

type Args struct {
	InstanceId   string    `json:"instance_id"`
	InspectionId string    `json:"inspection_id"`
	Collects     string    `json:"collect"`
	ScrapeBegin  time.Time `json:"begin"`
	ScrapeEnd    time.Time `json:"end"`
}

func (a *Args) Collect(iname string) bool {
	items := strings.Split(a.Collects, ",")
	for _, item := range items {
		if iname == item {
			return true
		}
	}
	return false
}

type ParseArgsTask struct {
	BaseTask
}

func ParseArgs(base BaseTask) Task {
	return &ParseArgsTask{base}
}

func (t *ParseArgsTask) Run() error {
	content, err := ioutil.ReadFile(path.Join(t.src, "args.json"))
	if err != nil {
		log.Error("read file: ", err)
		return err
	}

	args := Args{}
	if err = json.Unmarshal(content, &args); err != nil {
		log.Error("unmarshal: ", err)
		return err
	}

	t.data.args = args
	return nil
}