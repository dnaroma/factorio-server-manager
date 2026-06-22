import Panel from "../../components/Panel";
import React, {useEffect, useState} from "react";
import modsResource from "../../../api/resources/mods";
import Button from "../../components/Button";
import server from "../../../api/resources/server";
import TabControl from "../../components/Tabs/TabControl";
import Tab from "../../components/Tabs/Tab";
import AddMod from "./components/AddMod/AddMod";
import UploadMod from "./components/UploadMod";
import LoadMods from "./components/LoadMods";
import Fuse from "fuse.js";
import CreateModPack from "./components/CreateModPack";
import ModPack from "./components/ModPack";
import ModList from "./components/ModList";
import ImportModPack from "./components/ImportModPack";
import {coerce, gt, satisfies} from "semver";
import {formatFactorioVersion} from "../../utils/version";

const releaseVersion = release => coerce(release.version);
const modVersion = mod => coerce(mod.version);
const factorioReleaseVersion = release => coerce(release.info_json.factorio_version);
const builtInMods = ["base", "elevated-rails", "quality", "space-age"];

const requiredDependencyName = dependency => {
    const normalized = dependency.trim();
    if (normalized === "") {
        return null;
    }

    const fields = normalized.split(/\s+/);
    const name = fields[0];
    if (["?", "!", "~", "(?)"].includes(name)) {
        return null;
    }
    if (name.startsWith("?") || name.startsWith("!") || name.startsWith("~")) {
        return null;
    }
    if (builtInMods.includes(name)) {
        return null;
    }

    return name;
};

const requiredDependencyNames = dependencies => (dependencies || [])
    .map(requiredDependencyName)
    .filter(Boolean);

const isReleaseCompatible = (release, factorioVersion) => {
    const requiredFactorioVersion = factorioReleaseVersion(release);
    const installedFactorioVersion = coerce(factorioVersion);
    if (!requiredFactorioVersion || !installedFactorioVersion) {
        return false;
    }

    return satisfies(installedFactorioVersion.version, "~" + requiredFactorioVersion.version) ||
        (
            satisfies(installedFactorioVersion.version, "1.0.0") &&
            satisfies(requiredFactorioVersion, "0.18.x")
        );
};

const releaseTimestamp = release => Date.parse(release.released_at || "") || 0;

const newestRelease = releases => releases.reduce((newest, release) => {
    const version = releaseVersion(release);
    if (!version) {
        return newest;
    }
    if (!newest || releaseTimestamp(release) > releaseTimestamp(newest)) {
        return release;
    }
    if (releaseTimestamp(release) === releaseTimestamp(newest) && gt(version, releaseVersion(newest))) {
        return release;
    }

    return newest;
}, null);

const buildModMetadata = (mod, portalInfo, factorioVersion) => {
    if (!portalInfo || portalInfo.error) {
        return {
            status: "unknown",
            reason: portalInfo?.error || "Portal metadata unavailable",
        };
    }

    const latestRelease = newestRelease(portalInfo.releases || []);
    const latestCompatibleRelease = newestRelease((portalInfo.releases || []).filter(release =>
        isReleaseCompatible(release, factorioVersion)
    ));
    const currentVersion = modVersion(mod);
    const latestVersion = latestRelease ? releaseVersion(latestRelease) : null;
    const latestCompatibleVersion = latestCompatibleRelease ? releaseVersion(latestCompatibleRelease) : null;
    const dependencies = requiredDependencyNames(
        latestCompatibleRelease?.info_json?.dependencies || latestRelease?.info_json?.dependencies || mod.dependencies
    );

    let update = null;
    let status = "current";
    let reason = "";

    if (!latestRelease || !latestVersion || !currentVersion) {
        status = "unknown";
        reason = "No release metadata available";
    } else if (latestCompatibleRelease && latestCompatibleVersion && gt(latestCompatibleVersion, currentVersion)) {
        status = "compatible";
        update = {
            downloadUrl: latestCompatibleRelease.download_url,
            fileName: latestCompatibleRelease.file_name,
            modName: mod.name,
        };
    } else if (gt(latestVersion, currentVersion)) {
        status = "incompatible";
        reason = `Latest release requires Factorio ${formatFactorioVersion(latestRelease.info_json.factorio_version)}`;
    } else if (!mod.compatibility) {
        status = "incompatible";
        reason = `Installed mod targets Factorio ${formatFactorioVersion(mod.factorio_version)}`;
    }

    return {
        status,
        reason,
        latestRelease,
        latestCompatibleRelease,
        latestVersion: latestRelease?.version,
        latestReleasedAt: latestRelease?.released_at,
        factorioVersion: formatFactorioVersion(latestRelease?.info_json?.factorio_version),
        dependencies,
        update,
        changelogUrl: `https://mods.factorio.com/mod/${mod.name}/changelog`,
    };
};

const Mods = ({serverStatus}) => {

    const [installedMods, setInstalledMods] = useState([]);
    const [modPacks, setModPacks] = useState([])
    const [factorioVersion, setFactorioVersion] = useState(null);
    const [fuse, setFuse] = useState(undefined);
    const [isDeletingAllMods, setIsDeletingAllMods] = useState(false);
    const [isUpdatingMods, setIsUpdatingMods] = useState(false);
    const [portalInfo, setPortalInfo] = useState({});
    const [selectedUpdates, setSelectedUpdates] = useState({});

    const fetchInstalledMods = () => {
        return modsResource.installed()
            .then(setInstalledMods);
    };

    const fetchModPacks = () => {
        modsResource.packs.list()
            .then(setModPacks)
    }

    const deleteAllMods = () => {
        setIsDeletingAllMods(true);
        modsResource.deleteAll()
            .then(fetchInstalledMods)
            .finally(() => setIsDeletingAllMods(false))
    }

    const metadataByMod = installedMods.reduce((metadata, mod) => {
        metadata[mod.name] = buildModMetadata(mod, portalInfo[mod.name], factorioVersion);
        return metadata;
    }, {});

    const updatesByGroup = installedMods.reduce((groups, mod) => {
        const metadata = metadataByMod[mod.name];
        if (metadata?.status && metadata.status !== "current") {
            groups[metadata.status].push(mod);
        }
        return groups;
    }, {compatible: [], incompatible: [], unknown: []});

    const compatibleUpdates = updatesByGroup.compatible
        .map(mod => metadataByMod[mod.name]?.update)
        .filter(Boolean);
    const selectedUpdatePayloads = compatibleUpdates.filter(update => selectedUpdates[update.modName]);

    const updateMods = updates => {
        setIsUpdatingMods(true);

        Promise.all(updates.map(update => modsResource.update(update)))
            .then(fetchInstalledMods)
            .finally(() => setIsUpdatingMods(false));
    }

    const updateAllMods = () => {
        updateMods(compatibleUpdates);
    }

    const updateSelectedMods = () => {
        updateMods(selectedUpdatePayloads);
    }

    const toggleSelectedUpdate = modName => {
        setSelectedUpdates(selected => ({
            ...selected,
            [modName]: !selected[modName]
        }));
    }

    useEffect(() => {
        server.factorioVersion()
            .then(data => {
                setFactorioVersion(data.base_mod_version)
                fetchInstalledMods();
                fetchModPacks();
            })

        // fetch list of mods
        modsResource.portal.list()
            .then(res => {
                setFuse(new Fuse(res.results, {
                    keys: [
                        {
                            "name": "name",
                            weight: 2
                        },
                        {
                            "name": "title",
                            weight: 1
                        }
                    ],
                    minMatchCharLength: 3
                }));
            });

    }, []);

    useEffect(() => {
        if (!factorioVersion || installedMods.length === 0) {
            return;
        }

        let canceled = false;
        Promise.all(installedMods.map(mod =>
            modsResource.portal.info(mod.name)
                .then(data => ({name: mod.name, data}))
                .catch(() => ({name: mod.name, data: {error: "Portal metadata unavailable"}}))
        )).then(results => {
            if (canceled) {
                return;
            }

            const info = {};
            results.forEach(result => {
                info[result.name] = result.data;
            });
            setPortalInfo(info);
        });

        return () => {
            canceled = true;
        };
    }, [installedMods, factorioVersion]);

    useEffect(() => {
        setSelectedUpdates(selected => {
            const next = {};
            compatibleUpdates.forEach(update => {
                next[update.modName] = selected[update.modName] || false;
            });
            return next;
        });
    }, [installedMods, portalInfo, factorioVersion]);

    const toggleMod = modName => {
        return modsResource
            .toggle(modName)
            .then(fetchInstalledMods)
    }

    const deleteMod = modName => {
        return modsResource
            .delete(modName)
            .then(fetchInstalledMods)
    }

    const updateMod = version => {
        return modsResource
            .update(version)
            .then(fetchInstalledMods)
    }

    let disabled = serverStatus.running

    return (
        <div>
            {disabled ?
                <Panel className="mb-6"
                       content={
                           <div className="text-red font-bold text-xl">
                               Changing mods is disabled while the server is running!
                           </div>
                       }
                />
                :
                <TabControl>
                    <Tab title="Install Mod">
                        <AddMod refetchInstalledMods={fetchInstalledMods} fuse={fuse}/>
                    </Tab>
                    <Tab title="Upload Mod">
                        <UploadMod refetchInstalledMods={fetchInstalledMods}/>
                    </Tab>
                    <Tab title="Load Mods from Save">
                        <LoadMods refreshMods={fetchInstalledMods}/>
                    </Tab>
                </TabControl>
            }
            <Panel
                title="Mods"
                className="mb-6"
                content={
                    <ModList toggleMod={toggleMod}
                             updateMod={updateMod}
                             deleteMod={deleteMod}
                             mods={installedMods}
                             metadataByMod={metadataByMod}
                             selectedUpdates={selectedUpdates}
                             toggleSelectedUpdate={toggleSelectedUpdate}
                             factorioVersion={factorioVersion}
                             disabled={disabled}
                    />
                }
                actions={
                    <>
                        {
                            !disabled &&
                            <>
                                <Button size="sm" className="mr-2" type="danger" isLoading={isDeletingAllMods}
                                        onClick={deleteAllMods}>Delete all Mods</Button>
                                <Button size="sm" className="mr-2" isLoading={isUpdatingMods}
                                        isDisabled={compatibleUpdates.length === 0}
                                        onClick={updateAllMods}>Update all Mods</Button>
                                <Button size="sm" className="mr-2" isLoading={isUpdatingMods}
                                        isDisabled={selectedUpdatePayloads.length === 0}
                                        onClick={updateSelectedMods}>Update selected Mods</Button>
                            </>
                        }
                        <a className="bg-gray-light py-1 px-2 hover:glow-orange hover:bg-orange inline-block accentuated text-black font-bold"
                           href={modsResource.downloadAllURL}>Download all Mods</a>
                    </>
                }
            />
            <Panel
                title="Mod update status"
                className="mb-6"
                content={
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <h3 className="text-green font-bold mb-2">Compatible updates</h3>
                            {updatesByGroup.compatible.length === 0 ? "None" : updatesByGroup.compatible.map(mod =>
                                <div key={mod.name}>{mod.title} {mod.version} → {metadataByMod[mod.name].latestCompatibleRelease.version}</div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-red font-bold mb-2">Incompatible updates</h3>
                            {updatesByGroup.incompatible.length === 0 ? "None" : updatesByGroup.incompatible.map(mod =>
                                <div key={mod.name}>{mod.title}: {metadataByMod[mod.name].reason}</div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-orange font-bold mb-2">Unknown</h3>
                            {updatesByGroup.unknown.length === 0 ? "None" : updatesByGroup.unknown.map(mod =>
                                <div key={mod.name}>{mod.title}: {metadataByMod[mod.name].reason}</div>
                            )}
                        </div>
                    </div>
                }
            />

            <Panel
                title="Mod packs"
                className="mb-6"
                content={
                    modPacks.map(
                        (pack, i) =>
                            <ModPack factorioVersion={factorioVersion}
                                     key={i}
                                     modPack={pack}
                                     reloadMods={fetchInstalledMods}
                                     reloadModPacks={fetchModPacks}
                                     disabled={disabled}
                            />
                    )
                }
                actions={
                    <>
                        <CreateModPack onSuccess={fetchModPacks}/>
                        <ImportModPack onSuccess={fetchModPacks}/>
                    </>
                }
            />
        </div>
    )
}

export default Mods;
