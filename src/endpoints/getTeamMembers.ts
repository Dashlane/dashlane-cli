import { Secrets } from '../types';
import { requestUserApi } from '../requestApi';

interface GetTeamMembersParams {
    teamId: number;
    secrets: Secrets;
    page: number;
    limit: number;
}

export const getTeamMembers = (params: GetTeamMembersParams) =>
    requestUserApi<GetTeamMembersOutput>({
        path: 'teams/GetTeamMembers',
        login: params.secrets.login,
        deviceKeys: {
            accessKey: params.secrets.accessKey,
            secretKey: params.secrets.secretKey,
        },
        payload: {
            teamId: params.teamId,
            orderBy: 'login',
            page: params.page,
            limit: params.limit,
        },
    });

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
