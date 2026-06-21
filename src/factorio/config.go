package factorio

import (
	"log"
	"os"
	"path/filepath"

	"github.com/go-ini/ini"
)

const defaultConfigINI = `[path]
read-data=__PATH__executable__/../../data
write-data=__PATH__executable__/../..

[general]
locale=
`

func EnsureConfig(filename string) error {
	if _, err := os.Stat(filename); err == nil {
		return nil
	} else if !os.IsNotExist(err) {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(filename), 0755); err != nil {
		return err
	}

	return os.WriteFile(filename, []byte(defaultConfigINI), 0664)
}

// Loads config.ini file from the factorio bootstrap directory
func LoadConfig(filename string) (map[string]map[string]string, error) {
	log.Printf("Loading config file: %s", filename)
	if err := EnsureConfig(filename); err != nil {
		log.Printf("Error creating config.ini file: %s", err)
		return nil, err
	}

	cfg, err := ini.Load(filename)
	if err != nil {
		log.Printf("Error loading config.ini file: %s", err)
		return nil, err
	}

	result := map[string]map[string]string{}

	sections := cfg.Sections()
	sectionNames := cfg.SectionStrings()
	log.Printf("Appending sections %s to JSON response", sectionNames)
	for _, s := range sections {
		sectionName := s.Name()
		if sectionName == "DEFAULT" {
			continue
		}
		result[sectionName] = map[string]string{}
		result[sectionName] = s.KeysHash()
	}
	log.Printf("Encoding config.ini to JSON")

	return result, nil
}
