import React, {useEffect, useState} from "react";
import savesResource from "../../../../api/resources/saves";
import Select from "../../../components/Select";
import Label from "../../../components/Label";
import {useForm} from "react-hook-form";
import Button from "../../../components/Button";
import modResource from "../../../../api/resources/mods";
import FactorioLogin from "./AddMod/components/FactorioLogin";
import ConfirmDialog from "../../../components/ConfirmDialog";

const LoadMods = ({refreshMods}) => {

    const [saves, setSaves] = useState([]);
    const {register, reset, handleSubmit} = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);
    const [isFactorioAuthenticated, setIsFactorioAuthenticated] = useState(false);
    const [loadModsData, setLoadModsData] = useState(undefined);

    useEffect(() => {
        (async () => {
            setIsFactorioAuthenticated(await modResource.portal.status())

            const s = await savesResource.list()
            setSaves(s);
            if (s.length > 0) {
                setIsDisabled(false);
            }
            reset();
        })();
    }, []);

    const loadModsRequested = data => {
        if (!data.save) {
            window.flash("Select a save file first.", "red");
            return;
        }
        setIsLoading(true);
        setLoadModsData(data);
    }

    const loadMods = async data => {
        const saveHeader = await savesResource.mods(data.save).catch(() => {
            setIsLoading(false);
            setLoadModsData(undefined);
            window.flash(`Could not read mods from save file ${data.save}.`, "red");
        });
        if (!saveHeader) {
            return;
        }

        const mods = (saveHeader.mods || []).filter(mod => mod.name !== "base");
        if (mods.length === 0) {
            await modResource.deleteAll()
                .then(() => {
                    refreshMods();
                    window.flash(`Save file ${data.save} does not require portal mods. Installed mods were removed.`, "green");
                })
                .catch(() => {
                    window.flash(`Could not remove installed mods for save file ${data.save}.`, "red");
                })
                .finally(() => {
                    setIsLoading(false);
                    setLoadModsData(undefined);
                });
            return;
        }

        await modResource.deleteAll();
        await modResource.portal.installMultiple(mods)
            .then(() => {
                refreshMods();
                window.flash(`Mods are loaded from save file ${data.save}.`, "green");
            }).catch(() => {
                window.flash(`Could not install mods from save file ${data.save}.`, "red");
            }).finally(() => {
                setIsLoading(false);
                setLoadModsData(undefined);
            });
    }

    return isFactorioAuthenticated
        ? <form onSubmit={handleSubmit(loadModsRequested)}>
            <Label text="Save" htmlFor="save"/>
            <Select
                register={register('save')}
                className="mb-4"
                disabled={isDisabled}
                options={saves?.map(save => new Object({
                    name: save.name,
                    value: save.name
                }))}
            />
            <Button isSubmit={true} isDisabled={isDisabled} isLoading={isLoading}>Load</Button>
            <ConfirmDialog
                title="Load Mods from Save"
                content={`Loading the Mods from Save "${loadModsData?.save}" will remove all currently installed Mods.`}
                isOpen={loadModsData !== undefined}
                close={() => {
                    setIsLoading(false);
                    setLoadModsData(undefined);
                }}
                onSuccess={() => loadMods(loadModsData)}
            />
        </form>
        : <FactorioLogin setIsFactorioAuthenticated={setIsFactorioAuthenticated}/>
}

export default LoadMods;
