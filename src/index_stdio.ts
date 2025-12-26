#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { BrewtecoApiClient } from './api-client.js';
import { getTools, executeTool } from './tools.js';

/**
 * Servidor MCP para Brewteco AI
 * Fornece acesso às APIs de relatórios e CRM via Model Context Protocol
 */

// Configuração
const API_BASE_URL = process.env.BREWTECO_API_URL || 'http://localhost:3700/api/v1';
const SERVER_NAME = 'brewteco-mcp-server';
const SERVER_VERSION = '1.0.0';

/**
 * Classe principal do servidor MCP
 */
class BrewtecoMcpServer {
  private server: Server;
  private apiClient: BrewtecoApiClient;

  constructor() {
    // Inicializa servidor MCP
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    // Inicializa cliente da API
    this.apiClient = new BrewtecoApiClient({
      apiBaseUrl: API_BASE_URL,
      timeout: 30000,
      retries: 3
    });

    this.setupHandlers();
    this.setupErrorHandling();

    console.error('🍺 Brewteco MCP Server iniciado');
    console.error(`📡 API Base URL: ${API_BASE_URL}`);
  }

  /**
   * Configura os handlers do servidor MCP
   */
  private setupHandlers(): void {
    // Handler: Lista de ferramentas disponíveis
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('📋 Listando ferramentas disponíveis');
      return {
        tools: getTools()
      };
    });

    // Handler: Execução de ferramentas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      console.error(`🔧 Executando ferramenta: ${name}`);
      console.error(`📝 Argumentos:`, JSON.stringify(args, null, 2));

      try {
        const result = await executeTool(name, args || {}, this.apiClient);

        // Se a resposta da API indica erro
        if (!result.success) {
          throw new McpError(
            ErrorCode.InternalError,
            result.error?.message || 'Erro desconhecido da API'
          );
        }

        // Retorna resultado formatado
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error(`❌ Erro ao executar ${name}:`, error);

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

  /**
   * Configura tratamento de erros global
   */
  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      console.error('❌ Erro não capturado:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('❌ Promise rejeitada não tratada:', reason);
      process.exit(1);
    });

    process.on('SIGINT', async () => {
      console.error('\n👋 Encerrando servidor MCP...');
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('\n👋 Encerrando servidor MCP...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Inicia o servidor
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('✅ Servidor MCP conectado via stdio');
  }
}

// Inicializa e inicia o servidor
const server = new BrewtecoMcpServer();
server.start().catch((error) => {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
});