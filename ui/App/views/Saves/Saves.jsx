import React, {useEffect, useState} from "react";
import {createPortal} from "react-dom";
import savesResource from "../../../api/resources/saves";
import Panel from "../../components/Panel";
import CreateSaveForm from "./components/CreateSaveForm";
import UploadSaveForm from "./components/UploadSaveForm";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faClone,
    faDownload,
    faList,
    faPen,
    faRotateLeft,
    faRotateRight,
    faSave,
    faTrashAlt
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Label from "../../components/Label";
import {formatFactorioVersion} from "../../utils/version";
import FreshRestartConfirmDialog from "./components/FreshRestartConfirmDialog";

const formatSize = size => `${parseFloat(size / 1024 / 1024).toFixed(3)} MB`;
const formatDate = value => value ? new Date(value).toLocaleString() : "Never";
const formatPlayTime = ticks => {
    if (!ticks) {
        return "Unavailable";
    }

    const totalMinutes = Math.floor(ticks / 60 / 60);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
};
const saveMapName = save => save.metadata?.map_name || "Unavailable";
const saveFactorioVersion = save => save.metadata?.factorio_version
    ? formatFactorioVersion(save.metadata.factorio_version)
    : "Unavailable";
const saveModsList = save => {
    const mods = save.metadata?.mods || [];
    return mods.map(mod => `${mod.name} ${mod.version}`).join(", ");
};
const saveModsCount = save => save.metadata?.mods?.length || 0;
const saveModsLabel = save => {
    const count = saveModsCount(save);
    if (count === 0) {
        return "Unavailable";
    }

    return `${count} ${count === 1 ? "mod" : "mods"}`;
};

const SaveModsCell = ({save}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPopoverHovered, setIsPopoverHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [position, setPosition] = useState({top: 0, left: 0});
    const count = saveModsCount(save);
    if (count === 0) {
        return "Unavailable";
    }

    const label = saveModsLabel(save);
    const mods = save.metadata?.mods || [];
    const isOpen = isHovered || isPopoverHovered || isFocused || isPinned;
    const updatePosition = target => {
        const rect = target.getBoundingClientRect();
        const width = Math.min(320, window.innerWidth - 24);
        const height = 288;
        const margin = 12;
        const top = rect.bottom + 8 + height > window.innerHeight
            ? Math.max(margin, rect.top - height - 8)
            : rect.bottom + 8;
        setPosition({
            top,
            left: Math.min(Math.max(rect.left, margin), window.innerWidth - width - margin)
        });
    };

    return (
        <div
            className="inline-block"
            onMouseEnter={event => {
                updatePosition(event.currentTarget);
                setIsHovered(true);
            }}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                type="button"
                className="py-1 px-2 bg-gray-light hover:bg-orange hover:glow-orange accentuated text-black font-bold whitespace-nowrap"
                aria-expanded={isOpen}
                aria-label={`${label}: ${saveModsList(save)}`}
                onClick={event => {
                    updatePosition(event.currentTarget);
                    setIsPinned(!isPinned);
                }}
                onFocus={event => {
                    updatePosition(event.currentTarget);
                    setIsFocused(true);
                }}
                onBlur={() => setIsFocused(false)}
            >
                <FontAwesomeIcon icon={faList} className="mr-1"/>
                {label}
            </button>
            {isOpen && createPortal(
                <div
                    className="fixed z-50 max-h-72 overflow-y-auto bg-black text-white shadow-lg accentuated p-3 whitespace-normal"
                    style={{top: position.top, left: position.left, width: "min(20rem, calc(100vw - 24px))"}}
                    onMouseEnter={() => setIsPopoverHovered(true)}
                    onMouseLeave={() => setIsPopoverHovered(false)}
                >
                    {mods.map(mod =>
                        <div key={`${mod.name}-${mod.version}`} className="text-sm leading-6">
                            <span className="font-bold">{mod.name}</span> {mod.version}
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

const Saves = ({serverStatus}) => {

    const [saves, setSaves] = useState([]);
    const [backups, setBackups] = useState([]);
    const [backupSchedule, setBackupSchedule] = useState(null);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [isRunningSchedule, setIsRunningSchedule] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({isOpen: false, save: null});
    const [nameDialog, setNameDialog] = useState({isOpen: false, action: null, save: null, title: "", value: ""});
    const [restoreDialog, setRestoreDialog] = useState({isOpen: false, backup: null, value: ""});
    const [freshRestartDialog, setFreshRestartDialog] = useState({isOpen: false, save: null});
    const [isFreshRestarting, setIsFreshRestarting] = useState(false);
    const serverRunning = Boolean(serverStatus?.running);

    const updateList = () => {
        Promise.all([savesResource.list(), savesResource.backups(), savesResource.backupSchedule()])
            .then(([res, backupRes, scheduleRes]) => {
                if (res) {
                    setSaves(res);
                }
                if (backupRes) {
                    setBackups(backupRes);
                }
                if (scheduleRes) {
                    setBackupSchedule(scheduleRes);
                }
            })

    }

    useEffect(() => {
        updateList()
    }, []);

    const deleteSave = async (save, backupFirst = false) => {
        if (backupFirst) {
            await savesResource.backup(save);
        }
        const res = await savesResource.delete(save);
        if (res) {
            updateList()
        }
    }

    const backupSave = async (save) => {
        const res = await savesResource.backup(save);
        if (res) {
            updateList()
        }
    }

    const submitNameAction = async () => {
        const {action, save, value} = nameDialog;
        if (!value) {
            return;
        }
        if (action === "rename") {
            await savesResource.rename(save, value);
        } else {
            await savesResource.duplicate(save, value);
        }
        setNameDialog({...nameDialog, isOpen: false});
        updateList();
    }

    const restoreBackup = async () => {
        const {backup, value} = restoreDialog;
        await savesResource.restore(backup, value || backup.save_name);
        setRestoreDialog({...restoreDialog, isOpen: false});
        updateList();
    }

    const freshRestart = async (save) => {
        setIsFreshRestarting(true);
        try {
            const res = await savesResource.freshRestart(save);
            if (res) {
                window.flash(`Fresh restart complete. New save: ${res.new_save_name}`, "success");
                updateList();
            }
        } catch (err) {
            const msg = err?.response?.data || err?.message || "Fresh restart failed";
            window.flash(typeof msg === "string" ? msg : "Fresh restart failed", "error");
        } finally {
            setIsFreshRestarting(false);
            setFreshRestartDialog({isOpen: false, save: null});
        }
    }

    const openNameDialog = (action, save) => {
        setNameDialog({
            isOpen: true,
            action,
            save,
            title: action === "rename" ? "Rename Save" : "Duplicate Save",
            value: action === "rename" ? save.name : `copy-${save.name}`
        });
    }

    const updateScheduleField = (field, value) => {
        setBackupSchedule(schedule => ({
            ...schedule,
            [field]: value
        }));
    }

    const saveSchedule = () => {
        setIsSavingSchedule(true);
        savesResource
            .updateBackupSchedule({
                ...backupSchedule,
                interval_minutes: Number(backupSchedule.interval_minutes),
                retention: Number(backupSchedule.retention),
            })
            .then(setBackupSchedule)
            .finally(() => setIsSavingSchedule(false));
    }

    const runSchedule = () => {
        setIsRunningSchedule(true);
        savesResource
            .runBackupSchedule()
            .then(result => {
                setBackupSchedule(result.schedule);
                updateList();
            })
            .finally(() => setIsRunningSchedule(false));
    }

    return (
        <>
            <div className="lg:flex mb-6">
                <Panel
                    title="Create Save"
                    className="lg:w-1/2 lg:mr-3 mb-6 lg:mb-0"
                    content={
                        serverRunning
                            ? <p className="text-red-light pt-4 pb-24">
                                Create a new Save is only possible if the Factorio server is
                                not running.
                            </p>
                            : <CreateSaveForm onSuccess={updateList}/>
                    }
                />
                <Panel
                    title="Upload Save"
                    className="lg:w-1/2 lg:ml-3"
                    content={<UploadSaveForm onSuccess={updateList}/>}
                />
            </div>

            <Panel
                className="mb-4"
                title="Scheduled Backups"
                content={
                    backupSchedule &&
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <label className="flex items-center text-white font-bold">
                            <input className="mr-2" type="checkbox" checked={backupSchedule.enabled}
                                   onChange={event => updateScheduleField("enabled", event.target.checked)}/>
                            Enabled
                        </label>
                        <div>
                            <Label text="Every minutes" htmlFor="interval_minutes"/>
                            <Input type="number" min="1" value={backupSchedule.interval_minutes}
                                   onChange={event => updateScheduleField("interval_minutes", event.target.value)}/>
                        </div>
                        <div>
                            <Label text="Retention" htmlFor="retention"/>
                            <Input type="number" min="1" value={backupSchedule.retention}
                                   onChange={event => updateScheduleField("retention", event.target.value)}/>
                        </div>
                        <div>
                            <Label text="Mode" htmlFor="mode"/>
                            <select className="shadow appearance-none border w-full py-2 px-3 text-black"
                                    value={backupSchedule.mode}
                                    onChange={event => updateScheduleField("mode", event.target.value)}>
                                <option value="latest">Latest save</option>
                                <option value="all">All saves</option>
                            </select>
                        </div>
                        <div className="text-sm">
                            <div>Last: {formatDate(backupSchedule.last_run)}</div>
                            <div>Next: {formatDate(backupSchedule.next_run)}</div>
                        </div>
                        <div>
                            <Button size="sm" className="mr-2" isLoading={isSavingSchedule} onClick={saveSchedule}>Save</Button>
                            <Button size="sm" isLoading={isRunningSchedule} onClick={runSchedule}>Run now</Button>
                        </div>
                    </div>
                }
            />

            <Panel
                className="mb-4"
                title="Saves"
                content={
                    <div className="overflow-x-auto w-full">
                        <table className="w-full">
                            <thead>
                            <tr className="text-left py-1">
                                <th>Name</th>
                                <th>Map</th>
                                <th>Play Time</th>
                                <th>Factorio</th>
                                <th>Mods</th>
                                <th>Last Modified At</th>
                                <th>Size</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {saves.map(save =>
                                <tr className="py-2 md:py-1" key={save.name}>
                                    <td className="pr-4">{save.name}</td>
                                    <td className="pr-4">{saveMapName(save)}</td>
                                    <td className="pr-4 whitespace-nowrap">{formatPlayTime(save.metadata?.play_time_ticks)}</td>
                                    <td className="pr-4">{saveFactorioVersion(save)}</td>
                                    <td className="pr-4"><SaveModsCell save={save}/></td>
                                    <td className="pr-4">{(new Date(save.last_mod)).toLocaleString()}</td>
                                    <td className="pr-4">{formatSize(save.size)}</td>
                                    <td>
                                        <a href={`/api/saves/dl/${save.name}`} className="mr-2">
                                            <FontAwesomeIcon
                                                className="text-gray-light cursor-pointer hover:text-orange"
                                                title="Download"
                                                icon={faDownload}/>
                                        </a>
                                        <FontAwesomeIcon className="text-gray-light cursor-pointer hover:text-orange mr-2"
                                                         title="Backup"
                                                         onClick={() => backupSave(save)} icon={faSave}/>
                                        <FontAwesomeIcon className={`${serverRunning ? "text-gray cursor-not-allowed" : "text-gray-light cursor-pointer hover:text-orange"} mr-2`}
                                                         title="Rename"
                                                         onClick={() => !serverRunning && openNameDialog("rename", save)} icon={faPen}/>
                                        <FontAwesomeIcon className="text-gray-light cursor-pointer hover:text-orange mr-2"
                                                         title="Duplicate"
                                                         onClick={() => openNameDialog("duplicate", save)} icon={faClone}/>
                                        <FontAwesomeIcon className={`${!serverRunning ? "text-gray cursor-not-allowed" : "text-gray-light cursor-pointer hover:text-orange"} mr-2`}
                                                         title="Fresh Restart"
                                                         onClick={() => serverRunning && setFreshRestartDialog({isOpen: true, save})} icon={faRotateRight}/>
                                        <FontAwesomeIcon className="text-red cursor-pointer hover:text-red-light mr-2"
                                                         title="Delete"
                                                         onClick={() => setDeleteDialog({isOpen: true, save})} icon={faTrashAlt}/>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                }
            />
            <Panel
                className="mb-4"
                title="Save Backups"
                content={
                    <div className="overflow-x-auto w-full">
                        <table className="w-full">
                            <thead>
                            <tr className="text-left py-1">
                                <th>Backup</th>
                                <th>Save</th>
                                <th>Created At</th>
                                <th>Size</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {backups.map(backup =>
                                <tr className="py-2 md:py-1" key={backup.name}>
                                    <td className="pr-4">{backup.name}</td>
                                    <td className="pr-4">{backup.save_name}</td>
                                    <td className="pr-4">{(new Date(backup.last_mod)).toLocaleString()}</td>
                                    <td className="pr-4">{formatSize(backup.size)}</td>
                                    <td>
                                        <FontAwesomeIcon className={`${serverRunning ? "text-gray cursor-not-allowed" : "text-gray-light cursor-pointer hover:text-orange"} mr-2`}
                                                         title="Restore"
                                                         onClick={() => !serverRunning && setRestoreDialog({isOpen: true, backup, value: backup.save_name})}
                                                         icon={faRotateLeft}/>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                }
            />
            <ConfirmDialog
                title="Delete Save"
                isOpen={deleteDialog.isOpen}
                close={() => setDeleteDialog({isOpen: false, save: null})}
                content={
                    <>
                        <p className="mb-4">Delete {deleteDialog.save?.name}?</p>
                        <Button size="sm" className="mr-2" onClick={() => deleteSave(deleteDialog.save, true).finally(() => setDeleteDialog({isOpen: false, save: null}))}>
                            Backup Before Delete
                        </Button>
                    </>
                }
                onSuccess={() => deleteSave(deleteDialog.save)}
            />
            <Modal
                title={nameDialog.title}
                isOpen={nameDialog.isOpen}
                content={
                    <div className="mb-4">
                        <Input value={nameDialog.value} onChange={event => setNameDialog({...nameDialog, value: event.target.value})}/>
                    </div>
                }
                actions={
                    <>
                        <Button size="sm" type="danger" className="mr-2" onClick={() => setNameDialog({...nameDialog, isOpen: false})}>Cancel</Button>
                        <Button size="sm" type="success" onClick={submitNameAction}>Save</Button>
                    </>
                }
            />
            <Modal
                title="Restore Save Backup"
                isOpen={restoreDialog.isOpen}
                content={
                    <div className="mb-4">
                        <Input value={restoreDialog.value} onChange={event => setRestoreDialog({...restoreDialog, value: event.target.value})}/>
                    </div>
                }
                actions={
                    <>
                        <Button size="sm" type="danger" className="mr-2" onClick={() => setRestoreDialog({...restoreDialog, isOpen: false})}>Cancel</Button>
                        <Button size="sm" type="success" onClick={restoreBackup}>Restore</Button>
                    </>
                }
            />
            <FreshRestartConfirmDialog
                isOpen={freshRestartDialog.isOpen}
                close={() => setFreshRestartDialog({isOpen: false, save: null})}
                onSuccess={() => freshRestart(freshRestartDialog.save)}
                saveName={freshRestartDialog.save?.name}
            />
        </>
    )
}

export default Saves;
