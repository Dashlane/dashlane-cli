import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AiAdvisorTool, executeAiAdvisorTool, listAiAdvisorTools } from '../../endpoints/index.js';
import { DashlaneApiError } from '../../requestApi.js';
import { EnrolledTeamDeviceCredentials } from '../../types.js';
import { McpToolProvider } from '../types.js';

const toMcpTool = (tool: AiAdvisorTool): Tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: { ...tool.inputJsonSchema, type: 'object' },
    // All AI advisor tools are read-only on the server side
    annotations: { readOnlyHint: true },
});

/**
 * Tools defined on the Dashlane server, listed by cli/ListAiAdvisorTools and run by cli/ExecuteAiAdvisorTool
 */
export const aiAdvisorToolProvider = (
    enrolledTeamDeviceCredentials: EnrolledTeamDeviceCredentials
): McpToolProvider => {
    let toolsPromise: Promise<Tool[]> | null = null;

    const fetchTools = async () => {
        const { tools } = await listAiAdvisorTools({ enrolledTeamDeviceCredentials });
        return tools.map(toMcpTool);
    };

    return {
        listTools: async () => {
            toolsPromise ??= fetchTools();
            try {
                return await toolsPromise;
            } catch (error) {
                // Business errors (ex: CAPABILITY_NOT_ENABLED) are kept cached, other errors are retried on next listing
                if (!(error instanceof DashlaneApiError)) {
                    toolsPromise = null;
                }
                // stdout is reserved to the MCP stdio transport
                console.error(
                    `AI advisor tools are unavailable: ${error instanceof Error ? error.message : String(error)}`
                );
                return [];
            }
        },
        callTool: async (name, args) => {
            const { result, invalidParams } = await executeAiAdvisorTool({
                enrolledTeamDeviceCredentials,
                toolName: name,
                params: args,
            });

            // Returned as a tool error so that the LLM can fix its call
            if (invalidParams?.length) {
                return {
                    content: [{ type: 'text', text: `Invalid params:\n${invalidParams.join('\n')}` }],
                    isError: true,
                };
            }

            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        },
    };
};
