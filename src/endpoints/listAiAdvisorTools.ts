import { EnrolledTeamDeviceCredentials } from '../types.js';
import { requestEnrolledDeviceApi } from '../requestApi.js';

interface ListAiAdvisorToolsParams {
    enrolledTeamDeviceCredentials: EnrolledTeamDeviceCredentials;
}

export const listAiAdvisorTools = (params: ListAiAdvisorToolsParams) =>
    requestEnrolledDeviceApi<ListAiAdvisorToolsOutput>({
        path: 'cli/ListAiAdvisorTools',
        enrolledTeamDeviceKeys: params.enrolledTeamDeviceCredentials,
        payload: {},
    });

export interface AiAdvisorTool {
    /**
     * Tool name, to pass as toolName to cli/ExecuteAiAdvisorTool
     */
    name: string;
    /**
     * What the tool returns, written for an LLM
     */
    description: string;
    /**
     * JSON Schema (draft 2020-12) of the params accepted by the tool
     */
    inputJsonSchema: Record<string, unknown>;
}

export interface ListAiAdvisorToolsOutput {
    /**
     * The AI advisor tools that can be run with cli/ExecuteAiAdvisorTool
     */
    tools: AiAdvisorTool[];
}
