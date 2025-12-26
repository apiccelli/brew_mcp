import type { Application, Request, Response } from 'express';
import { BrewtecoApiClient } from '../api-client.js';
import { getTools, executeTool } from '../tools.js';

interface ServerConfig {
  serverName: string;
  serverVersion: string;
  apiBaseUrl: string;
  httpPort: number;
}

/**
 * Configura todas as rotas HTTP do servidor
 * Estas rotas são auxiliares e não fazem parte do protocolo MCP
 */
export function setupHttpRoutes(
  app: Application,
  apiClient: BrewtecoApiClient,
  config: ServerConfig
): void {
  const { serverName, serverVersion, apiBaseUrl, httpPort } = config;

  // Health check
  app.get('/mcp/health', (req: Request, res: Response) => {
    console.error('💚 [HTTP] Health check requisitado');
    res.json({
      status: 'OK',
      name: serverName,
      version: serverVersion,
      apiUrl: apiBaseUrl,
      timestamp: new Date().toISOString()
    });
  });

  // Lista de ferramentas disponíveis (formato simplificado)
  app.get('/mcp/tools', (req: Request, res: Response) => {
    console.error('📋 [HTTP] Listando ferramentas disponíveis');
    res.json({
      tools: getTools()
    });
  });

  // Executar ferramenta diretamente (formato simplificado, não-MCP)
  app.post('/mcp/tools/:toolName', async (req: Request, res: Response) => {
    const { toolName } = req.params;
    const args = req.body;

    console.error(`🔧 [HTTP] Executando ferramenta: ${toolName}`);
    console.error(`📝 [HTTP] Argumentos:`, JSON.stringify(args, null, 2));

    try {
      const result = await executeTool(toolName, args || {}, apiClient);

      if (!result.success) {
        return res.status(400).json({
          error: result.error?.message || 'Erro desconhecido da API',
          code: result.error?.code || 'API_ERROR'
        });
      }

      console.error(`✅ [HTTP] Ferramenta ${toolName} executada com sucesso`);
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error(`❌ [HTTP] Erro ao executar ${toolName}:`, error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'EXECUTION_ERROR'
      });
    }
  });

  // Documentação da API (página inicial)
  app.get('/', (req: Request, res: Response) => {
    res.send(generateDocumentationHtml(serverName, serverVersion, apiBaseUrl, httpPort));
  });
}

/**
 * Gera o HTML da página de documentação
 */
function generateDocumentationHtml(
  serverName: string,
  serverVersion: string,
  apiBaseUrl: string,
  httpPort: number
): string {
  return `
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
            background: #f9f9f9;
        }
        h1 { color: #D4AF37; }
        h2 { color: #333; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; }
        code {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .endpoint {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .method {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            margin-right: 10px;
            font-size: 12px;
        }
        .get { background: #61affe; color: white; }
        .post { background: #49cc90; color: white; }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 10px;
        }
        .mcp { background: #D4AF37; color: white; }
        .http { background: #666; color: white; }
        ul { line-height: 1.8; }
        .alert {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .alert strong { color: #856404; }
    </style>
</head>
<body>
    <h1>🍺 Brewteco MCP Server</h1>
    <p>Servidor MCP HTTP para integração com ferramentas de IA (n8n, Claude Desktop, etc.)</p>
    
    <h2>📡 Status</h2>
    <p>✅ Servidor rodando na porta <strong>${httpPort}</strong></p>
    <p>🔗 API Base: <code>${apiBaseUrl}</code></p>
    <p>📦 Versão: <strong>${serverVersion}</strong></p>
    
    <div class="alert">
        <strong>💡 Conectando com n8n:</strong><br>
        Use a URL: <code>http://localhost:${httpPort}/mcp</code><br>
        Método: POST com JSON-RPC 2.0
    </div>
    
    <h2>📌 Endpoints Principais</h2>
    
    <div class="endpoint">
        <span class="method post">POST</span>
        <code>/mcp</code>
        <span class="badge mcp">MCP Protocol</span>
        <p><strong>Endpoint principal para n8n e outros clientes MCP</strong></p>
        <p>Processa mensagens JSON-RPC 2.0 do protocolo MCP</p>
        <pre>{
  "jsonrpc": "2.0",
  "id": 0,
  "method": "tools/list",
  "params": {}
}</pre>
    </div>
    
    <h2>📌 Endpoints Auxiliares</h2>
    
    <div class="endpoint">
        <span class="method get">GET</span>
        <code>/mcp/health</code>
        <span class="badge http">HTTP</span>
        <p>Verifica status do servidor</p>
    </div>
    
    <div class="endpoint">
        <span class="method get">GET</span>
        <code>/mcp/tools</code>
        <span class="badge http">HTTP</span>
        <p>Lista todas as ferramentas MCP disponíveis (formato simplificado)</p>
    </div>
    
    <div class="endpoint">
        <span class="method post">POST</span>
        <code>/mcp/tools/:toolName</code>
        <span class="badge http">HTTP</span>
        <p>Executa uma ferramenta específica (sem protocolo MCP)</p>
        <pre>{
  "data_inicio": "2024-12-01",
  "data_fim": "2024-12-15",
  "loja": "BOTAFOGO"
}</pre>
    </div>
    
    <h2>🛠️ Ferramentas Disponíveis</h2>
    <ul>
        <li><strong>obter_vendas</strong> - Dados gerais de vendas por período</li>
        <li><strong>comparar_vendas_lojas</strong> - Comparação de performance entre lojas</li>
        <li><strong>obter_produtos</strong> - Performance detalhada de produtos</li>
        <li><strong>obter_categorias</strong> - Lista de categorias de produtos</li>
        <li><strong>obter_performance_equipe</strong> - Performance da equipe de vendas</li>
        <li><strong>obter_detalhe_funcionario</strong> - Detalhes de um funcionário específico</li>
        <li><strong>filtrar_clientes</strong> - Filtro avançado de clientes com critérios</li>
        <li><strong>obter_perfil_cliente</strong> - Perfil completo de um cliente</li>
    </ul>
    
    <h2>📝 Exemplos de Uso</h2>
    
    <h3>Exemplo 1: Listar ferramentas (MCP)</h3>
    <pre>curl -X POST http://localhost:${httpPort}/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'</pre>
  
    <h3>Exemplo 2: Executar ferramenta (MCP)</h3>
    <pre>curl -X POST http://localhost:${httpPort}/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "obter_vendas",
      "arguments": {
        "data_inicio": "2024-12-01",
        "data_fim": "2024-12-15",
        "loja": "BOTAFOGO"
      }
    }
  }'</pre>

    <h3>Exemplo 3: Executar ferramenta (HTTP direto)</h3>
    <pre>curl -X POST http://localhost:${httpPort}/mcp/tools/obter_vendas \\
  -H "Content-Type: application/json" \\
  -d '{
    "data_inicio": "2024-12-01",
    "data_fim": "2024-12-15",
    "loja": "BOTAFOGO"
  }'</pre>
    
    <h2>🔗 Links Úteis</h2>
    <ul>
        <li><a href="/mcp/health">Health Check</a></li>
        <li><a href="/mcp/tools">Ver Ferramentas</a></li>
        <li><a href="${apiBaseUrl}/health" target="_blank">Status da API Brewteco</a></li>
    </ul>
    
    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>${serverName} v${serverVersion}</p>
        <p>📚 <a href="https://modelcontextprotocol.io/" target="_blank">Documentação MCP</a></p>
    </footer>
</body>
</html>
  `;
}