# Roadmap

This roadmap focuses on features that make Factorio Server Manager more useful for running and maintaining real Factorio servers.

## Near Term

### Mod Management

- Show mod portal metadata beside installed mods: latest version, release date, Factorio compatibility, dependencies, and changelog link.
- Separate mod updates into compatible, incompatible, and unknown groups.
- Add "update selected mods" instead of only single-mod and update-all flows.
- De-duplicate queued mod updates so one mod cannot be updated multiple times in one batch.
- Add dependency checks before enabling, disabling, deleting, or updating mods.
- Show why a mod is incompatible with the current Factorio version.

### Mod Packs

- Add clone, rename, and description fields for mod packs.
- Add a mod pack diff view showing mods added, removed, updated, enabled, or disabled before loading.
- Add dry-run validation before loading a mod pack into the active server.
- Add import and export for mod packs including `mod-list.json`, `mod-settings.dat`, and the mod zip files.
- Track the Factorio version a mod pack was last validated against.

### Save Management

- Add manual backup and restore for saves. Done.
- Add scheduled save backups with retention limits.
- Show save metadata where available: map name, play time, Factorio version, mods used, and last modified time.
- Add duplicate/rename save actions. Done.
- Add a "backup before delete" option for save removal. Done.

### Server Settings

- Group server settings by purpose instead of rendering the raw JSON structure.
- Add field-specific validation for visibility, autosave, AFK auto-kick, tags, max players, admins, and passwords.
- Add a preview of the exact `server-settings.json` changes before saving.
- Keep comments and unknown settings when writing back the settings file.
- Warn when a setting change requires the Factorio server to be restarted.

## Mid Term

### Factorio Version Management

- Show installed Factorio version, latest stable version, and latest experimental version.
- Add controlled upgrade and rollback flow from the UI.
- Require a save backup before upgrading or downgrading.
- Check save and mod compatibility before starting after a version change.
- Avoid re-downloading Factorio if the requested version is already installed.

### Server Lifecycle

- Add startup profiles for save, bind address, port, mod pack, and common server settings.
- Add scheduled restarts with warnings sent to chat before shutdown.
- Add graceful shutdown timeout controls before falling back to kill.
- Add server event history for starts, stops, crashes, updates, restores, and config changes.
- Show crash reason and recent Factorio log lines when the server exits unexpectedly.

### Player Administration

- Show online players through RCON.
- Add kick, ban, unban, promote, demote, whitelist, and unwhitelist actions.
- Add editable admin, banlist, and whitelist files from the UI.
- Add chat broadcast from the manager UI.
- Add player activity history when logs provide enough data.

### Console and Logs

- Add command history and common command shortcuts.
- Add log search, filtering, and downloadable log bundles.
- Split manager logs, Factorio logs, chat logs, and crash logs in the UI.
- Keep a bounded live console buffer so long-running sessions stay responsive.

## Long Term

### Scenario and Map Generation

- Add map generation presets and map exchange string support.
- Add UI for common map-gen and map-settings fields.
- Add preview/validation before creating a new save.
- Support creating saves from scenarios.

### Mods at Scale

- Cache mod portal responses with explicit refresh.
- Add dependency solver support for installing a mod plus required dependencies.
- Add mod collection templates for common server styles.
- Add alerts for abandoned or deprecated mods when mod portal data exposes it.

### Multi-Server Support

- Manage multiple Factorio instances from one UI.
- Keep separate saves, mods, settings, logs, and runtime state per instance.
- Add per-instance ports, RCON credentials, and startup profiles.
- Add a dashboard showing all server states.

### Operational Polish

- Add disk usage views for saves, mods, backups, and logs.
- Add health checks for the manager and Factorio process.
- Add metrics for player count, uptime, save size, mod count, backup age, and failed starts.
- Add a diagnostics page with config paths, binary version, writable directory checks, and recent errors.

## Supporting Work

- Harden save, mod, and mod pack filenames against unsafe paths.
- Add consistent JSON errors for API calls.
- Add frontend tests for mod, save, settings, and startup workflows.
- Add backend tests for file validation, mod pack loading, settings writes, and RCON actions.
- Document API routes used by the frontend.

## Release Criteria

Before calling a release production-ready:

- Save backup and restore are tested with real maps and mods.
- Mod updates validate compatibility and dependencies before changes are applied.
- Settings edits preserve unknown fields and warn about restart requirements.
- Server lifecycle actions report clear success or failure states.
- Destructive Factorio operations have confirmation, validation, and recovery paths.
