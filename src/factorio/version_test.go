package factorio

import "testing"

func TestGreaterC(t *testing.T) {
	tests := []struct {
		name     string
		v        Version
		b        Version
		expected bool
	}{
		{"same major.minor patch differs", Version{2, 0, 76, 0}, Version{2, 0, 0, 0}, true},
		{"same major.minor exact match", Version{2, 0, 0, 0}, Version{2, 0, 0, 0}, true},
		{"same major different minor", Version{2, 1, 0, 0}, Version{2, 0, 0, 0}, false},
		{"different major", Version{1, 1, 0, 0}, Version{2, 0, 0, 0}, false},
		{"1.0 compatible with 0.18", Version{1, 0, 0, 0}, Version{0, 18, 0, 0}, true},
		{"0.18 not compatible with 1.0", Version{0, 18, 0, 0}, Version{1, 0, 0, 0}, false},
		{"0.17 not compatible with 0.18", Version{0, 17, 0, 0}, Version{0, 18, 0, 0}, false},
		{"1.1 not compatible with 1.0", Version{1, 1, 0, 0}, Version{1, 0, 0, 0}, false},
		{"2.0 not compatible with 2.1", Version{2, 0, 0, 0}, Version{2, 1, 0, 0}, false},
		{"2.1 not compatible with 2.0", Version{2, 1, 0, 0}, Version{2, 0, 0, 0}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.v.GreaterC(tt.b)
			if result != tt.expected {
				t.Errorf("GreaterC(%v, %v) = %v, want %v", tt.v, tt.b, result, tt.expected)
			}
		})
	}
}

func TestGEC(t *testing.T) {
	tests := []struct {
		name     string
		v        Version
		b        Version
		expected bool
	}{
		{"server 2.0 GEC mod 2.0 exact", Version{2, 0, 0, 0}, Version{2, 0, 0, 0}, true},
		{"server 2.0.76 GEC mod 2.0 patch differs", Version{2, 0, 76, 0}, Version{2, 0, 0, 0}, true},
		{"server 2.0 GEC mod 2.1 minor differs", Version{2, 0, 0, 0}, Version{2, 1, 0, 0}, false},
		{"server 2.1 GEC mod 2.0 minor differs", Version{2, 1, 0, 0}, Version{2, 0, 0, 0}, false},
		{"server 1.1 GEC mod 1.1 exact", Version{1, 1, 0, 0}, Version{1, 1, 0, 0}, true},
		{"server 2.0 GEC mod 1.1 cross major", Version{2, 0, 0, 0}, Version{1, 1, 0, 0}, false},
		{"server 1.0 GEC mod 0.18 bridge", Version{1, 0, 0, 0}, Version{0, 18, 0, 0}, true},
		{"server 0.18 GEC mod 1.0 reverse", Version{0, 18, 0, 0}, Version{1, 0, 0, 0}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.v.GEC(tt.b)
			if result != tt.expected {
				t.Errorf("GEC(%v, %v) = %v, want %v", tt.v, tt.b, result, tt.expected)
			}
		})
	}
}

func TestIsCompatibleWithRange(t *testing.T) {
	tests := []struct {
		name        string
		installed   Version
		factorioVer Version
		deps        []string
		expected    bool
	}{
		{"server 2.0 mod 2.0 no deps", Version{2, 0, 0, 0}, Version{2, 0, 0, 0}, nil, true},
		{"server 2.0.76 mod 2.0 patch ignored", Version{2, 0, 76, 0}, Version{2, 0, 0, 0}, nil, true},
		{"server 2.0 mod 2.1 minor mismatch", Version{2, 0, 0, 0}, Version{2, 1, 0, 0}, nil, false},
		{"server 2.1 mod 2.0 minor mismatch", Version{2, 1, 0, 0}, Version{2, 0, 0, 0}, nil, false},
		{"server 1.1 mod 2.0 cross major", Version{1, 1, 0, 0}, Version{2, 0, 0, 0}, nil, false},
		{"server 2.0 mod 2.0 base >= 2.0", Version{2, 0, 0, 0}, Version{2, 0, 0, 0}, []string{"base >= 2.0.0"}, true},
		{"server 2.0 mod 2.0 base >= 2.1", Version{2, 0, 0, 0}, Version{2, 0, 0, 0}, []string{"base >= 2.1.0"}, false},
		{"server 1.1 mod 1.1 base >= 1.1", Version{1, 1, 0, 0}, Version{1, 1, 0, 0}, []string{"base >= 1.1.0"}, true},
		{"server 1.0 mod 1.1 minor mismatch", Version{1, 0, 0, 0}, Version{1, 1, 0, 0}, []string{"base >= 1.1.0"}, false},
		{"server 1.0 mod 0.18 bridge", Version{1, 0, 0, 0}, Version{0, 18, 0, 0}, []string{"base >= 0.18.0"}, true},
		{"no base dep", Version{2, 0, 76, 0}, Version{2, 0, 0, 0}, []string{}, true},
		{"base only no op", Version{2, 0, 0, 0}, Version{2, 0, 0, 0}, []string{"base"}, true},
		{"skip non-base deps", Version{2, 0, 0, 0}, Version{2, 0, 0, 0}, []string{"some-mod >= 1.0.0"}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isCompatibleWithRange(tt.installed, tt.factorioVer, tt.deps)
			if result != tt.expected {
				t.Errorf("isCompatibleWithRange(%v, %v, %v) = %v, want %v", tt.installed, tt.factorioVer, tt.deps, result, tt.expected)
			}
		})
	}
}
