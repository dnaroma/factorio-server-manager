import Panel from "../components/Panel";
import React, {useEffect, useState} from "react";
import settingsResource from "../../api/resources/settings";
import Input from "../components/Input";
import Label from "../components/Label";
import Checkbox from "../components/Checkbox";
import InputPassword from "../components/InputPassword";
import Button from "../components/Button";
import {useForm} from "react-hook-form";

const ServerSettings = () => {

    const [settings, setSettings] = useState();
    const [numberInputs, setNumberInputs] = useState([]);

    const {register, handleSubmit} = useForm();

    const normalizeServerSettings = settings => {
        const visibility = settings?.visibility || {};

        return {
            ...settings,
            visibility: {
                public: visibility.public ?? true,
                lan: visibility.lan ?? true,
            },
            _comment_visibility: settings?._comment_visibility || "public: publish the game on the Factorio public game list; lan: announce the game on LAN.",
        };
    };

    const fetchSettings = async () => {
        const res = await settingsResource.server.list();
        setSettings(normalizeServerSettings(res));
    };

    const commaSeparatedToList = value => {
        if (Array.isArray(value)) {
            return value;
        }

        if (!value) {
            return [];
        }

        return value.split(',').map(item => item.trim()).filter(Boolean);
    };

    const saveServerSettings = data => {
        data.tags = commaSeparatedToList(data.tags);
        data.admins = commaSeparatedToList(data.admins);

        numberInputs.forEach(numberInput => {
            data[numberInput] = parseInt(data[numberInput]);
        });

        Object.keys(settings).map(key => {
            if (key.startsWith("_comment")) {
                data[key] = settings[key];
            }
        });
       settingsResource.server.update(data)
           .then(() => {
               fetchSettings()
                   .then(() => window.flash("Settings saved.", "green"))
           });
    }

    useEffect(() => {
        fetchSettings();
    }, []);

    const formTypeField = (name, value, label = null) => {
        if (name.startsWith("_comment_")) {
            return null;
        }

        switch (typeof value) {
            case "undefined":
                break;
            case "function":
                break;
            case "symbol":
                break;
            case "bigint":
                break;
            case "number":

                if(numberInputs.indexOf(name) === -1) {
                    setNumberInputs(old => [...old, name])
                }

                return (
                    <>
                        <Label htmlFor={name} text={label}/>
                        <Input type="number" register={register(name)} defaultValue={value} />
                    </>
                )
            case "string":
                if (name.includes("password")) {
                    return (
                        <>
                            <Label htmlFor={name} text={label}/>
                            <InputPassword register={register(name)} defaultValue={value}/>
                        </>
                    )
                } else {
                    return (
                        <>
                            <Label htmlFor={name} text={label}/>
                            <Input register={register(name)} defaultValue={value}/>
                        </>
                    )
                }
            case "boolean":
                return (
                    <Checkbox checked={value} text={label} register={register(name)}/>
                )
            case "object":
                if (Array.isArray(value)) {
                    return (
                        <>
                            <Label htmlFor={name} text={label}/>
                            <Input register={register(name)} defaultValue={value.join(',')}/>
                        </>
                    )
                } else if (name.includes("visibility")) {
                    return (
                        <>
                            <Label text="Visibility"/>
                            <div className="flex">
                                {Object.keys(value).map(key => <div className="mr-4" key={`visibility-${key}`}>
                                    <Checkbox checked={value[key]} register={register(`visibility.${key}`)} text={key}/>
                                </div>)}
                            </div>
                        </>
                    )
                }
                break;
            default:
                return (
                    <>
                        <Label htmlFor={name} text={label}/>
                        <Input register={register(name)} defaultValue={value}/>
                    </>
                )
        }
    }

    return (
        <form className="mb-4" onSubmit={handleSubmit(saveServerSettings)}>
            <Panel
                title="Server Settings"
                content={
                    <>
                        {settings && Object.keys(settings).map(key => {
                            if (key.startsWith("_comment_")) {
                                return null;
                            }

                            const value = settings[key]
                            const label = key.replaceAll('_', ' ')
                            const comment = settings["_comment_" + key]

                            return (
                                <div className="mb-4" key={`wrapper-${key}`}>
                                    {formTypeField(key, value, label)}
                                    <p className="text-sm italic">{comment}</p>
                                </div>
                            )
                        })}
                    </>
                }
                actions={
                    <Button isSubmit={true} type="success">Save</Button>
                }
            />
        </form>
    )
}

export default ServerSettings;
