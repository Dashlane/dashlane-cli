import { LocalConfiguration } from '../types.js';
import { requestUserApi } from '../requestApi.js';

interface GetPremiumStatusParams {
    localConfiguration: LocalConfiguration;
}

export const getPremiumStatus = (params: GetPremiumStatusParams) =>
    requestUserApi<GetPremiumStatusOutput>({
        path: 'premium/GetPremiumStatus',
        login: params.localConfiguration.login,
        deviceKeys: {
            accessKey: params.localConfiguration.accessKey,
            secretKey: params.localConfiguration.secretKey,
        },
        payload: {},
    });

export interface GetPremiumStatusOutput {
    currentTimestampUnix?: number;
    /**
     * B2C Status of the user independent of the B2B status
     */
    b2cStatus: {
        /**
         * statusCode, "free" for free user, "subscribed" for a user with a subscription, "legacy" for a legacy user, as he created his account before 2.0, and has sync but not any other feature
         */
        statusCode: 'free' | 'subscribed' | 'legacy';
        /**
         * Is the user in premium trial
         */
        isTrial: boolean;
        /**
         * Will the current subscription be auto renewed
         */
        autoRenewal: boolean;
        planName?: string;
        planType?:
            | 'amazon'
            | 'free_trial'
            | 'invoice'
            | 'ios'
            | 'ios_renewable'
            | 'mac'
            | 'mac_renewable'
            | 'offer'
            | 'partner'
            | 'paypal'
            | 'paypal_renewable'
            | 'playstore'
            | 'playstore_renewable'
            | 'stripe';
        planFeature?: 'premium' | 'essentials' | 'premiumplus' | 'backup-for-all';
        startDateUnix?: number;
        endDateUnix?: number;
        previousPlan?: {
            planName: string;
            endDateUnix: number;
        };
        familyStatus?: {
            isAdmin: boolean;
            familyId: number;
            planName: string;
        };
    };
    /**
     * B2B Status of the user
     */
    b2bStatus?: {
        statusCode: 'not_in_team' | 'proposed' | 'in_team';
        currentTeam?: {
            planName: string;
            recoveryHash?: string;
            teamId: number;
            teamName?: string;
            planFeature: string;
            joinDateUnix: number;
            invitationDateUnix?: number;
            associatedEmail?: string;
            teamMembership: {
                teamAdmins: string[];
                billingAdmins: string[];
                isTeamAdmin: boolean;
                isBillingAdmin: boolean;
                isSSOUser: boolean;
                isGroupManager: boolean;
            };
            teamInfo: {
                membersNumber: number;
                planType: string;
                teamDomains?: string[];
                letter?: string;
                color?: string;
                forcedDomainsEnabled?: boolean;
                removeForcedContentEnabled?: boolean;
                recoveryEnabled?: boolean;
                ssoEnabled?: boolean;
                ssoActivationType?: string;
                ssoProvisioning?: string;
                twoFAEnforced: 'disabled' | 'newDevice' | 'login' | '';
            };
        };
        pastTeams?: {
            status: string;
            revokeDateUnix: number;
            shouldDelete?: boolean;
            teamId: number;
            teamName?: string;
            planFeature: string;
            joinDateUnix: number;
            invitationDateUnix?: number;
            associatedEmail?: string;
            teamMembership: {
                teamAdmins: string[];
                billingAdmins: string[];
                isTeamAdmin: boolean;
                isBillingAdmin: boolean;
                isSSOUser: boolean;
                isGroupManager: boolean;
            };
            teamInfo: {
                membersNumber: number;
                planType: string;
                teamDomains?: string[];
                letter?: string;
                color?: string;
                forcedDomainsEnabled?: boolean;
                removeForcedContentEnabled?: boolean;
                recoveryEnabled?: boolean;
                ssoEnabled?: boolean;
                ssoActivationType?: string;
                ssoProvisioning?: string;
            };
        }[];
    };
    capabilities: (
        | {
              capability:
                  | 'sync'
                  | 'creditMonitoring'
                  | 'dataLeak'
                  | 'identityRestoration'
                  | 'identityTheftProtection'
                  | 'multipleAccounts'
                  | 'passwordsLimit'
                  | 'secureFiles'
                  | 'secureWiFi'
                  | 'securityBreach'
                  | 'sharingLimit'
                  | 'yubikey'
                  | 'secureNotes'
                  | 'passwordChanger'
                  | 'devicesLimit';
              enabled: true;
              /**
               * Room for extra information
               */
              info?: {
                  [k: string]: any;
              };
          }
        | {
              capability:
                  | 'sync'
                  | 'creditMonitoring'
                  | 'dataLeak'
                  | 'identityRestoration'
                  | 'identityTheftProtection'
                  | 'multipleAccounts'
                  | 'passwordsLimit'
                  | 'secureFiles'
                  | 'secureWiFi'
                  | 'securityBreach'
                  | 'sharingLimit'
                  | 'yubikey'
                  | 'secureNotes'
                  | 'passwordChanger'
                  | 'devicesLimit';
              enabled: false;
              /**
               * Room for extra information
               */
              info?: {
                  /**
                   * Why is it off
                   */
                  reason?: string;
                  [k: string]: any;
              };
          }
    )[];
}
