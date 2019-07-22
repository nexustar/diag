package main

import (
	"flag"

	"github.com/pingcap/tidb-foresight/bootstrap"
	"github.com/pingcap/tidb-foresight/server"
	log "github.com/sirupsen/logrus"
)

func main() {
	homepath := flag.String("home", "/tmp/tidb-foresight", "tidb-foresight work home")
	address := flag.String("address", "0.0.0.0:8888", "tidb foresight listen address")
	pioneer := flag.String("pioneer", "/tmp/pioneer.py", "tool to parse inventory.ini and get basic cluster info")
	collector := flag.String("collector", "/tmp/pioneer.py", "tool to collect cluster info")
	analyzer := flag.String("analyzer", "/tmp/pioneer.py", "tool to analyze cluster info")

	flag.Parse()

	log.SetFormatter(&log.TextFormatter{
		FullTimestamp: true,
	})

	config, db := bootstrap.MustInit(*homepath)
	defer db.Close()

	config.Home = *homepath
	config.Address = *address
	config.Pioneer = *pioneer
	config.Collector = *collector
	config.Analyzer = *analyzer

	s := server.NewServer(config, db)

	log.Panic(s.Run())
}
