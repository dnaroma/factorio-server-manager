import React, {useState} from "react";
import {faClone, faEdit, faExchangeAlt, faSpinner, faTrashAlt, faUpload} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import modsResource from "../../../../api/resources/mods";
import ModList from "./ModList";
import ConfirmDialog from "../../../components/ConfirmDialog";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import Label from "../../../components/Label";
import Input from "../../../components/Input";

const countDiff = diff => {
    if (!diff) {
        return 0;
    }

    return diff.added.length + diff.removed.length + diff.updated.length + diff.enabled.length + diff.disabled.length;
};

const DiffList = ({title, items, render}) => (
    <div className="mb-3">
        <h3 className="text-orange font-bold">{title}</h3>
        {items.length === 0 ? "None" : items.map(render)}
    </div>
);

const ModPack = ({modPack, reloadModPacks, factorioVersion, reloadMods, disabled = false}) => {

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadModPackDialogOpen, setIsLoadModPackDialogOpen] = useState(false);
    const [isCloneOpen, setIsCloneOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isMetadataOpen, setIsMetadataOpen] = useState(false);
    const [cloneName, setCloneName] = useState(`${modPack.name}-copy`);
    const [cloneDescription, setCloneDescription] = useState(modPack.description || "");
    const [renameName, setRenameName] = useState(modPack.name);
    const [description, setDescription] = useState(modPack.description || "");
    const [diff, setDiff] = useState(null);
    const [validation, setValidation] = useState(null);

    const deleteModPack = modName => {
        return modsResource.packs
            .delete(modName)
            .then(reloadModPacks)
    }

    const toggleMod = modName => {
        return modsResource
            .packs
            .mods
            .toggle(modPack.name, modName)
            .then(reloadModPacks)
    }

    const updateMod = version => {
        return modsResource
            .packs
            .mods
            .update(modPack.name, version)
            .then(reloadModPacks)
    }

    const deleteMod = modName => {
        return modsResource
            .packs
            .mods
            .delete(modPack.name, modName)
            .then(reloadModPacks)
    }

    const loadModPack = name => {
        setIsLoading(true)
        return modsResource.packs
            .validate(name)
            .then(result => {
                setValidation(result);
                if (!result.valid) {
                    return null;
                }

                return modsResource.packs
                    .load(name)
                    .then(reloadMods)
                    .then(reloadModPacks);
            })
            .finally(() => setIsLoading(false))
    }

    const cloneModPack = event => {
        event.preventDefault();
        return modsResource.packs
            .clone(modPack.name, cloneName, cloneDescription)
            .then(reloadModPacks)
            .finally(() => setIsCloneOpen(false));
    }

    const renameModPack = event => {
        event.preventDefault();
        return modsResource.packs
            .rename(modPack.name, renameName)
            .then(reloadModPacks)
            .finally(() => setIsRenameOpen(false));
    }

    const saveMetadata = event => {
        event.preventDefault();
        return modsResource.packs
            .metadata(modPack.name, {
                description,
                validated_factorio_version: modPack.validated_factorio_version || "",
            })
            .then(reloadModPacks)
            .finally(() => setIsMetadataOpen(false));
    }

    const fetchDiff = () => {
        return modsResource.packs
            .diff(modPack.name)
            .then(setDiff);
    }

    const validateModPack = () => {
        return modsResource.packs
            .validate(modPack.name)
            .then(setValidation);
    }

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg text-dirty-white mb-1 inline">{modPack.name}</h2>
                    {modPack.description && <div className="text-sm text-gray-light">{modPack.description}</div>}
                    <div className="text-xs text-gray-light">
                        Validated Factorio: {modPack.validated_factorio_version || "Never"}
                    </div>
                </div>
                <div className="flex space-x-2">
                    <FontAwesomeIcon className="text-orange cursor-pointer hover:text-orange-light inline"
                                     onClick={() => setIsMetadataOpen(true)}
                                     icon={faEdit}
                    />
                    <FontAwesomeIcon className="text-orange cursor-pointer hover:text-orange-light inline"
                                     onClick={() => setIsCloneOpen(true)}
                                     icon={faClone}
                    />
                    <FontAwesomeIcon className="text-orange cursor-pointer hover:text-orange-light inline"
                                     onClick={() => setIsRenameOpen(true)}
                                     icon={faExchangeAlt}
                    />
                    {
                        !disabled &&
                        <>
                            <FontAwesomeIcon className="text-blue cursor-pointer hover:text-blue-light inline"
                                             onClick={() => setIsLoadModPackDialogOpen(true)}
                                             spin={isLoading}
                                             icon={isLoading ? faSpinner : faUpload}
                            />
                            <ConfirmDialog
                                title="Load ModPack"
                                content={`Loading the ModPack ${modPack.name} will remove all installed Mods.`}
                                isOpen={isLoadModPackDialogOpen}
                                close={() => setIsLoadModPackDialogOpen(false)}
                                onSuccess={() => loadModPack(modPack.name)}
                            />
                        </>
                    }

                    <FontAwesomeIcon className="text-red cursor-pointer hover:text-red-light inline"
                                     onClick={() => deleteModPack(modPack.name)} icon={faTrashAlt}/>
                </div>
            </div>
            <div className="my-3">
                <Button size="sm" className="mr-2" onClick={fetchDiff}>Show Diff</Button>
                <Button size="sm" className="mr-2" onClick={validateModPack}>Validate</Button>
                <a className="bg-gray-light py-1 px-2 hover:glow-orange hover:bg-orange inline-block accentuated text-black font-bold"
                   href={modsResource.packs.downloadURL(modPack.name)}>Export</a>
            </div>
            {validation &&
                <div className={`mb-3 ${validation.valid ? "text-green" : "text-red"}`}>
                    {validation.valid ? "Validation passed" : validation.issues.join(", ")}
                </div>
            }
            {diff &&
                <div className="mb-4 border border-gray-light p-3">
                    <h3 className="font-bold mb-2">Load diff ({countDiff(diff)} changes)</h3>
                    <DiffList title="Added" items={diff.added} render={mod => <div key={mod.name}>{mod.title} {mod.version}</div>}/>
                    <DiffList title="Removed" items={diff.removed} render={mod => <div key={mod.name}>{mod.title} {mod.version}</div>}/>
                    <DiffList title="Updated" items={diff.updated} render={mod => <div key={mod.name}>{mod.name}: {mod.active.version} → {mod.mod_pack.version}</div>}/>
                    <DiffList title="Enabled" items={diff.enabled} render={mod => <div key={mod.name}>{mod.title}</div>}/>
                    <DiffList title="Disabled" items={diff.disabled} render={mod => <div key={mod.name}>{mod.title}</div>}/>
                </div>
            }
            <ModList mods={modPack.mods.mods}
                     factorioVersion={factorioVersion}
                     toggleMod={toggleMod}
                     updateMod={updateMod}
                     deleteMod={deleteMod}
                     disabled={disabled}
            />
            <Modal title="Clone Mod Pack" isOpen={isCloneOpen} content={
                <form onSubmit={cloneModPack}>
                    <div className="mb-4">
                        <Label text="Name" htmlFor="name"/>
                        <Input value={cloneName} onChange={event => setCloneName(event.target.value)}/>
                    </div>
                    <div className="mb-4">
                        <Label text="Description" htmlFor="description"/>
                        <Input value={cloneDescription} onChange={event => setCloneDescription(event.target.value)}/>
                    </div>
                    <Button size="sm" isSubmit={true}>Clone</Button>
                </form>
            } actions={<Button onClick={() => setIsCloneOpen(false)} size="sm" type="danger">Cancel</Button>}/>
            <Modal title="Rename Mod Pack" isOpen={isRenameOpen} content={
                <form onSubmit={renameModPack}>
                    <div className="mb-4">
                        <Label text="Name" htmlFor="name"/>
                        <Input value={renameName} onChange={event => setRenameName(event.target.value)}/>
                    </div>
                    <Button size="sm" isSubmit={true}>Rename</Button>
                </form>
            } actions={<Button onClick={() => setIsRenameOpen(false)} size="sm" type="danger">Cancel</Button>}/>
            <Modal title="Edit Mod Pack" isOpen={isMetadataOpen} content={
                <form onSubmit={saveMetadata}>
                    <div className="mb-4">
                        <Label text="Description" htmlFor="description"/>
                        <Input value={description} onChange={event => setDescription(event.target.value)}/>
                    </div>
                    <Button size="sm" isSubmit={true}>Save</Button>
                </form>
            } actions={<Button onClick={() => setIsMetadataOpen(false)} size="sm" type="danger">Cancel</Button>}/>
        </div>
    )
}

export default ModPack;
