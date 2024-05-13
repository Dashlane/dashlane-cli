#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');
const childProcess = require('child_process');
const esbuild = require('esbuild');
const packageJSON = require('../package.json');

const platform = os.platform();

/* eslint-disable no-console */
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
        outdir: distPath,
        external: externalDependencies,
        treeShaking: true,
        // External source map for debugging
        sourcemap: true,
        // Minify and keep the original names
        minify: true,
        keepNames: true,
    };
    console.error('Running esbuild:');
    console.error(esbuildOptions);
    await esbuild.build(esbuildOptions);
}
/* eslint-enable no-console */

void main();