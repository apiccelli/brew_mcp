import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { BrewtecoApiClient } from '../api-client.js';
import { getTools, executeTool } from '../tools.js';

/**
 * Configura os handlers MCP padrão para o servidor
 * Estes handlers processam requisições do protocolo MCP
 */
export function setupMcpHandlers(server: Server, apiClient: BrewtecoApiClient): void {
  // Handler: Lista de ferramentas disponíveis
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error('📋 [MCP Handler] Listando ferramentas disponíveis');
    return {
      tools: getTools()
    };
  });

  // Handler: Execução de ferramentas
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    console.error(`🔧 [MCP Handler] Executando ferramenta: ${name}`);
    console.error(`📝 [MCP Handler] Argumentos:`, JSON.stringify(args, null, 2));

    try {
      const result = await executeTool(name, args || {}, apiClient);

      if (!result.success) {
        throw new McpError(
          ErrorCode.InternalError,
          result.error?.message || 'Erro desconhecido da API'
        );
      }

      console.error(`✅ [MCP Handler] Ferramenta ${name} executada com sucesso`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`❌ [MCP Handler] Erro ao executar ${name}:`, error);

      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InternalError,
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  });
}