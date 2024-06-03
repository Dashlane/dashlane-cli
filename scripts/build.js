#!/usr/bin/env node

import os from 'os';
import fs from 'fs';
import path from 'path';
import process from 'process';
import esbuild from 'esbuild';
import packageJSON from '../package.json' assert { type: 'json' };
import { fileURLToPath } from 'url';
import { $ } from "execa";
import tscOutputParser from '@aivenio/tsc-output-parser';

const platform = os.platform();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pemReadFilePlugin = {
    name: 'base64-plugin',
    setup(build) {
        build.onLoad({ filter: /\.js$/ }, async (args) => {
            let contents = fs.readFileSync(args.path, 'utf8');

            const regex = /await\s+fs\.promises\.readFile\(\s*path\.resolve\(__dirname,\s*['"`](.*\.pem)['"`]\s*\)\)/g;
            let match;

            while ((match = regex.exec(contents)) !== null) {
                const pemFilePath = path.resolve(path.dirname(args.path), match[1]);
                const pemContents = fs.readFileSync(pemFilePath, 'utf8');
                const base64Contents = Buffer.from(pemContents).toString('base64');
                contents = contents.replace(match[0], `await Promise.resolve(Buffer.from("${base64Contents}", 'base64').toString())`);
            }

            return {
                contents,
                loader: 'js',
            };
        });
    },
};

const tscDiagnosticToEsbuild = async (
    diagnostic,
) => {
    const lineText =
        await $`sed -n ${diagnostic.value.cursor.value.line}p ${diagnostic.value.path.value}`;

    const [firstLine, rest] = diagnostic.value.message.value.split("\n", 2);

    return {
        location: {
            column: diagnostic.value.cursor.value.col - 1,
            line: diagnostic.value.cursor.value.line,
            file: diagnostic.value.path.value,
            lineText: lineText.stdout,
        },
        notes: rest && rest.trim().length > 0 ? [{ text: rest }] : [],
        text: `${firstLine} [${diagnostic.value.tsError.value.errorString}]`,
    };
};

const checkTypesPlugin = () => {
    return {
        name: 'check-types',
        setup(build) {
            build.onEnd(async (result) => {
                if (result.errors.length > 0) {
                    return;
                }

                const buildArgs = ['--noEmit', '-p', './tsconfig.build.json', '--pretty', 'false'];
                try {
                    await $('tsc', buildArgs);
                } catch (err) {
                    const tscOutput = tscOutputParser.parse(err.stdout);
                    const messages = await Promise.all(tscOutput.map(output => tscDiagnosticToEsbuild(output)));
                    const formatted = await esbuild.formatMessages(
                        messages,
                        {
                            kind: 'error',
                            color: true,
                            terminalWidth: 100,
                        }
                    );
                    console.log(formatted.join('\n'));
                    process.exit(1);
                }
            });
        },
    };
};

async function main(argv = process.argv) {
    argv = argv.slice(2);
    const projectRoot = path.join(__dirname, '..');
    const srcPath = path.join(projectRoot, 'src');
    const distPath = path.join(projectRoot, 'dist');
    const gitPath = process.env.GIT_DIR ?? path.join(projectRoot, '.git');
    await fs.promises.rm(distPath, {
        recursive: true,
        force: true,
    });
    await fs.promises.mkdir(distPath, {
        recursive: true,
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
        path.join(distPath, 'build.json'),
        JSON.stringify(buildJSON, null, 2),
    );
    // This specifies import paths that is left as an external require
    // This is kept to packages that have a native binding
    const externalDependencies = Object.keys(packageJSON.nativeDependencies ?? {});
    const esbuildOptions = {
        entryPoints: [
            'src/index.ts'
        ],
        sourceRoot: srcPath,
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
        metafile: true,
        plugins: [checkTypesPlugin(), pemReadFilePlugin],
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