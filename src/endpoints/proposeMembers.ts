import { EnrolledTeamDeviceCredentials } from '../types.js';
import { requestEnrolledDeviceApi } from '../requestApi.js';

interface ProposeMembersNotificationOptions {
    skipAccountCreationRequiredAlerts?: boolean;
    skipProposals?: boolean;
    skipRemovals?: boolean;
    skipReproposals?: boolean;
    senderEmail?: string;
}

export interface ProposeMembersParams {
    enrolledTeamDeviceCredentials: EnrolledTeamDeviceCredentials;
    /**
     * Logins to be proposed to the team
     */
    proposedMemberLogins: string[];
    /**
     * Optional additional parameters to specify specific behaviors
     */
    notificationOptions?: ProposeMembersNotificationOptions;
}

export const proposeMembers = (params: ProposeMembersParams) =>
    requestEnrolledDeviceApi<ProposeMembersOutput>({
        path: 'cli/ProposeMembers',
        enrolledTeamDeviceKeys: params.enrolledTeamDeviceCredentials,
        payload: {
            proposedMemberLogins: params.proposedMemberLogins,
            notificationOptions: params.notificationOptions,
        },
    });

export interface ProposeMembersOutput {
    /**
     * Map of proposed login to whether the proposal succeeded
     */
    proposedMembers: Record<string, boolean>;
    /**
     * Map of refused login to either a boolean or a reason string
     */
    refusedMembers: Record<string, boolean | string>;
    /**
     * Logins that require an account to be created before they can be proposed
     */
    accountCreationRequiredMembers: string[];
}
