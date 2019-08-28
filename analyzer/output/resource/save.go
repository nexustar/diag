package resource

import (
	"fmt"

	"github.com/pingcap/tidb-foresight/analyzer/boot"
	"github.com/pingcap/tidb-foresight/analyzer/input/args"
	"github.com/pingcap/tidb-foresight/analyzer/input/resource"
	"github.com/pingcap/tidb-foresight/model"
	"github.com/pingcap/tidb-foresight/utils"
	log "github.com/sirupsen/logrus"
)

const THRESHOLD = 60

type saveResourceTask struct {
}

// SaveResource returns an instance of saveResourceTask
func SaveResource() *saveResourceTask {
	return &saveResourceTask{}
}

// Insert resource usage to database for frontend presentation
func (t *saveResourceTask) Run(c *boot.Config, r *resource.Resource, args *args.Args, m *boot.Model) {
	d := utils.HumanizeDuration(args.ScrapeEnd.Sub(args.ScrapeBegin))
	if err := t.insertData(m, c.InspectionId, "cpu", d, r.MaxCPU, r.AvgCPU); err != nil {
		log.Error("insert cpu usage:", err)
	}
	if err := t.insertData(m, c.InspectionId, "disk", d, r.MaxDisk, r.AvgDisk); err != nil {
		log.Error("insert disk usage:", err)
	}
	if err := t.insertData(m, c.InspectionId, "ioutil", d, r.MaxIoUtil, r.AvgIoUtil); err != nil {
		log.Error("insert ioutil usage:", err)
	}
	if err := t.insertData(m, c.InspectionId, "mem", d, r.MaxMem, r.AvgMem); err != nil {
		log.Error("insert memory usage:", err)
	}
}

func (t *saveResourceTask) insertData(m *boot.Model, inspectionId, resource, duration string, max float64, avg float64) error {
	mv := utils.NewTagdFloat64(max, nil)
	av := utils.NewTagdFloat64(avg, nil)
	if mv.GetValue() > THRESHOLD {
		mv.SetTag("status", "abnormal")
		mv.SetTag("message", fmt.Sprintf("%s/max resource utilization/%s too high", resource, duration))
	}
	if av.GetValue() > THRESHOLD {
		av.SetTag("status", "abnormal")
		av.SetTag("message", fmt.Sprintf("%s/avg resource utilization/%s too high", resource, duration))
	}

	return m.InsertInspectionResourceInfo(&model.ResourceInfo{
		InspectionId: inspectionId,
		Name:         resource,
		Duration:     duration,
		Max:          mv,
		Avg:          av,
	})
}
