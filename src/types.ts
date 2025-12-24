import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

// Schema para vendas
export const VendasSchema = z.object({
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)'),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)'),
  loja: z.string().optional()
});

// Schema para produtos
export const ProdutosSchema = z.object({
  periodo: z.enum(['hoje', 'ontem', 'semana_atual', 'mes_atual', 'custom']),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  categoria: z.string().optional(),
  limite: z.number().min(1).max(100).optional(),
  ordem: z.enum(['mais_vendidos', 'menos_vendidos']).optional(),
  loja: z.string().optional()
});

// Schema para staff
export const StaffSchema = z.object({
  periodo: z.enum(['hoje', 'ontem', 'semana_atual', 'mes_atual', 'custom']),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  loja: z.string().optional()
});

// Schema para filtro de clientes
export const ClienteFiltroSchema = z.object({
  categorias_consumidas: z.array(z.string()).optional(),
  produtos_consumidos: z.array(z.string()).optional(),
  gasto_total_min: z.number().min(0).optional(),
  gasto_total_max: z.number().min(0).optional(),
  dias_sem_visita_min: z.number().min(0).optional(),
  frequencia_min: z.number().min(1).optional(),
  loja: z.string().optional(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limite: z.number().min(1).max(1000).optional()
});

// Schema para perfil de cliente
export const ClientePerfilSchema = z.object({
  identificador: z.string().min(1, 'Identificador é obrigatório')
});

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export type VendasParams = z.infer<typeof VendasSchema>;
export type ProdutosParams = z.infer<typeof ProdutosSchema>;
export type StaffParams = z.infer<typeof StaffSchema>;
export type ClienteFiltroParams = z.infer<typeof ClienteFiltroSchema>;
export type ClientePerfilParams = z.infer<typeof ClientePerfilSchema>;

// Tipo de resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

// Configuração do servidor
export interface ServerConfig {
  apiBaseUrl: string;
  timeout?: number;
  retries?: number;
}

// Lojas disponíveis
export const LOJAS_DISPONIVEIS = [
  'BOTAFOGO',
  'GAVEA',
  'FERRADURA',
  'TIJUCA',
  'LAPA',
  'LARANJEIRAS',
  'ROSAS',
  'RUFI_BAR',
  'MORRO_DA_URCA',
  'LEBLON'
] as const;

export type LojaDisponivel = typeof LOJAS_DISPONIVEIS[number];