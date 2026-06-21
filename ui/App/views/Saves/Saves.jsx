import React, {useEffect, useState} from "react";
import savesResource from "../../../api/resources/saves";
import Panel from "../../components/Panel";
import CreateSaveForm from "./components/CreateSaveForm";
import UploadSaveForm from "./components/UploadSaveForm";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faClone,
    faDownload,
    faPen,
    faRotateLeft,
    faSave,
    faTrashAlt
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import Input from "../../components/Input";

const Saves = ({serverStatus}) => {

    const [saves, setSaves] = useState([]);
    const [backups, setBackups] = useState([]);
    const [deleteDialog, setDeleteDialog] = useState({isOpen: false, save: null});
    const [nameDialog, setNameDialog] = useState({isOpen: false, action: null, save: null, title: "", value: ""});
    const [restoreDialog, setRestoreDialog] = useState({isOpen: false, backup: null, value: ""});
    const serverRunning = Boolean(serverStatus?.running);

    const updateList = () => {
        Promise.all([savesResource.list(), savesResource.backups()])
            .then(([res, backupRes]) => {
                if (res) {
                    setSaves(res);
                }
                if (backupRes) {
                    setBackups(backupRes);
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

    const openNameDialog = (action, save) => {
        setNameDialog({
            isOpen: true,
            action,
            save,
            title: action === "rename" ? "Rename Save" : "Duplicate Save",
            value: action === "rename" ? save.name : `copy-${save.name}`
        });
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
                title="Saves"
                content={
                    <div className="overflow-x-auto w-full">
                        <table className="w-full">
                            <thead>
                            <tr className="text-left py-1">
                                <th>Name</th>
                                <th>Last Modified At</th>
                                <th>Size</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {saves.map(save =>
                                <tr className="py-2 md:py-1" key={save.name}>
                                    <td className="pr-4">{save.name}</td>
                                    <td className="pr-4">{(new Date(save.last_mod)).toLocaleString()}</td>
                                    <td className="pr-4">{parseFloat(save.size / 1024 / 1024).toFixed(3)} MB</td>
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
                                    <td className="pr-4">{parseFloat(backup.size / 1024 / 1024).toFixed(3)} MB</td>
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
        </>
    )
}

export default Saves;
