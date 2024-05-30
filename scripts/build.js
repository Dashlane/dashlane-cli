#!/usr/bin/env node

import os from 'os';
import fs from 'fs';
import path from 'path';
import process from 'process';
import childProcess from 'child_process';
import esbuild from 'esbuild';
import packageJSON from '../package.json' assert { type: 'json' };
import { fileURLToPath } from 'url';

const platform = os.platform();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(argv = process.argv) {
    argv = argv.slice(2);
    const projectRoot = path.join(__dirname, '..');
    const buildPath = path.join(projectRoot, 'build');
    const distPath = path.join(projectRoot, 'dist');
    const gitPath = process.env.GIT_DIR ?? path.join(projectRoot, '.git');
    await fs.promises.rm(distPath, {
        recursive: true,
        force: true,
    });
    const buildArgs = ['-p', './tsconfig.build.json', ...argv];
    console.error('Running tsc:');
    console.error(['tsc', ...buildArgs].join(' '));
    childProcess.execFileSync('tsc', buildArgs, {
        stdio: ['inherit', 'inherit', 'inherit'],
        windowsHide: true,
        encoding: 'utf-8',
        shell: platform === 'win32' ? true : false,
    });
    // This collects the build metadata and adds it to the build folder so that dynamic imports to it will resolve correctly.
    let gitHead = process.env.COMMIT_HASH;
    if (gitHead == null) {
        gitHead = await fs.promises.readFile(path.join(gitPath, 'HEAD'), 'utf-8');
        if (gitHead.startsWith('ref: ')) {
            const refPath = gitHead.slice(5).trim();
            gitHead = await fs.promises
                .readFile(path.join(gitPath, refPath), 'utf-8')
                .then((ref) => ref.trim());
        }
    }
    const buildJSON = {
        versionMetadata: {
            version: packageJSON.version,
            commitHash: gitHead,
        },
    };
    console.error('Writing build metadata (build.json):');
    console.error(buildJSON);
    await fs.promises.writeFile(
        path.join(buildPath, 'build.json'),
        JSON.stringify(buildJSON, null, 2),
    );
    // This specifies import paths that is left as an external require
    // This is kept to packages that have a native binding
    const externalDependencies = Object.keys(packageJSON.nativeDependencies ?? {});
    const esbuildOptions = {
        entryPoints: [
            path.join(buildPath, 'index.js'),
        ],
        sourceRoot: buildPath,
        bundle: true,
        platform: 'node',
        format: 'cjs',
        external: externalDependencies,
        treeShaking: true,
        // External source map for debugging
        sourcemap: true,
        // Minify and keep the original names
        minify: true,
        keepNames: true,
        outfile: path.join(distPath, 'index.cjs'),
        metafile: true
    };
    console.error('Running esbuild:');
    console.error(esbuildOptions);
    const result = await esbuild.build(esbuildOptions);
    fs.writeFileSync(path.join(distPath, 'index.meta.json'), JSON.stringify(result.metafile, null, 2));

    // Copy package.json
    const pkgJson = cleanPkgJson(packageJSON);
    fs.writeFileSync(path.join(distPath, 'package.json'), JSON.stringify(pkgJson, null, 2));
}

const cleanPkgJson = (json) => {
    delete json.devDependencies;
    delete json.optionalDependencies;
    const oldDependencies = json.dependencies;
    delete json.dependencies;
    json.dependencies = {};

    for (const [name, version] of Object.entries(oldDependencies)) {
        if (Object.keys(json.nativeDependencies).includes(name)) {
            json.dependencies[name] = version;
        }
    }
    delete json.nativeDependencies;
    delete json.scripts;
    json.bin.dcli = 'index.cjs';
    json.main = 'index.cjs';
    return json;
};

void main();