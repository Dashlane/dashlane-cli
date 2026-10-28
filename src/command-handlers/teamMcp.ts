import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getEnrolledTeamDeviceCredentials } from '../utils/index.js';
import { createMcpServer } from '../mcp/createMcpServer.js';
import { aiAdvisorToolProvider } from '../mcp/providers/aiAdvisorToolProvider.js';
import { auditLogsToolProvider } from '../mcp/providers/auditLogsToolProvider.js';

export const runTeamMcp = async () => {
    const enrolledTeamDeviceCredentials = getEnrolledTeamDeviceCredentials();

    const server = createMcpServer({
        name: 'Dashlane Password Manager - Team MCP',
        providers: [
            auditLogsToolProvider(enrolledTeamDeviceCredentials),
            aiAdvisorToolProvider(enrolledTeamDeviceCredentials),
        ],
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    // stdout is reserved to the MCP stdio transport
    console.error('MCP server is running...');

    await new Promise((resolve) => {
        server.onclose = () => resolve(null);
    });
};
