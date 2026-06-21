package factorio

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadConfigCreatesMissingConfigINI(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config", "config.ini")

	config, err := LoadConfig(path)
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}
	if _, err := os.Stat(path); err != nil {
		t.Fatalf("expected config.ini to be created: %v", err)
	}
	if config["path"]["read-data"] == "" {
		t.Fatal("expected default read-data path")
	}
}
