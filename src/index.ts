#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
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

/**
 * Servidor MCP para Brewteco AI via HTTP/SSE
 * Suporta tanto stdio (Claude Desktop) quanto HTTP (outras ferramentas)
 */

// Configuração
const API_BASE_URL = process.env.BREWTECO_API_URL || 'http://srv1105495.hstgr.cloud/brew/v1/';
const HTTP_PORT = parseInt(process.env.MCP_PORT || '3710', 10);
const SERVER_NAME = 'brewteco-mcp-server';
const SERVER_VERSION = '1.0.0';

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

    // Health check
    this.app.get('/mcp/health', (req: Request, res: Response) => {
      res.json({
        status: 'OK',
        name: SERVER_NAME,
        version: SERVER_VERSION,
        apiUrl: API_BASE_URL,
        timestamp: new Date().toISOString()
      });
    });

    // Lista de ferramentas disponíveis
    this.app.get('/mcptools', (req: Request, res: Response) => {
      console.error('📋 Listando ferramentas disponíveis');
      res.json({
        tools: getTools()
      });
    });

    // Executar ferramenta
    this.app.post('/mcp/tools/:toolName', async (req: Request, res: Response) => {
      const { toolName } = req.params;
      const args = req.body;

      console.error(`🔧 Executando ferramenta: ${toolName}`);
      console.error(`📝 Argumentos:`, JSON.stringify(args, null, 2));

      try {
        const result = await executeTool(toolName, args || {}, this.apiClient);

        if (!result.success) {
          return res.status(400).json({
            error: result.error?.message || 'Erro desconhecido da API',
            code: result.error?.code || 'API_ERROR'
          });
        }

        res.json({
          success: true,
          data: result.data
        });
      } catch (error) {
        console.error(`❌ Erro ao executar ${toolName}:`, error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          code: 'EXECUTION_ERROR'
        });
      }
    });

    // SSE endpoint para MCP via HTTP
    this.app.get('/mcp/sse', async (req: Request, res: Response) => {
      console.error('🔌 Nova conexão SSE recebida');

      // Configurar SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no'
      });

      // Enviar comentário inicial para manter conexão viva
      res.write(':ok\n\n');

      // Criar servidor MCP
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

      // Configurar handlers
      this.setupMcpHandlers(server);

      // Criar transport SSE
      try {
        const transport = new SSEServerTransport('/mcp/message', res);
        await server.connect(transport);
        console.error('✅ Servidor MCP conectado via SSE');
      } catch (error) {
        console.error('❌ Erro ao conectar transport SSE:', error);
        res.end();
        return;
      }

      // Heartbeat para manter conexão viva
      const heartbeat = setInterval(() => {
        res.write(':heartbeat\n\n');
      }, 30000); // a cada 30 segundos

      // Cleanup quando a conexão fechar
      req.on('close', () => {
        clearInterval(heartbeat);
        console.error('🔌 Conexão SSE fechada');
      });

      req.on('error', (error) => {
        clearInterval(heartbeat);
        console.error('❌ Erro na conexão SSE:', error);
      });
    });

    // Endpoint POST para MCP (alternativa ao SSE)
    this.app.post('/mcp/message', async (req: Request, res: Response) => {
      console.error('📨 Mensagem MCP recebida');
      console.error('📝 Body:', JSON.stringify(req.body, null, 2));

      try {
        const message = req.body;
        
        // Responder ao método tools/list
        if (message.method === 'tools/list') {
          res.json({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              tools: getTools()
            }
          });
          return;
        } 
        
        // Responder ao método tools/call
        if (message.method === 'tools/call') {
          const { name, arguments: args } = message.params;
          const result = await executeTool(name, args || {}, this.apiClient);
          
          res.json({
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
          });
          return;
        }
        
        // Responder ao método initialize
        if (message.method === 'initialize') {
          res.json({
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
          });
          return;
        }

        // Método não suportado
        res.status(400).json({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32601,
            message: `Método não suportado: ${message.method}`
          }
        });
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Erro desconhecido'
          }
        });
      }
    });

    // Documentação da API
    this.app.get('/mcp', (req: Request, res: Response) => {
      res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Brewteco MCP Server</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 { color: #D4AF37; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .endpoint {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
        }
        .method {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            margin-right: 10px;
        }
        .get { background: #61affe; color: white; }
        .post { background: #49cc90; color: white; }
    </style>
</head>
<body>
    <h1>🍺 Brewteco MCP Server</h1>
    <p>Servidor MCP HTTP para integração com ferramentas de IA</p>
    
    <h2>📡 Status</h2>
    <p>✅ Servidor rodando na porta <strong>${HTTP_PORT}</strong></p>
    <p>🔗 API Base: <code>${API_BASE_URL}</code></p>
    
    <h2>🔌 Endpoints</h2>
    
    <div class="endpoint">
        <span class="method get">GET</span>
        <code>/mcp/health</code>
        <p>Verifica status do servidor</p>
    </div>
    
    <div class="endpoint">
        <span class="method get">GET</span>
        <code>/mcp/tools</code>
        <p>Lista todas as ferramentas MCP disponíveis</p>
    </div>
    
    <div class="endpoint">
        <span class="method post">POST</span>
        <code>/mcp/tools/:toolName</code>
        <p>Executa uma ferramenta específica</p>
        <pre>{
  "data_inicio": "2024-12-01",
  "data_fim": "2024-12-15",
  "loja": "BOTAFOGO"
}</pre>
    </div>
    
    <div class="endpoint">
        <span class="method get">GET</span>
        <code>/sse</code>
        <p>Endpoint SSE para protocolo MCP completo</p>
    </div>
    
    <div class="endpoint">
        <span class="method post">POST</span>
        <code>/mcp/message</code>
        <p>Endpoint POST para mensagens MCP</p>
    </div>
    
    <h2>🛠️ Ferramentas Disponíveis</h2>
    <ul>
        <li><strong>obter_vendas</strong> - Dados gerais de vendas</li>
        <li><strong>comparar_vendas_lojas</strong> - Comparação entre lojas</li>
        <li><strong>obter_produtos</strong> - Performance de produtos</li>
        <li><strong>obter_categorias</strong> - Lista categorias</li>
        <li><strong>obter_performance_equipe</strong> - Performance da equipe</li>
        <li><strong>obter_detalhe_funcionario</strong> - Detalhe de funcionário</li>
        <li><strong>filtrar_clientes</strong> - Filtro avançado de clientes</li>
        <li><strong>obter_perfil_cliente</strong> - Perfil individual</li>
    </ul>
    
    <h2>📝 Exemplos de Uso</h2>
    
    <h3>Obter Vendas</h3>
    <pre>curl -X POST http://localhost:${HTTP_PORT}/tools/obter_vendas \\
  -H "Content-Type: application/json" \\
  -d '{
    "data_inicio": "2024-12-01",
    "data_fim": "2024-12-15",
    "loja": "BOTAFOGO"
  }'</pre>
  
    <h3>Listar Clientes VIP</h3>
    <pre>curl -X POST http://localhost:${HTTP_PORT}/tools/filtrar_clientes \\
  -H "Content-Type: application/json" \\
  -d '{
    "gasto_total_min": 1000,
    "frequencia_min": 5,
    "loja": "BOTAFOGO"
  }'</pre>
    
    <h2>🔗 Links</h2>
    <ul>
        <li><a href="/mcp/health">Health Check</a></li>
        <li><a href="/mcp/tools">Ver Ferramentas</a></li>
        <li><a href="${API_BASE_URL}/health" target="_blank">Status da API</a></li>
    </ul>
    
    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>Brewteco MCP Server v${SERVER_VERSION}</p>
    </footer>
</body>
</html>
      `);
    });
  }

  /**
   * Configura handlers MCP
   */
  private setupMcpHandlers(server: Server): void {
    // Handler: Lista de ferramentas disponíveis
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('📋 Listando ferramentas disponíveis');
      return {
        tools: getTools()
      };
    });

    // Handler: Execução de ferramentas
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      console.error(`🔧 Executando ferramenta: ${name}`);
      console.error(`📝 Argumentos:`, JSON.stringify(args, null, 2));

      try {
        const result = await executeTool(name, args || {}, this.apiClient);

        if (!result.success) {
          throw new McpError(
            ErrorCode.InternalError,
            result.error?.message || 'Erro desconhecido da API'
          );
        }

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
   * Inicia o servidor HTTP
   */
  async startHttp(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(HTTP_PORT, () => {
        console.error('='.repeat(60));
        console.error('🌐 SERVIDOR MCP HTTP');
        console.error('='.repeat(60));
        console.error(`🚀 Rodando na porta: ${HTTP_PORT}`);
        console.error(`🔗 URL: http://localhost:${HTTP_PORT}/mcp`);
        console.error(`📊 Health: http://localhost:${HTTP_PORT}/mcp/health`);
        console.error(`🛠️  Tools: http://localhost:${HTTP_PORT}/mcp/tools`);
        console.error('='.repeat(60));
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
server.startHttp().catch((error) => {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
});