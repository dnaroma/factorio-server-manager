package factorio

import "testing"

func TestHasUpdateUsesCurrentChannel(t *testing.T) {
	tests := []struct {
		name         string
		installed    Version
		latestStable string
		latest       string
		wantUpdate   bool
		wantVersion  string
	}{
		{
			name:         "current stable ignores newer experimental",
			installed:    Version{2, 0, 72, 0},
			latestStable: "2.0.72",
			latest:       "2.0.76",
			wantUpdate:   false,
		},
		{
			name:         "older stable updates to stable",
			installed:    Version{2, 0, 70, 0},
			latestStable: "2.0.72",
			latest:       "2.0.76",
			wantUpdate:   true,
			wantVersion:  "2.0.72",
		},
		{
			name:         "experimental updates to experimental",
			installed:    Version{2, 0, 75, 0},
			latestStable: "2.0.72",
			latest:       "2.0.76",
			wantUpdate:   true,
			wantVersion:  "2.0.76",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotUpdate, gotVersion := hasUpdate(tt.installed, tt.latestStable, tt.latest)
			if gotUpdate != tt.wantUpdate {
				t.Fatalf("hasUpdate() update = %v, want %v", gotUpdate, tt.wantUpdate)
			}
			if gotVersion != tt.wantVersion {
				t.Fatalf("hasUpdate() version = %q, want %q", gotVersion, tt.wantVersion)
			}
		})
	}
}
