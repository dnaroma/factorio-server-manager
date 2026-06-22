import Panel from "../components/Panel";
import React, {useEffect, useState} from "react";
import settingsResource from "../../api/resources/settings";
import Input from "../components/Input";
import Label from "../components/Label";
import Checkbox from "../components/Checkbox";
import InputPassword from "../components/InputPassword";
import Button from "../components/Button";
import {useForm} from "react-hook-form";

const SETTINGS_GROUPS = [
    {
        title: "Discovery",
        description: "Public listing, server identity, and join limits.",
        fields: ["name", "description", "tags", "max_players", "visibility", "game_password"],
    },
    {
        title: "Access",
        description: "Factorio account verification, portal credentials, admins, and command permissions.",
        fields: ["require_user_verification", "username", "password", "token", "admins", "allow_commands"],
    },
    {
        title: "Saving",
        description: "Autosave cadence and server-side save behavior.",
        fields: ["autosave_interval", "autosave_slots", "autosave_only_on_server", "non_blocking_saving"],
    },
    {
        title: "Runtime",
        description: "Idle behavior, pause rules, and transfer limits.",
        fields: [
            "afk_autokick_interval",
            "auto_pause",
            "only_admins_can_pause_the_game",
            "max_upload_in_kilobytes_per_second",
            "max_upload_slots",
            "minimum_latency_in_ticks",
            "max_heartbeats_per_second",
            "ignore_player_limit_for_returning_players",
            "minimum_segment_size",
            "minimum_segment_size_peer_count",
        ],
    },
];

const FIELD_LABELS = {
    afk_autokick_interval: "AFK auto-kick interval",
    max_players: "Max players",
    max_upload_in_kilobytes_per_second: "Max upload KB/s",
    max_upload_slots: "Max upload slots",
    autosave_interval: "Autosave interval",
    autosave_slots: "Autosave slots",
    game_password: "Game password",
};

const LIST_FIELDS = ["admins", "tags"];
const NUMBER_FIELDS = [
    "afk_autokick_interval",
    "autosave_interval",
    "autosave_slots",
    "max_heartbeats_per_second",
    "max_players",
    "max_upload_in_kilobytes_per_second",
    "max_upload_slots",
    "minimum_latency_in_ticks",
    "minimum_segment_size",
    "minimum_segment_size_peer_count",
];
const PASSWORD_FIELDS = ["password", "token", "game_password"];
const RESTART_REQUIRED_FIELDS = new Set([
    "visibility",
    "game_password",
    "require_user_verification",
    "password",
    "token",
    "allow_commands",
    "autosave_interval",
    "autosave_slots",
    "autosave_only_on_server",
    "non_blocking_saving",
    "afk_autokick_interval",
    "max_upload_in_kilobytes_per_second",
    "max_upload_slots",
    "minimum_latency_in_ticks",
    "max_heartbeats_per_second",
    "ignore_player_limit_for_returning_players",
    "minimum_segment_size",
    "minimum_segment_size_peer_count",
]);

const formatLabel = name => FIELD_LABELS[name] || name.replaceAll('_', ' ');
const isPlainObject = value => typeof value === "object" && value !== null && !Array.isArray(value);

const ServerSettings = () => {

    const [settings, setSettings] = useState();
    const [preview, setPreview] = useState();
    const [validationErrors, setValidationErrors] = useState([]);

    const {register, handleSubmit, reset, getValues} = useForm();

    const normalizeServerSettings = settings => {
        const visibility = settings?.visibility || {};

        return {
            ...settings,
            visibility: {
                public: visibility.public ?? true,
                lan: visibility.lan ?? true,
            },
            _comment_visibility: settings?._comment_visibility || "public: publish the game on the Factorio public game list.\nlan: announce the game on LAN.",
        };
    };

    const fetchSettings = async () => {
        const res = await settingsResource.server.list();
        const normalizedSettings = normalizeServerSettings(res);
        setSettings(normalizedSettings);
        reset(formDefaults(normalizedSettings));
        setPreview(undefined);
        setValidationErrors([]);
    };

    const formDefaults = settings => {
        const defaults = {};

        Object.keys(settings || {}).forEach(key => {
            const value = settings[key];
            if (key.startsWith("_comment_")) {
                return;
            }

            if (LIST_FIELDS.includes(key) && Array.isArray(value)) {
                defaults[key] = value.join(', ');
                return;
            }

            if (key === "visibility" && isPlainObject(value)) {
                defaults.visibility = {
                    public: value.public ?? true,
                    lan: value.lan ?? true,
                };
                return;
            }

            if (!isPlainObject(value)) {
                defaults[key] = value;
            }
        });

        return defaults;
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

    const normalizeFormData = data => {
        const normalized = {
            ...settings,
            ...data,
            visibility: {
                ...settings.visibility,
                ...(data.visibility || {}),
            },
        };

        LIST_FIELDS.forEach(field => {
            if (field in normalized) {
                normalized[field] = commaSeparatedToList(normalized[field]);
            }
        });

        NUMBER_FIELDS.forEach(field => {
            if (field in normalized) {
                const parsedValue = parseInt(normalized[field], 10);
                normalized[field] = Number.isNaN(parsedValue) ? normalized[field] : parsedValue;
            }
        });

        Object.keys(settings).forEach(key => {
            if (key.startsWith("_comment")) {
                normalized[key] = settings[key];
            }
        });

        return normalized;
    };

    const validateSettings = data => {
        const errors = [];
        const requireInteger = (field, min = 0) => {
            if (!(field in data)) {
                return;
            }

            if (!Number.isInteger(data[field]) || data[field] < min) {
                errors.push(`${formatLabel(field)} must be a whole number of at least ${min}.`);
            }
        };

        NUMBER_FIELDS.forEach(field => requireInteger(field, 0));

        if (data.visibility && typeof data.visibility.public !== "boolean") {
            errors.push("Public visibility must be either enabled or disabled.");
        }

        if (data.visibility && typeof data.visibility.lan !== "boolean") {
            errors.push("LAN visibility must be either enabled or disabled.");
        }

        if ("tags" in data && !Array.isArray(data.tags)) {
            errors.push("Tags must be a comma-separated list.");
        }

        if (data.tags?.some(tag => tag.includes("\n"))) {
            errors.push("Tags cannot contain line breaks.");
        }

        if ("admins" in data && !Array.isArray(data.admins)) {
            errors.push("Admins must be a comma-separated list.");
        }

        if (data.admins?.some(admin => admin.includes(" "))) {
            errors.push("Admin names cannot contain spaces.");
        }

        PASSWORD_FIELDS.forEach(field => {
            if (field in data && typeof data[field] !== "string") {
                errors.push(`${formatLabel(field)} must be text.`);
            }
        });

        return errors;
    };

    const saveServerSettings = data => {
        const normalized = normalizeFormData(data);
        const errors = validateSettings(normalized);

        setValidationErrors(errors);
        if (errors.length > 0) {
            return;
        }

       settingsResource.server.update(normalized)
           .then(() => {
               fetchSettings()
                   .then(() => window.flash("Settings saved.", "green"))
           });
    }

    useEffect(() => {
        fetchSettings();
    }, []);

    const buildPreview = () => {
        const normalized = normalizeFormData(getValues());
        const errors = validateSettings(normalized);

        setValidationErrors(errors);
        if (errors.length > 0) {
            setPreview(undefined);
            return;
        }

        const before = JSON.stringify(settings, null, 2);
        const after = JSON.stringify(normalized, null, 2);

        setPreview({
            changedFields: Object.keys(normalized).filter(key => JSON.stringify(settings[key]) !== JSON.stringify(normalized[key])),
            before,
            after,
        });
    };

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

    const knownFields = SETTINGS_GROUPS.flatMap(group => group.fields);
    const extraFields = settings
        ? Object.keys(settings).filter(key => !key.startsWith("_comment_") && !knownFields.includes(key))
        : [];
    const changedRestartFields = preview?.changedFields.filter(field => RESTART_REQUIRED_FIELDS.has(field)) || [];

    const renderField = key => {
        if (!settings || !(key in settings)) {
            return null;
        }

        const value = settings[key]
        const label = formatLabel(key)
        const comment = settings["_comment_" + key]

        return (
            <div className="mb-4" key={`wrapper-${key}`}>
                {formTypeField(key, value, label)}
                <p className="text-sm italic whitespace-pre-line">{comment}</p>
            </div>
        )
    };

    return (
        <form className="mb-4" onSubmit={handleSubmit(saveServerSettings)}>
            <Panel
                title="Server Settings"
                content={
                    <>
                        {validationErrors.length > 0 && (
                            <div className="mb-4 border border-red bg-gray-dark p-3 text-sm">
                                <div className="mb-2 font-bold text-red">Fix these settings before saving:</div>
                                <ul className="list-disc pl-5">
                                    {validationErrors.map(error => <li key={error}>{error}</li>)}
                                </ul>
                            </div>
                        )}
                        {settings && SETTINGS_GROUPS.map(group => {
                            const fields = group.fields.filter(field => field in settings);
                            if (fields.length === 0) {
                                return null;
                            }

                            return (
                                <section className="mb-6 border-b border-gray-light pb-2" key={`group-${group.title}`}>
                                    <h2 className="mb-1 text-lg font-bold">{group.title}</h2>
                                    <p className="mb-4 text-sm text-gray-light">{group.description}</p>
                                    {fields.map(renderField)}
                                </section>
                            );
                        })}
                        {extraFields.length > 0 && (
                            <section className="mb-2">
                                <h2 className="mb-1 text-lg font-bold">Advanced</h2>
                                <p className="mb-4 text-sm text-gray-light">Settings not recognized by this version of the manager are preserved when saving.</p>
                                {extraFields.map(renderField)}
                            </section>
                        )}
                        {preview && (
                            <section className="mt-6">
                                <h2 className="mb-2 text-lg font-bold">Preview</h2>
                                {preview.changedFields.length === 0
                                    ? <p className="mb-4 text-sm text-gray-light">No changes detected.</p>
                                    : <p className="mb-4 text-sm text-gray-light">Changed fields: {preview.changedFields.join(", ")}</p>
                                }
                                {changedRestartFields.length > 0 && (
                                    <div className="mb-4 border border-orange bg-gray-dark p-3 text-sm">
                                        Restart required for: {changedRestartFields.join(", ")}
                                    </div>
                                )}
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div>
                                        <h3 className="mb-2 font-bold">Current server-settings.json</h3>
                                        <pre className="max-h-96 overflow-auto whitespace-pre-wrap bg-gray-dark p-3 text-xs">{preview.before}</pre>
                                    </div>
                                    <div>
                                        <h3 className="mb-2 font-bold">After save</h3>
                                        <pre className="max-h-96 overflow-auto whitespace-pre-wrap bg-gray-dark p-3 text-xs">{preview.after}</pre>
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                }
                actions={
                    <>
                        <Button onClick={buildPreview} className="mr-2">Preview changes</Button>
                        <Button isSubmit={true} type="success">Save</Button>
                    </>
                }
            />
        </form>
    )
}

export default ServerSettings;
