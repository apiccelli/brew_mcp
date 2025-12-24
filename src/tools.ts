import type { BrewtecoApiClient } from './api-client.js';
import {
  VendasSchema,
  ProdutosSchema,
  StaffSchema,
  ClienteFiltroSchema,
  ClientePerfilSchema,
  LOJAS_DISPONIVEIS
} from './types.js';

/**
 * Define todas as ferramentas MCP disponíveis
 */
export function getTools() {
  return [
    // ==========================================
    // VENDAS
    // ==========================================
    {
      name: 'obter_vendas',
      description: `Obtém dados gerais de vendas (faturamento, transações, ticket médio) de uma loja em um período.

Parâmetros:
- data_inicio: Data inicial no formato YYYY-MM-DD (ex: 2024-12-01)
- data_fim: Data final no formato YYYY-MM-DD (ex: 2024-12-15)
- loja (opcional): Nome da loja (${LOJAS_DISPONIVEIS.join(', ')})

Retorna:
- valor_total: Faturamento total do período
- quantidade_transacoes: Número de vendas realizadas
- ticket_medio: Valor médio por venda
- periodo: Período consultado
- loja: Nome da loja (se especificado)`,
      inputSchema: {
        type: 'object',
        properties: {
          data_inicio: {
            type: 'string',
            description: 'Data inicial (YYYY-MM-DD)',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$'
          },
          data_fim: {
            type: 'string',
            description: 'Data final (YYYY-MM-DD)',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$'
          },
          loja: {
            type: 'string',
            description: `Nome da loja (opcional). Lojas: ${LOJAS_DISPONIVEIS.join(', ')}`,
            enum: LOJAS_DISPONIVEIS
          }
        },
        required: ['data_inicio', 'data_fim']
      }
    },

    {
      name: 'comparar_vendas_lojas',
      description: `Compara vendas entre todas as lojas em um período.

Parâmetros:
- data_inicio: Data inicial (YYYY-MM-DD)
- data_fim: Data final (YYYY-MM-DD)

Retorna lista com:
- loja_nome: Nome da loja
- valor_total: Faturamento
- quantidade_transacoes: Número de vendas
- ticket_medio: Ticket médio`,
      inputSchema: {
        type: 'object',
        properties: {
          data_inicio: {
            type: 'string',
            description: 'Data inicial (YYYY-MM-DD)'
          },
          data_fim: {
            type: 'string',
            description: 'Data final (YYYY-MM-DD)'
          }
        },
        required: ['data_inicio', 'data_fim']
      }
    },

    // ==========================================
    // PRODUTOS
    // ==========================================
    {
      name: 'obter_produtos',
      description: `Obtém ranking de produtos mais vendidos com filtros avançados.

Parâmetros:
- periodo: hoje, ontem, semana_atual, mes_atual, custom
- data_inicio: Se periodo=custom, data inicial (YYYY-MM-DD)
- data_fim: Se periodo=custom, data final (YYYY-MM-DD)
- categoria (opcional): Filtrar por categoria (Chope, Cerveja, Comida, etc)
- limite (opcional): Quantidade de resultados (padrão: 10, máximo: 100)
- ordem (opcional): mais_vendidos ou menos_vendidos (padrão: mais_vendidos)
- loja (opcional): Filtrar por loja específica

Retorna lista de produtos com:
- produto_nome: Nome do produto
- categoria: Categoria
- quantidade_vendida: Unidades vendidas
- valor_total: Valor total vendido
- percentual_total: % do faturamento`,
      inputSchema: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            enum: ['hoje', 'ontem', 'semana_atual', 'mes_atual', 'custom'],
            description: 'Período de análise'
          },
          data_inicio: {
            type: 'string',
            description: 'Data inicial (YYYY-MM-DD) - obrigatório se periodo=custom'
          },
          data_fim: {
            type: 'string',
            description: 'Data final (YYYY-MM-DD) - obrigatório se periodo=custom'
          },
          categoria: {
            type: 'string',
            description: 'Filtrar por categoria (opcional)'
          },
          limite: {
            type: 'number',
            description: 'Quantidade de resultados (1-100)',
            minimum: 1,
            maximum: 100
          },
          ordem: {
            type: 'string',
            enum: ['mais_vendidos', 'menos_vendidos'],
            description: 'Ordem dos resultados'
          },
          loja: {
            type: 'string',
            enum: LOJAS_DISPONIVEIS,
            description: 'Filtrar por loja específica'
          }
        },
        required: ['periodo']
      }
    },

    {
      name: 'obter_categorias',
      description: 'Lista todas as categorias de produtos disponíveis no sistema.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },

    // ==========================================
    // EQUIPE
    // ==========================================
    {
      name: 'obter_performance_equipe',
      description: `Obtém ranking de vendas da equipe (garçons/atendentes) com análise de mix.

Parâmetros:
- periodo: hoje, ontem, semana_atual, mes_atual, custom
- data_inicio: Se periodo=custom, data inicial (YYYY-MM-DD)
- data_fim: Se periodo=custom, data final (YYYY-MM-DD)
- loja (opcional): Filtrar por loja específica

Retorna lista com:
- employee_name: Nome do funcionário
- total_vendas: Total vendido
- quantidade_transacoes: Número de vendas
- ticket_medio: Ticket médio
- percentual_bebida: % de bebidas nas vendas
- percentual_comida: % de comida nas vendas
- percentual_outros: % de outros itens`,
      inputSchema: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            enum: ['hoje', 'ontem', 'semana_atual', 'mes_atual', 'custom']
          },
          data_inicio: {
            type: 'string',
            description: 'Data inicial (YYYY-MM-DD)'
          },
          data_fim: {
            type: 'string',
            description: 'Data final (YYYY-MM-DD)'
          },
          loja: {
            type: 'string',
            enum: LOJAS_DISPONIVEIS
          }
        },
        required: ['periodo']
      }
    },

    {
      name: 'obter_detalhe_funcionario',
      description: `Obtém detalhamento de vendas por categoria de um funcionário específico.

Parâmetros:
- nome: Nome do funcionário
- data_inicio: Data inicial (YYYY-MM-DD)
- data_fim: Data final (YYYY-MM-DD)`,
      inputSchema: {
        type: 'object',
        properties: {
          nome: {
            type: 'string',
            description: 'Nome do funcionário'
          },
          data_inicio: {
            type: 'string',
            description: 'Data inicial (YYYY-MM-DD)'
          },
          data_fim: {
            type: 'string',
            description: 'Data final (YYYY-MM-DD)'
          }
        },
        required: ['nome', 'data_inicio', 'data_fim']
      }
    },

    // ==========================================
    // CLIENTES
    // ==========================================
    {
      name: 'filtrar_clientes',
      description: `Busca e filtra clientes com base em comportamento de consumo.

Parâmetros (todos opcionais):
- categorias_consumidas: Array de categorias (ex: ["IPA", "Chope"])
- produtos_consumidos: Array de produtos específicos
- gasto_total_min: Gasto mínimo total
- gasto_total_max: Gasto máximo total
- dias_sem_visita_min: Dias mínimos sem visitar (para buscar clientes inativos)
- frequencia_min: Frequência mínima de visitas
- loja: Filtrar por loja específica
- data_inicio: Data inicial do período de análise
- data_fim: Data final do período
- limite: Quantidade de resultados (padrão: 100, máximo: 1000)

Casos de uso:
- Clientes VIP: gasto_total_min=1000, frequencia_min=5
- Clientes Sumidos: dias_sem_visita_min=45
- Fãs de IPA: categorias_consumidas=["IPA"]

Retorna lista de clientes com:
- user_name: Nome
- user_phone: Telefone
- user_email: Email
- gasto_total: Total gasto
- frequencia_visitas: Número de visitas
- loja_preferida: Loja preferida
- dias_sem_visitar: Dias desde última visita`,
      inputSchema: {
        type: 'object',
        properties: {
          categorias_consumidas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Categorias consumidas'
          },
          produtos_consumidos: {
            type: 'array',
            items: { type: 'string' },
            description: 'Produtos específicos'
          },
          gasto_total_min: {
            type: 'number',
            description: 'Gasto mínimo'
          },
          gasto_total_max: {
            type: 'number',
            description: 'Gasto máximo'
          },
          dias_sem_visita_min: {
            type: 'number',
            description: 'Dias mínimos sem visitar'
          },
          frequencia_min: {
            type: 'number',
            description: 'Frequência mínima de visitas'
          },
          loja: {
            type: 'string',
            enum: LOJAS_DISPONIVEIS
          },
          data_inicio: {
            type: 'string',
            description: 'Data inicial (YYYY-MM-DD)'
          },
          data_fim: {
            type: 'string',
            description: 'Data final (YYYY-MM-DD)'
          },
          limite: {
            type: 'number',
            description: 'Limite de resultados',
            minimum: 1,
            maximum: 1000
          }
        }
      }
    },

    {
      name: 'obter_perfil_cliente',
      description: `Obtém perfil completo de um cliente específico com histórico e preferências.

Parâmetros:
- identificador: CPF, telefone ou email do cliente

Retorna:
- user_name: Nome
- ltv: Life Time Value (total gasto histórico)
- primeira_visita: Data da primeira visita
- ultima_visita: Data da última visita
- total_visitas: Número total de visitas
- ticket_medio: Ticket médio
- produtos_favoritos: Top 5 produtos preferidos
- loja_preferida: Loja preferida
- categorias_preferidas: Categorias preferidas
- dias_desde_ultima_visita: Dias desde última visita
- classificacao: VIP, Regular, Eventual ou Sumido`,
      inputSchema: {
        type: 'object',
        properties: {
          identificador: {
            type: 'string',
            description: 'CPF, telefone ou email do cliente'
          }
        },
        required: ['identificador']
      }
    }
  ];
}

/**
 * Executa uma ferramenta MCP
 */
export async function executeTool(
  name: string,
  args: any,
  apiClient: BrewtecoApiClient
): Promise<any> {
  try {
    switch (name) {
      case 'obter_vendas': {
        const params = VendasSchema.parse(args);
        return await apiClient.obterVendas(params);
      }

      case 'comparar_vendas_lojas': {
        const { data_inicio, data_fim } = args;
        return await apiClient.compararVendas(data_inicio, data_fim);
      }

      case 'obter_produtos': {
        const params = ProdutosSchema.parse(args);
        return await apiClient.obterProdutos(params);
      }

      case 'obter_categorias': {
        return await apiClient.obterCategorias();
      }

      case 'obter_performance_equipe': {
        const params = StaffSchema.parse(args);
        return await apiClient.obterStaff(params);
      }

      case 'obter_detalhe_funcionario': {
        const { nome, data_inicio, data_fim } = args;
        return await apiClient.obterDetalheFuncionario(nome, data_inicio, data_fim);
      }

      case 'filtrar_clientes': {
        const params = ClienteFiltroSchema.parse(args);
        return await apiClient.filtrarClientes(params);
      }

      case 'obter_perfil_cliente': {
        const params = ClientePerfilSchema.parse(args);
        return await apiClient.obterPerfilCliente(params.identificador);
      }

      default:
        throw new Error(`Ferramenta desconhecida: ${name}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erro ao executar ${name}: ${error.message}`);
    }
    throw error;
  }
}