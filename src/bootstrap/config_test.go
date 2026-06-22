package bootstrap

import (
	"os"
	"path/filepath"
	"testing"
)

func TestRelativeCredentialsFileUsesConfigDirectory(t *testing.T) {
	dir := t.TempDir()
	conf := filepath.Join(dir, "conf.json")
	if err := os.WriteFile(conf, []byte(`{
		"rcon_pass":"test-rcon",
		"cookie_encryption_key":"VGhpcy1pcy1hLXRlc3QtMzItYnl0ZS1rZXkh",
		"settings_file":"server-settings.json"
	}`), 0644); err != nil {
		t.Fatalf("Error writing config: %s", err)
	}

	config := NewConfig([]string{"--dir", dir, "--conf", conf})
	expected := filepath.Join(dir, "factorio.auth")
	if config.FactorioCredentialsFile != expected {
		t.Fatalf("Expected credentials file %s, got %s", expected, config.FactorioCredentialsFile)
	}
}
