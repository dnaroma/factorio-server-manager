import React, {useState} from "react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import Label from "../../../components/Label";
import Input from "../../../components/Input";
import modsResource from "../../../../api/resources/mods";

const ImportModPack = ({onSuccess}) => {
    const [isImporting, setIsImporting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [file, setFile] = useState(null);

    const importModPack = event => {
        event.preventDefault();
        if (!file) {
            return;
        }

        setIsImporting(true);
        modsResource.packs
            .import(name, file)
            .then(onSuccess)
            .finally(() => {
                setIsImporting(false);
                setIsOpen(false);
                setName("");
                setFile(null);
            });
    };

    return <>
        <Button size="sm" className="ml-2" onClick={() => setIsOpen(true)}>Import ModPack</Button>
        <Modal title="Import Mod Pack" isOpen={isOpen} content={
            <form onSubmit={importModPack}>
                <div className="mb-4">
                    <Label text="Name" htmlFor="name"/>
                    <Input value={name} onChange={event => setName(event.target.value)}/>
                </div>
                <div className="mb-4">
                    <Label text="Zip file" htmlFor="mod_pack"/>
                    <input className="block w-full text-white" type="file" accept=".zip"
                           onChange={event => setFile(event.target.files[0])}/>
                </div>
                <Button size="sm" isLoading={isImporting} isDisabled={!file} isSubmit={true}>Import</Button>
            </form>
        }
        actions={
            <Button onClick={() => setIsOpen(false)} size="sm" type="danger">Cancel</Button>
        }
        />
    </>
}

export default ImportModPack;
