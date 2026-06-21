package factorio

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/OpenFactorioServerManager/factorio-server-manager/bootstrap"
)

const saveBackupDirName = "backups"

type Save struct {
	Name    string    `json:"name"`
	LastMod time.Time `json:"last_mod"`
	Size    int64     `json:"size"`
}

type SaveBackup struct {
	Name     string    `json:"name"`
	SaveName string    `json:"save_name"`
	LastMod  time.Time `json:"last_mod"`
	Size     int64     `json:"size"`
}

func (s *Save) String() string {
	return s.Name
}

func ValidateSaveName(name string) (string, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return "", errors.New("save name cannot be blank")
	}
	if filepath.IsAbs(name) || filepath.Base(name) != name || strings.Contains(name, "/") || strings.Contains(name, "\\") || strings.Contains(name, "\x00") {
		return "", fmt.Errorf("invalid save name: %s", name)
	}
	if name == "." || name == ".." {
		return "", fmt.Errorf("invalid save name: %s", name)
	}
	return name, nil
}

func validateBackupName(name string) (string, error) {
	name, err := ValidateSaveName(name)
	if err != nil {
		return "", err
	}
	if _, saveName, err := parseBackupName(name); err != nil || saveName == "" {
		return "", fmt.Errorf("invalid backup name: %s", name)
	}
	return name, nil
}

func savePath(name string) (string, error) {
	name, err := ValidateSaveName(name)
	if err != nil {
		return "", err
	}
	config := bootstrap.GetConfig()
	return filepath.Join(config.FactorioSavesDir, name), nil
}

func saveBackupDir() string {
	config := bootstrap.GetConfig()
	return filepath.Join(config.FactorioSavesDir, saveBackupDirName)
}

func saveBackupPath(name string) (string, error) {
	name, err := validateBackupName(name)
	if err != nil {
		return "", err
	}
	return filepath.Join(saveBackupDir(), name), nil
}

func copyFile(src, dst string) error {
	return copyFileAtomic(src, dst, false)
}

func copyFileOverwrite(src, dst string) error {
	return copyFileAtomic(src, dst, true)
}

func copyFileAtomic(src, dst string, overwrite bool) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	info, err := srcFile.Stat()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}

	if !overwrite {
		if _, err := os.Stat(dst); err == nil {
			return fmt.Errorf("file already exists: %s", filepath.Base(dst))
		} else if !errors.Is(err, os.ErrNotExist) {
			return err
		}
	}

	tmpFile, err := os.CreateTemp(filepath.Dir(dst), fmt.Sprintf(".%s-*.tmp", filepath.Base(dst)))
	if err != nil {
		return err
	}
	tmpName := tmpFile.Name()
	defer func() {
		_ = os.Remove(tmpName)
	}()

	if err := tmpFile.Chmod(info.Mode()); err != nil {
		_ = tmpFile.Close()
		return err
	}
	if _, err := io.Copy(tmpFile, srcFile); err != nil {
		_ = tmpFile.Close()
		return err
	}
	if err := tmpFile.Sync(); err != nil {
		_ = tmpFile.Close()
		return err
	}
	if err := tmpFile.Close(); err != nil {
		return err
	}

	if !overwrite {
		if err := linkOrRename(tmpName, dst); err != nil {
			return err
		}
	} else if err := os.Rename(tmpName, dst); err != nil {
		return err
	}
	return syncDir(filepath.Dir(dst))
}

func linkOrRename(src, dst string) error {
	if err := os.Link(src, dst); err != nil {
		if errors.Is(err, os.ErrExist) {
			return fmt.Errorf("file already exists: %s", filepath.Base(dst))
		}
		return err
	}
	return nil
}

func syncDir(path string) error {
	dir, err := os.Open(path)
	if err != nil {
		return err
	}
	defer dir.Close()
	return dir.Sync()
}

func uniqueBackupName(saveName string) (string, error) {
	var suffix [4]byte
	if _, err := rand.Read(suffix[:]); err != nil {
		return "", err
	}
	return fmt.Sprintf("%s_%s_%s", time.Now().UTC().Format("20060102T150405.000000000Z"), hex.EncodeToString(suffix[:]), saveName), nil
}

func parseBackupName(name string) (createdAt string, saveName string, err error) {
	parts := strings.SplitN(name, "_", 3)
	if len(parts) == 2 {
		if parts[0] == "" || parts[1] == "" {
			return "", "", errors.New("backup name is missing timestamp or save name")
		}
		return parts[0], parts[1], nil
	}
	if len(parts) != 3 {
		return "", "", errors.New("backup name must include timestamp and save name")
	}
	if parts[0] == "" || parts[1] == "" || parts[2] == "" {
		return "", "", errors.New("backup name is missing timestamp or save name")
	}
	return parts[0], parts[2], nil
}

// Lists save files in factorio/saves
func ListSaves() (saves []Save, err error) {
	config := bootstrap.GetConfig()
	saves = []Save{}
	entries, err := os.ReadDir(config.FactorioSavesDir)
	if err != nil {
		return saves, err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			return saves, err
		}
		saves = append(saves, Save{
			info.Name(),
			info.ModTime(),
			info.Size(),
		})
	}

	return saves, nil
}

func ListSaveBackups() (backups []SaveBackup, err error) {
	backups = []SaveBackup{}
	entries, err := os.ReadDir(saveBackupDir())
	if errors.Is(err, os.ErrNotExist) {
		return backups, nil
	}
	if err != nil {
		return backups, err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		_, saveName, err := parseBackupName(entry.Name())
		if err != nil {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			return backups, err
		}
		backups = append(backups, SaveBackup{
			Name:     info.Name(),
			SaveName: saveName,
			LastMod:  info.ModTime(),
			Size:     info.Size(),
		})
	}

	return backups, nil
}

func FindSave(name string) (*Save, error) {
	name, err := ValidateSaveName(name)
	if err != nil {
		return nil, err
	}

	saves, err := ListSaves()
	if err != nil {
		return nil, fmt.Errorf("error listing saves: %v", err)
	}

	for _, save := range saves {
		if save.Name == name {
			return &save, nil
		}
	}

	return nil, errors.New("save not found")
}

func (s *Save) Remove() error {
	path, err := savePath(s.Name)
	if err != nil {
		return err
	}
	return os.Remove(path)
}

func BackupSave(name string) (*SaveBackup, error) {
	name, err := ValidateSaveName(name)
	if err != nil {
		return nil, err
	}
	src, err := savePath(name)
	if err != nil {
		return nil, err
	}

	backupName, err := uniqueBackupName(name)
	if err != nil {
		return nil, err
	}
	dst := filepath.Join(saveBackupDir(), backupName)
	if err := copyFile(src, dst); err != nil {
		return nil, err
	}

	info, err := os.Stat(dst)
	if err != nil {
		return nil, err
	}
	return &SaveBackup{
		Name:     backupName,
		SaveName: name,
		LastMod:  info.ModTime(),
		Size:     info.Size(),
	}, nil
}

func RestoreSave(backupName, targetName string) (*Save, error) {
	backupName, err := validateBackupName(backupName)
	if err != nil {
		return nil, err
	}
	if targetName == "" {
		_, targetName, err = parseBackupName(backupName)
		if err != nil {
			return nil, err
		}
	} else {
		targetName, err = ValidateSaveName(targetName)
		if err != nil {
			return nil, err
		}
	}

	src, err := saveBackupPath(backupName)
	if err != nil {
		return nil, err
	}
	dst, err := savePath(targetName)
	if err != nil {
		return nil, err
	}
	if err := copyFileOverwrite(src, dst); err != nil {
		return nil, err
	}

	info, err := os.Stat(dst)
	if err != nil {
		return nil, err
	}
	return &Save{
		Name:    targetName,
		LastMod: info.ModTime(),
		Size:    info.Size(),
	}, nil
}

func RenameSave(name, newName string) (*Save, error) {
	name, err := ValidateSaveName(name)
	if err != nil {
		return nil, err
	}
	newName, err = ValidateSaveName(newName)
	if err != nil {
		return nil, err
	}
	if name == newName {
		return nil, errors.New("new save name must be different")
	}

	src, err := savePath(name)
	if err != nil {
		return nil, err
	}
	dst, err := savePath(newName)
	if err != nil {
		return nil, err
	}
	if _, err := os.Stat(dst); err == nil {
		return nil, fmt.Errorf("save already exists: %s", newName)
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	if err := os.Rename(src, dst); err != nil {
		return nil, err
	}

	info, err := os.Stat(dst)
	if err != nil {
		return nil, err
	}
	return &Save{
		Name:    newName,
		LastMod: info.ModTime(),
		Size:    info.Size(),
	}, nil
}

func DuplicateSave(name, newName string) (*Save, error) {
	name, err := ValidateSaveName(name)
	if err != nil {
		return nil, err
	}
	newName, err = ValidateSaveName(newName)
	if err != nil {
		return nil, err
	}
	if name == newName {
		return nil, errors.New("new save name must be different")
	}

	src, err := savePath(name)
	if err != nil {
		return nil, err
	}
	dst, err := savePath(newName)
	if err != nil {
		return nil, err
	}
	if err := copyFile(src, dst); err != nil {
		return nil, err
	}

	info, err := os.Stat(dst)
	if err != nil {
		return nil, err
	}
	return &Save{
		Name:    newName,
		LastMod: info.ModTime(),
		Size:    info.Size(),
	}, nil
}

// Create savefiles for Factorio
func CreateSave(filePath string) (string, error) {
	err := os.MkdirAll(filepath.Dir(filePath), 0755)
	if err != nil {
		log.Printf("Error in creating Factorio save: %s", err)
		return "", err
	}

	args := []string{"--create", filePath}
	config := bootstrap.GetConfig()
	cmdOutput, err := exec.Command(config.FactorioBinary, args...).Output()
	if err != nil {
		log.Printf("Error in creating Factorio save: %s", err)
		log.Println(string(cmdOutput))
		return "", err
	}

	result := string(cmdOutput)

	return result, nil
}

func GetLatestSave() (save Save, err error) {
	saves, err := ListSaves()
	if err != nil {
		return save, err
	}
	for _, item := range saves {
		if save.LastMod.Before(item.LastMod) {
			save = Save{
				Name:    item.Name,
				LastMod: item.LastMod,
				Size:    item.Size,
			}
		}
	}

	return
}
