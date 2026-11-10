import { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * A source of MCP tools. Each provider lists the tools it owns and runs them,
 * the MCP server aggregates all providers.
 */
export interface McpToolProvider {
    listTools: () => Promise<Tool[]>;
    callTool: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
}
