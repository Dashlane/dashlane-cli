import { getTeamReport as getTeamReportRequest } from '../endpoints';
import { Secrets } from '../types';

interface GetTeamMembersParams {
    secrets: Secrets;
    days: number;
}

export const getTeamReport = async (params: GetTeamMembersParams) => {
    const { secrets, days } = params;

    const response = await getTeamReportRequest({
        secrets,
        days,
    });

    console.log(JSON.stringify(response));
};
