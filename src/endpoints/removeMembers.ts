import { EnrolledTeamDeviceCredentials } from '../types.js';
import { requestEnrolledDeviceApi } from '../requestApi.js';

interface RemoveMembersParams {
    enrolledTeamDeviceCredentials: EnrolledTeamDeviceCredentials;
    /**
     * Array of members to remove
     */
    removedMemberLogins: string[];
}

export const removeMembers = (params: RemoveMembersParams) =>
    requestEnrolledDeviceApi<RemoveMembersOutput>({
        path: 'cli/RemoveMembers',
        enrolledTeamDeviceKeys: params.enrolledTeamDeviceCredentials,
        payload: {
            removedMemberLogins: params.removedMemberLogins,
        },
    });

export interface RemoveMembersOutput {
    /**
     * Map of removed login to whether the removal succeeded
     */
    removedMembers: Record<string, boolean>;
    /**
     * Map of login to whether the (unproposed) member was unproposed
     */
    unproposedMembers: Record<string, boolean>;
    /**
     * Map of refused login to a reason string
     */
    refusedMembers: Record<string, string>;
}
