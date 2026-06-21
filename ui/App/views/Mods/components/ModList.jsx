import Mod from "./Mod";
import React from "react";

const groupLabels = {
    compatible: "Compatible updates",
    incompatible: "Incompatible updates",
    unknown: "Unknown update status",
    current: "Current",
};

const ModList = ({
                     mods,
                     factorioVersion,
                     updateMod,
                     toggleMod,
                     deleteMod,
                     metadataByMod = {},
                     selectedUpdates = {},
                     toggleSelectedUpdate = () => undefined,
                     disabled = false
                 }) => {
    const groupedMods = mods.reduce((groups, mod) => {
        const status = metadataByMod[mod.name]?.status || "unknown";
        const group = groupLabels[status] ? status : "unknown";
        groups[group].push(mod);
        return groups;
    }, {compatible: [], incompatible: [], unknown: [], current: []});

    return (
        <table className="w-full">
            <thead>
            <tr className="text-left py-1">
                {!disabled && <th/>}
                <th>Name</th>
                <th>Enabled</th>
                <th>Compatibility</th>
                <th>Mod Version</th>
                <th>Latest</th>
                <th>Released</th>
                <th>Factorio Version</th>
                <th>Portal Factorio</th>
                <th>Dependencies</th>
                <th>Portal</th>
                {!disabled && <th/>}
            </tr>
            </thead>
            <tbody>
            {
                factorioVersion !== null && Object.keys(groupedMods).map(group =>
                    groupedMods[group].length > 0 && <React.Fragment key={group}>
                        <tr>
                            <td colSpan={disabled ? 10 : 12} className="pt-4 pb-1 text-orange font-bold">
                                {groupLabels[group]}
                            </td>
                        </tr>
                        {groupedMods[group].map((mod, i) =>
                            <Mod mod={mod} key={`${group}-${i}`}
                                 updateMod={updateMod}
                                 toggleMod={toggleMod}
                                 deleteMod={deleteMod}
                                 metadata={metadataByMod[mod.name]}
                                 selectedForUpdate={!!selectedUpdates[mod.name]}
                                 toggleSelectedUpdate={toggleSelectedUpdate}
                                 disabled={disabled}
                            />
                        )}
                    </React.Fragment>
                )
            }
            </tbody>
        </table>
    )
}

export default ModList;
