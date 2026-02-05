import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CLI_VERSION, cliVersionToString } from '../cliVersion.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getEnrolledTeamDeviceCredentials } from '../utils/index.js';
import { getAuditLogs } from '../endpoints/index.js';
import { logger } from '../logger.js';

export const runTeamMcp = async () => {
    const enrolledTeamDeviceCredentials = getEnrolledTeamDeviceCredentials();

    const server = new McpServer({
        name: 'Dashlane Password Manager - Team MCP',
        version: cliVersionToString(CLI_VERSION),
    });

    // TODO Simple audit log type documentation is duplicated there. Ideally we would have a way to auto generate it from our internal JSON schemas
    server.registerTool(
        'get-audit-logs',
        {
            title: 'Get Dashlane audit logs',
            description: `Fetch Dashlane audit logs between start and end (provided as ISO 8601 UTC timestamp). If end is not provided, "now" is assumed.
            The output of this command can be very large, avoid fetching more than a month worth of logs at once, and don't try to read everything at once.
            Prefer using tools such as jq if available to explore the data.

# Logs types

## Default types

| Type                                           | Event message                                          |
| ---------------------------------------------- | ------------------------------------------------------ |
| master_password_reset_accepted                 | Accepted an Account Recovery request from %(email)s    |
| master_password_reset_refused                  | Denied an Account Recovery request from %(email)s      |
| user_device_added                              | Added the device %(name)s                              |
| user_device_removed                            | Removed the device %(name)s                            |
| requested_account_recovery                     | Requested Account Recovery                             |
| completed_account_recovery                     | Recovered their account through Account Recovery       |
| dwm_email_added                                | Added %(email)s to Dark Web Monitoring                 |
| dwm_email_removed                              | Removed %(email)s from Dark Web Monitoring             |
| user_group_created                             | Created a group named %(groupName)s                    |
| user_group_renamed                             | Renamed the %(oldGroupName)s group to %(newGroupName)s |
| user_group_deleted                             | Deleted the %(groupName)s group                        |
| user_joined_user_group                         | Joined the %(groupName)s group                         |
| user_invited_to_user_group                     | Invited %(email)s to the %(groupName)s group           |
| user_declined_invite_to_user_group             | Declined to join the %(groupName)s group               |
| user_removed_from_user_group                   | Removed %(email)s from the %(groupName)s group         |
| team_name_changed                              | Changed your company name to “%(name)s”                |
| new_billing_period_created                     | Extended your account until %(date)s                   |
| seats_added                                    | Added %(count)s seats to your account                  |
| domain_requested                               | Added %(domain)s as an unverified domain               |
| domain_validated                               | Verified the domain %(domain)s                         |
| collect_sensitive_data_audit_logs_enabled      | (user) turned on unencrypted vault logs                |
| collect_sensitive_data_audit_logs_disabled     | (user) turned off unencrypted vault logs               |
| sso_idp_metadata_set                           | Updated SSO identity provider metadata                 |
| sso_service_provider_url_set                   | Configured SSO service provider URL                    |
| sso_enabled                                    | Enabled SSO                                            |
| sso_disabled                                   | Disabled SSO                                           |
| contact_email_changed                          | Changed contact email to %(email)s                     |
| master_password_mobile_reset_enabled           | Turned on biometric recovery for %(deviceName)s        |
| two_factor_authentication_login_method_added   | Activated a 2FA method                                 |
| two_factor_authentication_login_method_removed | Removed a 2FA method                                   |
| user_invited                                   | Invited %(email)s to your account                      |
| user_removed                                   | Revoked %(email)s from your account                    |
| team_captain_added                             | Changed %(email)s to admin rights                      |
| team_captain_removed                           | Changed %(email)s to member rights                     |
| group_manager_added                            | Changed %(email)s to group manager rights              |
| group_manager_removed                          | Changed %(email)s to member rights                     |
| user_reinvited                                 | Resent an invite to %(email)s                          |
| billing_admin_added                            | Made %(name)s the billing contact                      |
| billing_admin_removed                          | Revoked %(name)s as the billing contact                |
| nitro_integration_app_installed                | Installed %(integration_app)s integration              |
| nitro_integration_app_uninstalled              | Uninstalled %(integration_app)s integration            |
| nudge_configured                               | Set %(nudge_name)s to %(status)s                       |
| nudge_executed                                 | Nudged %(successes)s users for %(nudge_name)s          |
| user_received_nudge                            | Received %(nudge_received)s nudge                      |

## Sensitive types

| Type                                       | Event message                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| collect_sensitive_data_audit_logs_enabled  | (user) turned on additional activity logs (unencrypted)                                    |
| collect_sensitive_data_audit_logs_disabled | (user) turned off additional activity logs (unencrypted)                                   |
| user_shared_credential_with_group          | (user) shared %(rights [limited/full]) rights to the %(domain)s                            |
| user_shared_credential_with_email          | (user) shared %(rights [limited/full]) rights to the %(domain)s                            |
| user_shared_credential_with_external       | (user) shared %(rights [limited/full]) rights to the %(domain)s                            |
| user_accepted_sharing_invite_credential    | (user) accepted a sharing invitation for the %(domain)s                                    |
| user_revoked_shared_credential_group       | (user) revoked access to the %(domain)s login                                              |
| user_revoked_shared_credential_external    | (user) revoked access to the %(domain)s login                                              |
| user_revoked_shared_credential_email       | (user) revoked access to the %(domain)s login                                              |
| user_created_credential                    | (user) created a login for %(domain)s                                                      |
| user_modified_credential                   | (user) modified the login for %(domain)s                                                   |
| user_deleted_credential                    | (user) deleted the login for %(domain)s                                                    |
| user_performed_autofill_credential         | Autofilled %(credential_login)s login for %(credential_domain)s on %(autofilled_domain)s   |
| user_performed_autofill_payment            | Autofilled %(item_type [bank_account/credit_card])s %(item_name)s on %(autofilled_domain)s |
| user_authenticated_with_passkey            | Logged in with %(credential_login)s passkey for %(passkey_domain)s on %(current_domain)s   |
| user_copied_credential_field               | Copied %(field)s for %(credential_login)s %(credential_domain)s login                      |
| user_copied_credit_card_field              | Copied %(field)s for %(name)s credit card                                                  |
| user_copied_bank_account_field             | Copied %(field)s for %(name)s bank account                                                 |

# Logs categories

| Category            |
| ------------------- |
| authentication      |
| dark_web_monitoring |
| groups              |
| nudges              |
| item_usage          |
| sharing             |
| team_account        |
| team_settings       |
| team_settings_sso   |
| users               |
| user_settings       |
| vault_passwords     |
`,
            inputSchema: { start: z.string(), end: z.optional(z.string()) },
        },
        async ({ start, end }) => {
            const logs = await getAuditLogs({
                enrolledTeamDeviceCredentials,
                queryParams: {
                    startDateRangeUnixMs: new Date(start).getTime(),
                    endDateRangeUnixMs: end ? new Date(end).getTime() : Date.now(),
                },
            });

            return { content: [{ type: 'text', text: JSON.stringify(logs) }] };
        }
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('MCP server is running...');

    await new Promise((resolve) => {
        server.server.onclose = () => resolve(null);
    });
};
