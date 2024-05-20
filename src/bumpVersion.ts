import { Command } from 'commander';
import fs from 'fs';
import { CliVersion } from './types.js';

const DEFAULT_MAJOR = 6;

const bumpProjectVersion = () => {
    allUpdates(computeNewVersion());
};

const allUpdates = (version: CliVersion) => {
    const { major, minor, patch } = version;
    const updates: FileUpdateParams[] = [
        {
            filePath: 'src/cliVersion.ts',
            versionRegexp: /\{ major: \d+, minor: \d+, patch: \d+ \}/,
            replacementString: `{ major: ${major}, minor: ${minor}, patch: ${patch} }`,
        },
        {
            filePath: 'package.json',
            versionRegexp: /"version": "\d+\.\d+\.\d+"/,
            replacementString: `"version": "${major}.${minor}.${patch}"`,
        },
    ];
    updates.forEach((update) => updateVersionInFile(update));
};

interface FileUpdateParams {
    filePath: string;
    versionRegexp: RegExp;
    replacementString: string;
}

const updateVersionInFile = (params: FileUpdateParams) => {
    const { filePath, versionRegexp, replacementString } = params;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const updatedFileContent = fileContent.replace(versionRegexp, replacementString);
    fs.writeFileSync(filePath, updatedFileContent, 'utf8');
};

const computeNewVersion = (): CliVersion => {
    const now = new Date();
    const currentWeek = computeWeekOfYear(now).toString().padStart(2, '0');
    const currentYear = now.getFullYear().toString().substring(2);
    const newMinor = parseInt(`${currentYear}${currentWeek}`, 10);

    const currentVersion = parseCurrentVersion();
    let patch = 0;
    if (currentVersion && currentVersion.minor === newMinor) {
        patch = currentVersion.patch + 1;
    }

    return {
        major: currentVersion?.major ?? DEFAULT_MAJOR,
        minor: newMinor,
        patch,
    };
};

const parseCurrentVersion = (): CliVersion | undefined => {
    const fileContent = fs.readFileSync('package.json', 'utf8');
    const versionRegexp = /"version": "(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)"/;
    const matchedVersion = versionRegexp.exec(fileContent)?.groups;
    if (matchedVersion) {
        const major = parseInt(matchedVersion.major, 10);
        const minor = parseInt(matchedVersion.minor, 10);
        const patch = parseInt(matchedVersion.patch, 10);
        return { major, minor, patch };
    }
    return;
};

const computeWeekOfYear = (date: Date) => {
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0);
    dateCopy.setDate(dateCopy.getDate() + 3 - ((dateCopy.getDay() + 6) % 7));
    const week1 = new Date(dateCopy.getFullYear(), 0, 4);
    return 1 + Math.round(((dateCopy.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

if (import.meta.url === `file://${process.argv[1]}`) {
    const commander = new Command();
    commander.version('0.0.1');
    bumpProjectVersion();
}
