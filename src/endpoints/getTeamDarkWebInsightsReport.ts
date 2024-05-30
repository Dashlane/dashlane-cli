import { requestTeamApi } from '../requestApi.js';
import { TeamDeviceCredentials } from '../types.js';

interface GetTeamDarkWebInsightsReportParams {
    teamDeviceCredentials: TeamDeviceCredentials;
    domain: string;
    orderBy: 'DEFAULT' | 'UNSEEN' | 'TEAM_MEMBERS' | 'PUBLISH_DATE';
    count: number;
    offset: number;
}

export const getTeamDarkWebInsightsReport = async (params: GetTeamDarkWebInsightsReportParams) =>
    requestTeamApi<GetTeamDarkWebInsightsReportOutput>({
        path: 'teams-teamdevice/GetDarkWebInsightsReportDetails',
        teamUuid: params.teamDeviceCredentials.uuid,
        teamDeviceKeys: {
            accessKey: params.teamDeviceCredentials.accessKey,
            secretKey: params.teamDeviceCredentials.secretKey,
        },
        payload: {
            domain: params.domain,
            orderBy: 'DEFAULT',
            count: params.count,
            offset: params.offset,
        },
    });

interface GetTeamDarkWebInsightsReportOutput {
    leaksCount: number;
    emailsImpactedCount: number;
    /**
     * A list of all impacted emails
     */
    allImpactedEmails: string[];
    /**
     * Dataleaks grouped by impacted email
     */
    emails: {
        email: string;
        breachesCount: number;
        leaks: {
            domain: string;
            types: (
                | 'phone'
                | 'password'
                | 'email'
                | 'username'
                | 'creditcard'
                | 'address'
                | 'ip'
                | 'geolocation'
                | 'personalinfo'
                | 'social'
            )[];
            breachDateUnix: number;
        }[];
        viewStatus: 'new' | 'viewed';
    }[];
}
