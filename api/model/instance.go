package model

import (
	"time"
	log "github.com/sirupsen/logrus"
)

type Instance struct {
	Uuid string `json:"uuid"`
	Name string `json:"name"`
	Status string `json:"status"`
	CreateTime time.Time `json:"create_time"`
	User string `json:"user"`
	Tidb string `json:"tidb"`
	Tikv string `json:"tikv"`
	Pd string `json:"pd"`
	Grafana string `json:"grafana"`
	Prometheus string `json:"promethus"`
}

func (m *Model) ListInstance() ([]*Instance, error) {
	instances := []*Instance{}

	rows, err := m.db.Query("SELECT id,name,status,create_t,user,tidb,tikv,pd,grafana,prometheus FROM instances")
	if err != nil {
		log.Error("Failed to call db.Query:", err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		instance := Instance{}
		err := rows.Scan(
			&instance.Uuid, &instance.Name, &instance.Status, &instance.CreateTime, &instance.User, 
			&instance.Tidb, &instance.Tikv, &instance.Pd, &instance.Grafana, &instance.Prometheus,
		)
		if err != nil {
			log.Error("Failed to call db.Query:", err)
			return nil, err
		}

		instances = append(instances, &instance)
	}

	return instances, nil
}