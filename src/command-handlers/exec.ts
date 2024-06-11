import { Command } from 'commander';
import { spawnSync } from 'child_process';
import { getVaultContent, initVaultContent } from '../modules/database/index.js';
import { logger } from '../logger.js';

export const runExec = async (_options: unknown, program: Command) => {
    const command = program.args.join(' ');
    const environmentVariables = process.env;

    await initVaultContent();

    for (const [key, value] of Object.entries(process.env)) {
        let returnValue = value;
        if (value && value.startsWith('dl://')) {
            returnValue = getVaultContent(value);
        }
        process.env[key] = returnValue;
    }

    // spawn a new process with the command
    const child = spawnSync(command, {
        stdio: 'inherit',
        shell: true,
        env: environmentVariables,
    });

    if (child.error) {
        logger.error(`Failed to execute command: ${child.error.message}`);
    }
};
