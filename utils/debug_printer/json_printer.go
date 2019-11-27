package debug_printer

import "encoding/json"

// panic if marshall return nil
func FormatJson(object interface{}) string {
	data, err := json.MarshalIndent(object, "", "    ")
	if err != nil {
		panic(err)
	}
	return string(data)
}
