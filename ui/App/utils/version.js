export const formatFactorioVersion = version => {
    if (!version) {
        return "Unknown";
    }

    const parts = String(version).split(".");
    if (parts.length >= 3) {
        return parts.slice(0, 3).join(".");
    }

    return String(version);
};

export const formatFactorioVersionShort = version => {
    if (!version) {
        return "Unknown";
    }

    const parts = String(version).split(".");
    return parts.slice(0, 2).join(".");
};

export const formatModVersion = version => {
    if (!version) {
        return "Unknown";
    }

    const parts = String(version).split(".");
    return parts.slice(0, 3).join(".");
};
