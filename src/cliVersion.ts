import { CliVersion } from './types';

export const CLI_VERSION: CliVersion = { major: 1, minor: 6, patch: 0 };
export const breakingChangesVersions: CliVersion[] = [];

export const cliVersionToString = (version: CliVersion): string => {
    return `${version.major}.${version.minor}.${version.patch}`;
};

export const stringToCliVersion = (version: string): CliVersion | Error => {
    if (!version) {
        return new Error(`No version provided`);
    }
    const versionSegments = version.split('.', 3).map((segment) => parseInt(segment, 10));
    if (versionSegments.length !== 3 || versionSegments.findIndex(isNaN) >= 0) {
        return new Error(`This version string is invalid: ${version}`);
    }
    return { major: versionSegments[0], minor: versionSegments[1], patch: versionSegments[2] };
};

export const cliVersionLessThan = (version1: CliVersion, version2: CliVersion): boolean => {
    if (version1.major === version2.major) {
        if (version1.minor === version2.minor) {
            return version1.patch < version2.patch;
        }
        return version1.minor < version2.minor;
    }
    return version1.major < version2.major;
};
