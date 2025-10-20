import { EnrolledTeamDeviceCredentials } from '../types.js';
import { requestEnrolledDeviceApi } from '../requestApi.js';

interface GetTeamReportParams {
    enrolledTeamDeviceCredentials: EnrolledTeamDeviceCredentials;
    days: number;
}

export const getTeamReport = (params: GetTeamReportParams) =>
    requestEnrolledDeviceApi<GetTeamReportOutput>({
        path: 'cli/Report',
        enrolledTeamDeviceKeys: params.enrolledTeamDeviceCredentials,
        payload: {
            numberOfDays: params.days,
        },
    });

export interface GetTeamReportOutput {
    seats: {
        /**
         * The total number of seats that are paid
         * */
        provisioned: number;
        /**
         * The number of used seats (active, pending)
         */
        used: number;

        pending: number;
        /**
         * The number of pending invitations
         */
    };
    /**
     * Array of security index score per date
     */
    passwordHealthHistory: {
        /**
         * The day of the aggregation
         */
        date: string;

        /**
         * The aggregated security Index for this team
         */
        securityIndex: number;
    }[];
    passwordHealth: {
        /**
         * The aggregated security index of the team
         */
        securityIndex: number;

        /**
         * The total number of passwords in this team
         */
        passwords: number;

        /**
         * The total number of safe passwords in this team
         */
        safe: number;

        /**
         * The total number of weak passwords in this team
         */
        weak: number;

        /**
         * The total number of reused passwords in this team
         */
        reused: number;

        /**
         * The total number of compromised passwords in this team
         */
        compromised: number;
    };
}
