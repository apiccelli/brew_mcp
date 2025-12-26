#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import type { Server as HttpServer } from 'http';
import { BrewtecoApiClient } from './api-client.js';
import { getTools, executeTool } from './tools.js';
import { setupHttpRoutes } from './routes/http-routes';
import { setupMcpHandlers } from './handlers/mcp-handlers';

/**
 * Servidor MCP para Brewteco AI via HTTP/SSE
 * Suporta tanto stdio (Claude Desktop) quanto HTTP (n8n e outras ferramentas)
 */

// Configuração
const API_BASE_URL = process.env.BREWTECO_API_URL || 'http://srv1105495.hstgr.cloud/brew/v1';
const HTTP_PORT = parseInt(process.env.MCP_PORT || '3710', 10);
const SERVER_NAME = 'brewteco-mcp-server';
const SERVER_VERSION = '1.0.0';
const USE_STDIO = process.env.USE_STDIO === 'true';

/**
 * Classe principal do servidor MCP com suporte HTTP e stdio
 */
class BrewtecoMcpServer {
  private apiClient: BrewtecoApiClient;
  private app: express.Application;
  private httpServer: HttpServer | null = null;

  constructor() {
    // Inicializa cliente da API
    this.apiClient = new BrewtecoApiClient({
      apiBaseUrl: API_BASE_URL,
      timeout: 30000,
      retries: 3
    });

    // Inicializa Express
    this.app = express();
    this.setupExpress();

    console.error('🍺 Brewteco MCP Server iniciado');
    console.error(`📡 API Base URL: ${API_BASE_URL}`);
  }

  /**
   * Configura Express e middlewares
   */
  private setupExpress(): void {
    // Middlewares
    this.app.use(cors());
    this.app.use(express.json());

    // Configura rotas HTTP (movido para arquivo separado)
    setupHttpRoutes(this.app, this.apiClient, {
      serverName: SERVER_NAME,
      serverVersion: SERVER_VERSION,
      apiBaseUrl: API_BASE_URL,
      httpPort: HTTP_PORT
    });

    // Endpoint para n8n e outros clientes MCP via HTTP POST
    this.app.post('/mcp', async (req: Request, res: Response) => {
      console.error('📨 Requisição MCP recebida via POST');
      console.error('📝 Body:', JSON.stringify(req.body, null, 2));

      try {
        const message = req.body;

        // Cria um servidor MCP temporário para processar a mensagem
        const mcpServer = new Server(
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

        // Configura handlers
        setupMcpHandlers(mcpServer, this.apiClient);

        // Processa a mensagem baseado no método
        let response;

        if (message.method === 'initialize') {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: SERVER_NAME,
                version: SERVER_VERSION
              }
            }
          };
        } else if (message.method === 'tools/list') {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              tools: getTools()
            }
          };
        } else if (message.method === 'tools/call') {
          const { name, arguments: args } = message.params;
          const result = await executeTool(name, args || {}, this.apiClient);

          if (!result.success) {
            response = {
              jsonrpc: '2.0',
              id: message.id,
              error: {
                code: ErrorCode.InternalError,
                message: result.error?.message || 'Erro desconhecido da API'
              }
            };
          } else {
            response = {
              jsonrpc: '2.0',
              id: message.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(result.data, null, 2)
                  }
                ]
              }
            };
          }
        } else {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32601,
              message: `Método não suportado: ${message.method}`
            }
          };
        }

        console.error('✅ Resposta MCP:', JSON.stringify(response, null, 2));
        res.json(response);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem MCP:', error);
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: {
            code: ErrorCode.InternalError,
            message: error instanceof Error ? error.message : 'Erro desconhecido'
          }
        });
      }
    });
  }

  /**
   * Inicia servidor via stdio (para Claude Desktop)
   */
  async startStdio(): Promise<void> {
    console.error('📟 Iniciando servidor MCP via STDIO');

    const server = new Server(
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

    setupMcpHandlers(server, this.apiClient);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('✅ Servidor MCP conectado via STDIO');
    console.error('⏳ Aguardando requisições...');
  }

  /**
   * Inicia o servidor HTTP (para n8n e outros clientes HTTP)
   */
  async startHttp(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(HTTP_PORT, () => {
        console.error('='.repeat(60));
        console.error('🌐 SERVIDOR MCP HTTP');
        console.error('='.repeat(60));
        console.error(`🚀 Rodando na porta: ${HTTP_PORT}`);
        console.error(`📗 URL Principal: http://localhost:${HTTP_PORT}/mcp`);
        console.error(`📊 Health: http://localhost:${HTTP_PORT}/mcp/health`);
        console.error(`🛠️  Tools: http://localhost:${HTTP_PORT}/mcp/tools`);
        console.error(`📖 Docs: http://localhost:${HTTP_PORT}/`);
        console.error('='.repeat(60));
        console.error('');
        console.error('💡 Para n8n, use a URL: http://localhost:3710/mcp');
        console.error('');
        resolve();
      });
    });
  }

  /**
   * Configura tratamento de erros e shutdown
   */
  setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      console.error('❌ Erro não capturado:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('❌ Promise rejeitada não tratada:', reason);
      process.exit(1);
    });

    const shutdown = async (signal: string) => {
      console.error(`\n👋 Recebido ${signal}, encerrando servidor...`);

      if (this.httpServer) {
        this.httpServer.close(() => {
          console.error('✅ Servidor HTTP encerrado');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }

      // Força encerramento após 10 segundos
      setTimeout(() => {
        console.error('⚠️  Encerramento forçado após timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Inicializa e inicia o servidor
const server = new BrewtecoMcpServer();
server.setupErrorHandling();

// Escolhe o modo baseado na variável de ambiente
if (USE_STDIO) {
  server.startStdio().catch((error) => {
    console.error('❌ Erro ao iniciar servidor STDIO:', error);
    process.exit(1);
  });
} else {
  server.startHttp().catch((error) => {
    console.error('❌ Erro ao iniciar servidor HTTP:', error);
    process.exit(1);
  });
}