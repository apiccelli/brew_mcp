import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  VendasParams,
  ProdutosParams,
  StaffParams,
  ClienteFiltroParams,
  //ClientePerfilParams,
  ApiResponse,
  ServerConfig
} from './types.js';

/**
 * Cliente para comunicação com a API Brewteco
 */
export class BrewtecoApiClient {
  private client: AxiosInstance;
  private retries: number;

  constructor(config: ServerConfig) {
    this.retries = config.retries || 3;
    
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Brewteco-MCP-Server/1.0.0'
      }
    });

    // Interceptor para log de requisições
    this.client.interceptors.request.use(
      (config) => {
        console.error(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.config && this.shouldRetry(error) && this.retries > 0) {
          this.retries--;
          console.error(`[API Retry] Tentando novamente... (${this.retries} restantes)`);
          await this.delay(1000);
          return this.client.request(error.config);
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Verifica se deve tentar novamente após erro
   */
  private shouldRetry(error: AxiosError): boolean {
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.code === 'ECONNABORTED'
    );
  }

  /**
   * Delay para retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Trata erros da API
   */
  private handleError(error: AxiosError): Error {
    if (error.response) {
      const data = error.response.data as any;
      return new Error(
        data?.error?.message || 
        `Erro HTTP ${error.response.status}: ${error.response.statusText}`
      );
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error('Timeout: A requisição demorou muito para responder');
    }
    
    if (error.code === 'ECONNREFUSED') {
      return new Error('Conexão recusada: Verifique se a API está rodando');
    }
    
    return new Error(error.message || 'Erro desconhecido ao comunicar com a API');
  }

  /**
   * API 01: Vendas Gerais
   */
  async obterVendas(params: VendasParams): Promise<ApiResponse> {
    const response = await this.client.get('/relatorio/vendas', { params });
    return response.data;
  }

  /**
   * Comparação de vendas entre lojas
   */
  async compararVendas(data_inicio: string, data_fim: string): Promise<ApiResponse> {
    const response = await this.client.get('/relatorio/vendas/comparacao', {
      params: { data_inicio, data_fim }
    });
    return response.data;
  }

  /**
   * API 02: Performance de Produtos
   */
  async obterProdutos(params: ProdutosParams): Promise<ApiResponse> {
    const response = await this.client.get('/relatorio/produtos', { params });
    return response.data;
  }

  /**
   * Lista categorias disponíveis
   */
  async obterCategorias(): Promise<ApiResponse> {
    const response = await this.client.get('/relatorio/produtos/categorias');
    return response.data;
  }

  /**
   * API 03: Performance da Equipe
   */
  async obterStaff(params: StaffParams): Promise<ApiResponse> {
    const response = await this.client.get('/relatorio/staff', { params });
    return response.data;
  }

  /**
   * Detalhe de um funcionário específico
   */
  async obterDetalheFuncionario(
    nome: string,
    data_inicio: string,
    data_fim: string
  ): Promise<ApiResponse> {
    const response = await this.client.get(
      `/relatorio/staff/${encodeURIComponent(nome)}/detalhe`,
      { params: { data_inicio, data_fim } }
    );
    return response.data;
  }

  /**
   * API 04: Filtro de Clientes
   */
  async filtrarClientes(params: ClienteFiltroParams): Promise<ApiResponse> {
    const response = await this.client.post('/clientes/filtro', params);
    return response.data;
  }

  /**
   * API 05: Perfil Individual
   */
  async obterPerfilCliente(identificador: string): Promise<ApiResponse> {
    const response = await this.client.get(
      `/clientes/${encodeURIComponent(identificador)}/perfil`
    );
    return response.data;
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<ApiResponse> {
    const response = await this.client.get('/health');
    return response.data;
  }
}