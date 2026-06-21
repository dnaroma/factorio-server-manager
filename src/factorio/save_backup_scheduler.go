package factorio

import (
	"log"
	"sync"
	"time"
)

var saveBackupSchedulerOnce sync.Once

func StartSaveBackupScheduler() {
	saveBackupSchedulerOnce.Do(func() {
		go func() {
			ticker := time.NewTicker(time.Minute)
			defer ticker.Stop()

			for {
				<-ticker.C
				schedule, err := LoadSaveBackupSchedule()
				if err != nil {
					log.Printf("error loading save backup schedule: %s", err)
					continue
				}
				if !schedule.Enabled {
					continue
				}
				if schedule.NextRun.IsZero() {
					schedule.NextRun = time.Now().UTC().Add(time.Duration(schedule.IntervalMinutes) * time.Minute)
					if _, err := SaveBackupScheduleConfig(schedule); err != nil {
						log.Printf("error saving save backup schedule: %s", err)
					}
					continue
				}
				if time.Now().UTC().Before(schedule.NextRun) {
					continue
				}

				if _, backups, err := RunScheduledSaveBackup(); err != nil {
					log.Printf("error running scheduled save backup: %s", err)
				} else {
					log.Printf("scheduled save backup completed, created %d backups", len(backups))
				}
			}
		}()
	})
}
