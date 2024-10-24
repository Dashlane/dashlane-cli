import { createReportAPIKeyHandler, listReportAPIKeysHandler, revokeReportAPIKeyHandler } from '../../command-handlers';
import { logger } from '../../logger.js';
import { Command } from 'commander';

export const reportAPICommands = (params: { teamGroup: Command }) => {
    const { teamGroup } = params;

    const reportAPIGroup = teamGroup.command('report-api').description('Report API operations');

    reportAPIGroup
        .command('create-key')
        .description('Generate a new Report API key (Bearer token)')
        .argument('<description>', 'Description')
        .action(async (description: string) => {
            const reportAPIToken = await createReportAPIKeyHandler(description);

            logger.success(
                'The new Report API key has been generated, you can use it as a Bearer token in your requests:'
            );
            logger.content(`Bearer ${reportAPIToken}`);
        });

    reportAPIGroup
        .command('list-keys')
        .description('List all Report API keys')
        .option('--json', 'Output in JSON format')
        .action(async (options: { json: boolean }) => {
            const reportAPIKeys = await listReportAPIKeysHandler();

            if (options.json) {
                logger.content(JSON.stringify(reportAPIKeys));
            } else {
                console.table(
                    reportAPIKeys.reportAPIKeys.map((key) => ({
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

    reportAPIGroup
        .command('revoke-key')
        .description('Revoke a Report API key')
        .argument('<accessKey>', 'Access key')
        .action(async (accessKey: string) => {
            await revokeReportAPIKeyHandler(accessKey);

            logger.success('The Report API key has been revoked');
        });
};
