import { createPublicAPIKeyHandler, listPublicAPIKeysHandler, revokePublicAPIKeyHandler } from '../../command-handlers';
import { logger } from '../../logger.js';
import { Command } from 'commander';

export const PublicAPICommands = (params: { teamGroup: Command }) => {
    const { teamGroup } = params;

    const PublicAPIGroup = teamGroup.command('public-api').description('Public API operations');

    PublicAPIGroup.command('create-key')
        .description('Generate a new Public API key (Bearer token)')
        .argument('<description>', 'Description')
        .action(async (description: string) => {
            const PublicAPIToken = await createPublicAPIKeyHandler(description);

            logger.success(
                'The new Public API key has been generated, you can use it as a Bearer token in your requests:'
            );
            logger.content(`Bearer ${PublicAPIToken}`);
        });

    PublicAPIGroup.command('list-keys')
        .description('List all Public API keys')
        .option('--json', 'Output in JSON format')
        .action(async (options: { json: boolean }) => {
            const publicAPIKeys = await listPublicAPIKeysHandler();

            if (options.json) {
                logger.content(JSON.stringify(publicAPIKeys));
            } else {
                console.table(
                    publicAPIKeys.publicAPIKeys.map((key) => ({
                        'Creation date': new Date(key.creationDateUnix).toISOString(),
                        'Update date': new Date(key.updateDateUnix).toISOString(),
                        'Invalidation date': key.invalidationDateUnix
                            ? new Date(key.invalidationDateUnix).toISOString()
                            : 'N/A',
                        'Access key': key.accessKey,
                        Description: key.description,
                        Origin: key.origin,
                        Valid: key.valid ? 'Yes' : 'No',
                    }))
                );
            }
        });

    PublicAPIGroup.command('revoke-key')
        .description('Revoke a Public API key')
        .argument('<accessKey>', 'Access key')
        .action(async (accessKey: string) => {
            await revokePublicAPIKeyHandler(accessKey);

            logger.success('The Public API key has been revoked');
        });
};
