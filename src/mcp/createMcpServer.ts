import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    CallToolRequestSchema,
    CallToolResult,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
    Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { CLI_VERSION, cliVersionToString } from '../cliVersion.js';
import { McpToolProvider } from './types.js';

interface CreateMcpServerParams {
    name: string;
    providers: McpToolProvider[];
}

interface OwnedTool {
    tool: Tool;
    provider: McpToolProvider;
}

export const createMcpServer = (params: CreateMcpServerParams) => {
    const { name, providers } = params;

    const server = new Server({ name, version: cliVersionToString(CLI_VERSION) }, { capabilities: { tools: {} } });

    // On name collisions, the first provider wins
    const listOwnedTools = async (): Promise<Map<string, OwnedTool>> => {
        const toolsByProvider = await Promise.all(
            providers.map(async (provider) => ({ provider, tools: await provider.listTools() }))
        );

        const ownedTools = new Map<string, OwnedTool>();
        for (const { provider, tools } of toolsByProvider) {
            for (const tool of tools) {
                if (!ownedTools.has(tool.name)) {
                    ownedTools.set(tool.name, { tool, provider });
                }
            }
        }
        return ownedTools;
    };

    server.setRequestHandler(ListToolsRequestSchema, async () => {
        const ownedTools = await listOwnedTools();
        return { tools: [...ownedTools.values()].map(({ tool }) => tool) };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
        const { name: toolName, arguments: args = {} } = request.params;

        const ownedTool = (await listOwnedTools()).get(toolName);
        if (!ownedTool) {
            throw new McpError(ErrorCode.InvalidParams, `Tool ${toolName} not found`);
        }

        try {
            return await ownedTool.provider.callTool(toolName, args);
        } catch (error) {
            return {
                content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
                isError: true,
            };
        }
    });

    return server;
};
