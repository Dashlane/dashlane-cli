import { EnrolledTeamDeviceCredentials } from '../types.js';
import { requestEnrolledDeviceApi } from '../requestApi.js';

interface ExecuteAiAdvisorToolParams {
    enrolledTeamDeviceCredentials: EnrolledTeamDeviceCredentials;
    /**
     * Name of the tool to run, as returned by cli/ListAiAdvisorTools
     */
    toolName: string;
    /**
     * Tool params, validated against the tool's inputJsonSchema. Missing fields take their default values.
     */
    params?: Record<string, unknown>;
}

export const executeAiAdvisorTool = (params: ExecuteAiAdvisorToolParams) =>
    requestEnrolledDeviceApi<ExecuteAiAdvisorToolOutput>({
        path: 'cli/ExecuteAiAdvisorTool',
        enrolledTeamDeviceKeys: params.enrolledTeamDeviceCredentials,
        payload: {
            toolName: params.toolName,
            params: params.params,
        },
    });

export interface ExecuteAiAdvisorToolOutput {
    /**
     * Name of the tool that was run
     */
    toolName: string;
    /**
     * Tool result, scoped to the team of the enrolled device. Absent when invalidParams is set.
     */
    result?: Record<string, unknown>;
    /**
     * Set when params do not match the tool input schema, e.g. "rangeInDays: Must be at most 90 days".
     */
    invalidParams?: string[];
}
