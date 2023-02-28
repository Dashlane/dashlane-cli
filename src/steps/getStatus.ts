import { Secrets } from '../types';
import { requestApi } from '../requestApi';

interface GetPremiumStatusParams {
    secrets: Secrets;
}

export const getPremiumStatus = (params: GetPremiumStatusParams) =>
    requestApi<GetPremiumStatusOutput>({
        path: 'premium/GetPremiumStatus',
        login: params.secrets.login,
        deviceKeys: {
            accessKey: params.secrets.accessKey,
            secretKey: params.secrets.secretKey,
        },
        payload: {},
    });

export interface GetPremiumStatusOutput {
    currentTimestampUnix?: number;
    /**
     * B2C Status of the user independant of the B2B status
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

export interface GetTeamMembersOutput {
    /**
     * Array of team members as FormattedInfo object with TwoFAStatus and HasPublicKey
     */
    members: {
        /**
         * the user identifier of the user
         */
        userId?: number;
        /**
         * user login(usually email)
         */
        login: string;
        /**
         * member status - type BasicMemberStatus or LegacyMemberStatus
         */
        status: string;
        /**
         * the join date of member in unix time
         */
        joinedDateUnix?: number | null;
        /**
         * last updated date of member in unix time
         */
        lastUpdateDateUnix?: number | null;
        /**
         * true if user is billing admin, false otherwise
         */
        isBillingAdmin: boolean;
        /**
         * true if user is team captain, false otherwise
         */
        isTeamCaptain: boolean;
        /**
         * true if user is group manager, false otherwise
         */
        isGroupManager: boolean;
        /**
         * the user's account email
         */
        email?: string;
        /**
         * if user account is created
         */
        isAccountCreated?: boolean;
        /**
         * date user was invited
         */
        invitedDateUnix?: number;
        /**
         * the user's invite token
         */
        token?: {
            /**
             * user identifier associated with the token
             */
            userId?: number;
            /**
             * team identifier associated with the token
             */
            teamId?: number;
            /**
             * value of the invite token
             */
            token?: string;
            /**
             * true if token is not used, false otherwise
             */
            isFresh?: boolean;
            /**
             * the user identifier of the inviter
             */
            inviteUserId?: number;
        };
        /**
         * when user's was revoked in unix time
         */
        revokedDateUnix?: number | null;
        /**
         * when user's was revoked in unix time
         */
        language?: string;
        /**
         * number of passwords stored by user
         */
        nbrPasswords?: number | null;
        /**
         * number of reused passwords
         */
        reused?: number | null;
        /**
         * number of distinct reused passwords
         */
        reusedDistinct?: number | null;
        /**
         * number of weak passwords
         */
        weakPasswords?: number | null;
        /**
         * number of compromised passwords
         */
        compromisedPasswords?: number | null;
        /**
         * average password strength score
         */
        averagePasswordStrength?: number | null;
        /**
         * number of passwords between 0 to 19 characters
         */
        passwordStrength0_19Count?: number | null;
        /**
         * number of passwords between 20 to 39 characters
         */
        passwordStrength20_39Count?: number | null;
        /**
         * number of passwords between 40 to 59 characters
         */
        passwordStrength40_59Count?: number | null;
        /**
         * number of passwords between 60 to 79 characters
         */
        passwordStrength60_79Count?: number | null;
        /**
         * number of passwords between 80 to 100 characters
         */
        passwordStrength80_100Count?: number | null;
        /**
         * number of passwords which are considered safe
         */
        safePasswords?: number | null;
        /**
         * User's name
         */
        name: string | null;
        securityIndex?: number | null;
        /**
         * 2fa information for the user
         */
        twoFAInformation: {
            /**
             * 2fa type
             */
            type?: 'sso' | 'email_token' | 'totp_device_registration' | 'totp_login';
            /**
             * phone number for 2fa
             */
            phone?: string | null;
            /**
             * last updated in unix time
             */
            lastUpdateDateUnix?: number | null;
        };
        /**
         * if user has public key
         */
        hasPublicKey: boolean;
    }[];
    /**
     * Array of emails of billing admins
     */
    billingAdmins: string[];
    /**
     * Current page of results
     */
    page: number;
    /**
     * Total pages of results
     */
    pages: number;
}
