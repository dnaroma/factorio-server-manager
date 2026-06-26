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
import {formatFactorioVersionShort} from "../../../utils/version";

const formatDate = value => value ? new Date(value).toLocaleDateString() : "Unknown";

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
                {mod.version}
                {!disabled && newVersion && <FontAwesomeIcon spin={icon === faSpinner}
                                                onClick={() => {
                                                    setIcon(faSpinner)
                                                    updateMod(newVersion)
                                                        .finally(() => setIcon(faArrowCircleUp))
                                                }}
                                                className="hover:text-orange cursor-pointer ml-1"
                                                icon={icon}
                                                title={`Update to ${metadata?.latestVersion}`}/>}</td>
            <td className="pr-4">{metadata?.latestVersion || "Unknown"}</td>
            <td className="pr-4">{formatDate(metadata?.latestReleasedAt)}</td>
            <td className="pr-4">{formatFactorioVersionShort(mod.factorio_version)}</td>
            {/* TODO: Show Dependencies column once full portal endpoint is fetched (provides complete dependency list) */}
            <td className="pr-4">
                {metadata?.changelogUrl
                    ? <a className="text-orange hover:text-orange-light" href={metadata.changelogUrl} target="_blank" rel="noreferrer">Changelog</a>
                    : "Unknown"
                }
                {metadata?.reason && <div className="text-xs text-gray">{metadata.reason}</div>}
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
