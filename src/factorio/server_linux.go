package factorio

import (
	"errors"
	"fmt"
	"log"
	"os"
	"time"
)

func (server *Server) Kill() error {
	markExpectedStop(true)
	err := server.Cmd.Process.Signal(os.Kill)
	if err != nil {
		if err.Error() == "os: process already finished" {
			server.SetRunning(false)
			return err
		}
		log.Printf("Error sending SIGKILL to Factorio process: %s", err)
		return err
	}
	server.SetRunning(false)
	AppendLifecycleEvent("kill", "Forced Factorio server to exit")
	log.Printf("Sent SIGKILL to Factorio process. Factorio forced to exit.")

	if server.Rcon != nil {
		err = server.Rcon.Close()
	}
	if err != nil {
		log.Printf("Error close rcon connection: %s", err)
	}

	return nil
}

func (server *Server) Stop() error {
	markExpectedStop(true)
	err := server.Cmd.Process.Signal(os.Interrupt)
	if err != nil {
		if err.Error() == "os: process already finished" {
			server.SetRunning(false)
			return err
		}
		log.Printf("Error sending SIGINT to Factorio process: %s", err)
		return err
	}
	log.Printf("Sent SIGINT to Factorio process. Factorio shutting down...")
	AppendLifecycleEvent("stop", "Sent graceful stop signal to Factorio server")

	if server.Rcon != nil {
		err = server.Rcon.Close()
	}
	if err != nil {
		log.Printf("Error close rcon connection: %s", err)
	}

	return nil
}

func (server *Server) StopWithTimeout(timeoutSeconds int) error {
	if timeoutSeconds <= 0 {
		timeoutSeconds = 30
	}
	if !server.GetRunning() {
		return errors.New("Factorio server is not running")
	}
	if err := server.Stop(); err != nil {
		return err
	}

	deadline := time.Now().Add(time.Duration(timeoutSeconds) * time.Second)
	for time.Now().Before(deadline) {
		if !server.GetRunning() {
			return nil
		}
		time.Sleep(time.Second)
	}

	AppendLifecycleEvent("stop_timeout", fmt.Sprintf("Graceful stop timed out after %d seconds, killing server", timeoutSeconds))
	return server.Kill()
}

func (server *Server) RestartWithProfile(config LifecycleConfig) error {
	if server.GetRunning() {
		if err := server.StopWithTimeout(config.GracefulStopTimeout); err != nil {
			return err
		}
	}
	if config.StartupProfile.BindIP != "" {
		server.BindIP = config.StartupProfile.BindIP
	}
	if config.StartupProfile.Port > 0 {
		server.Port = config.StartupProfile.Port
	}
	if config.StartupProfile.Savefile != "" {
		server.Savefile = config.StartupProfile.Savefile
	}
	if config.StartupProfile.ModPack != "" {
		modPacks, err := NewModPackMap()
		if err != nil {
			return err
		}
		modPack, ok := modPacks[config.StartupProfile.ModPack]
		if !ok {
			return fmt.Errorf("mod pack %s not found", config.StartupProfile.ModPack)
		}
		if err := modPack.LoadModPack(); err != nil {
			return err
		}
	}
	if _, ok := server.Settings["visibility"]; ok {
		server.Settings["visibility"] = map[string]bool{
			"public": config.StartupProfile.Public,
			"lan":    config.StartupProfile.LAN,
		}
	}
	go func() {
		if err := server.Run(); err != nil {
			log.Printf("Error restarting Factorio server: %s", err)
		}
	}()
	return nil
}

func (server *Server) checkProcessHealth(text string) {
	// ignore
}
