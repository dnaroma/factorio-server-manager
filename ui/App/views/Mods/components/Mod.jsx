import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faArrowCircleUp,
    faCheck,
    faSpinner,
    faTimes,
    faToggleOff,
    faToggleOn,
    faTrashAlt
} from "@fortawesome/free-solid-svg-icons";
import React, {useState} from "react";
import {formatFactorioVersion} from "../../../utils/version";

const formatDate = value => value ? new Date(value).toLocaleDateString() : "Unknown";

const dependencyText = dependencies => {
    if (!dependencies || dependencies.length === 0) {
        return "None";
    }

    return dependencies.slice(0, 3).join(", ") + (dependencies.length > 3 ? ` +${dependencies.length - 3}` : "");
};

const Mod = ({
                 mod,
                 toggleMod,
                 deleteMod,
                 updateMod,
                 metadata,
                 selectedForUpdate = false,
                 toggleSelectedUpdate = () => undefined,
                 disabled = false
             }) => {

    const [icon, setIcon] = useState(faArrowCircleUp)
    const newVersion = metadata?.update;
    const toggleClassName = mod.enabled
        ? "bg-green hover:bg-green-light hover:glow-green"
        : "bg-red hover:bg-red-light hover:glow-red";

    return (
        <tr className="py-1">
            {!disabled &&
                <td className="pr-4">
                    <input type="checkbox"
                           disabled={!newVersion}
                           checked={selectedForUpdate}
                           onChange={() => toggleSelectedUpdate(mod.name)}
                    />
                </td>
            }
            <td className="pr-4">{mod.title}</td>
            <td className="pr-4">
                {
                    disabled
                        ?

                        mod.enabled
                            ? <FontAwesomeIcon className="text-green" icon={faCheck}/>
                            : <FontAwesomeIcon className="text-red" icon={faTimes}/>
                        :
                        <button
                            type="button"
                            className={`inline-flex items-center justify-center w-24 py-1 px-3 accentuated text-black font-bold ${toggleClassName}`}
                            onClick={() => toggleMod(mod.name)}>
                            <FontAwesomeIcon className="mr-2" icon={mod.enabled ? faToggleOn : faToggleOff}/>
                            {mod.enabled ? "Enabled" : "Disabled"}
                        </button>
                }
            </td>
            <td className="pr-4">
                {mod.compatibility
                    ? <FontAwesomeIcon className="text-green" icon={faCheck}/>
                    : <FontAwesomeIcon className="text-red" icon={faTimes}/>
                }
            </td>
            <td className="pr-4">
                {mod.version}
                {!disabled && newVersion && <FontAwesomeIcon spin={icon === faSpinner}
                                                onClick={() => {
                                                    setIcon(faSpinner)
                                                    updateMod(newVersion)
                                                        .finally(() => setIcon(faArrowCircleUp))
                                                }}
                                                className="hover:text-orange cursor-pointer ml-1"
                                                icon={icon}/>}</td>
            <td className="pr-4">{metadata?.latestVersion || "Unknown"}</td>
            <td className="pr-4">{formatDate(metadata?.latestReleasedAt)}</td>
            <td className="pr-4">{formatFactorioVersion(mod.factorio_version)}</td>
            <td className="pr-4">{metadata?.factorioVersion || "Unknown"}</td>
            <td className="pr-4" title={metadata?.dependencies?.join(", ") || ""}>{dependencyText(metadata?.dependencies)}</td>
            <td className="pr-4">
                {metadata?.changelogUrl
                    ? <a className="text-orange hover:text-orange-light" href={metadata.changelogUrl} target="_blank" rel="noreferrer">Changelog</a>
                    : "Unknown"
                }
                {metadata?.reason && <div className="text-xs text-red">{metadata.reason}</div>}
            </td>
            {
                !disabled &&
                <td className="pr-4">
                    <FontAwesomeIcon className={"text-red cursor-pointer hover:text-red-light"}
                                     onClick={() => deleteMod(mod.name)} icon={faTrashAlt}/>
                </td>
            }
        </tr>
    )
}

export default Mod;
