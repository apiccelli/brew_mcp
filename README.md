# 🍺 Brewteco MCP Server

Servidor MCP (Model Context Protocol) para integração das APIs do Brewteco com assistentes de IA como Claude Desktop.

## 📋 Índice

- [O que é MCP?](#o-que-é-mcp)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Ferramentas Disponíveis](#ferramentas-disponíveis)
- [Uso com Claude Desktop](#uso-com-claude-desktop)
- [Desenvolvimento](#desenvolvimento)
- [Exemplos](#exemplos)

---

## 🤔 O que é MCP?

**Model Context Protocol (MCP)** é um protocolo da Anthropic que permite que assistentes de IA (como Claude) se conectem a fontes de dados externas e executem ações através de "ferramentas".

Este servidor MCP expõe as **5 APIs principais do Brewteco** como ferramentas que Claude pode usar:

1. **Vendas** - Dados de faturamento e transações
2. **Produtos** - Performance e ranking de produtos
3. **Equipe** - Performance de vendedores
4. **Clientes** - Filtros e segmentação de clientes
5. **Perfil** - Dados detalhados de clientes individuais

---

## 📦 Instalação

### Pré-requisitos

- Node.js >= 18.0.0
- API Brewteco rodando (porta 3700)

### Instalar dependências

```bash
npm install
```

### Build

```bash
npm run build
```

Isso irá:
- Compilar TypeScript para JavaScript
- Gerar os arquivos em `dist/`
- Tornar o executável `dist/index.js` executável

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` (opcional):

```bash
BREWTECO_API_URL=http://localhost:3700/api/v1
```

**Padrão:** `http://localhost:3700/api/v1`

### Configurar no Claude Desktop

Edite o arquivo de configuração do Claude Desktop:

**MacOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Adicione:

```json
{
  "mcpServers": {
    "brewteco": {
      "command": "node",
      "args": ["/caminho/absoluto/para/brewteco-mcp-server/dist/index.js"],
      "env": {
        "BREWTECO_API_URL": "http://localhost:3700/api/v1"
      }
    }
  }
}
```

**⚠️ IMPORTANTE:** Use o caminho **absoluto** para o arquivo `dist/index.js`

### Reiniciar Claude Desktop

Após configurar, reinicie completamente o Claude Desktop.

---

## 🛠️ Ferramentas Disponíveis

### 1. `obter_vendas`

Obtém dados gerais de vendas de uma loja em um período.

**Parâmetros:**
- `data_inicio` (obrigatório): Data inicial (YYYY-MM-DD)
- `data_fim` (obrigatório): Data final (YYYY-MM-DD)
- `loja` (opcional): Nome da loja

**Exemplo:**
```
Quanto vendemos em BOTAFOGO entre 01/12/2024 e 15/12/2024?
```

### 2. `comparar_vendas_lojas`

Compara vendas entre todas as lojas.

**Parâmetros:**
- `data_inicio` (obrigatório): Data inicial
- `data_fim` (obrigatório): Data final

**Exemplo:**
```
Compare as vendas de todas as lojas em dezembro
```

### 3. `obter_produtos`

Ranking de produtos mais/menos vendidos com filtros.

**Parâmetros:**
- `periodo` (obrigatório): hoje, ontem, semana_atual, mes_atual, custom
- `data_inicio`: Se periodo=custom
- `data_fim`: Se periodo=custom
- `categoria` (opcional): Filtro por categoria
- `limite` (opcional): Quantidade (1-100)
- `ordem` (opcional): mais_vendidos, menos_vendidos
- `loja` (opcional): Filtro por loja

**Exemplo:**
```
Quais os 10 produtos mais vendidos de CHOPE em BOTAFOGO esta semana?
```

### 4. `obter_categorias`

Lista todas as categorias de produtos.

**Exemplo:**
```
Quais categorias de produtos temos?
```

### 5. `obter_performance_equipe`

Ranking de vendas da equipe com análise de mix.

**Parâmetros:**
- `periodo` (obrigatório): hoje, ontem, semana_atual, mes_atual, custom
- `data_inicio`: Se periodo=custom
- `data_fim`: Se periodo=custom
- `loja` (opcional): Filtro por loja

**Exemplo:**
```
Quem são os melhores vendedores de GAVEA este mês?
```

### 6. `obter_detalhe_funcionario`

Detalhamento de vendas por categoria de um funcionário.

**Parâmetros:**
- `nome` (obrigatório): Nome do funcionário
- `data_inicio` (obrigatório): Data inicial
- `data_fim` (obrigatório): Data final

**Exemplo:**
```
Mostre as vendas detalhadas do Carlos Silva em dezembro
```

### 7. `filtrar_clientes`

Busca e filtra clientes por comportamento.

**Parâmetros (todos opcionais):**
- `categorias_consumidas`: Array de categorias
- `produtos_consumidos`: Array de produtos
- `gasto_total_min`: Gasto mínimo
- `gasto_total_max`: Gasto máximo
- `dias_sem_visita_min`: Dias sem visitar
- `frequencia_min`: Frequência mínima
- `loja`: Filtro por loja
- `data_inicio`: Período inicial
- `data_fim`: Período final
- `limite`: Quantidade de resultados

**Exemplos:**
```
Liste os clientes VIP de BOTAFOGO que gastaram mais de R$ 1000

Encontre clientes que não visitam há mais de 45 dias

Quem são os fãs de IPA em LEBLON?
```

### 8. `obter_perfil_cliente`

Perfil completo de um cliente específico.

**Parâmetros:**
- `identificador` (obrigatório): CPF, telefone ou email

**Exemplo:**
```
Mostre o perfil completo do cliente 11987654321
```

---

## 💬 Uso com Claude Desktop

Após configurar, você pode conversar naturalmente com Claude:

### Exemplo 1: Dashboard Gerencial

```
Claude, me dê um resumo executivo de BOTAFOGO em dezembro de 2024:
- Faturamento total
- Top 5 produtos
- Melhor vendedor
- Quantos clientes VIP temos
```

Claude irá automaticamente:
1. Chamar `obter_vendas` com as datas corretas
2. Chamar `obter_produtos` para o top 5
3. Chamar `obter_performance_equipe` para ranking
4. Chamar `filtrar_clientes` para VIPs
5. Montar um relatório consolidado

### Exemplo 2: Análise de Cliente

```
Preciso entender melhor o perfil do cliente João Silva (CPF: 12345678901).
Me mostre seu histórico completo e sugira ações de marketing.
```

Claude irá:
1. Chamar `obter_perfil_cliente` com o CPF
2. Analisar LTV, produtos favoritos, frequência
3. Sugerir ações personalizadas

### Exemplo 3: Campanha de Marketing

```
Encontre clientes de GAVEA que:
- Gostam de IPA
- Visitam frequentemente (5+ vezes)
- Gastam entre R$ 500 e R$ 2000
- Estão ativos (visitaram nos últimos 30 dias)

Depois me sugira uma campanha para eles.
```

Claude irá:
1. Chamar `filtrar_clientes` com os critérios
2. Analisar o perfil dos clientes retornados
3. Sugerir campanha personalizada

---

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
brewteco-mcp-server/
├── src/
│   ├── index.ts          # Servidor MCP principal
│   ├── api-client.ts     # Cliente HTTP para API
│   ├── tools.ts          # Definição das ferramentas MCP
│   └── types.ts          # Types e schemas Zod
├── dist/                 # Código compilado
├── package.json
├── tsconfig.json
└── README.md
```

### Comandos Disponíveis

```bash
# Desenvolvimento com hot-reload
npm run dev

# Build de produção
npm run build

# Iniciar servidor (após build)
npm start

# Testar com MCP Inspector
npm run inspector
```

### Testar com MCP Inspector

O MCP Inspector é uma ferramenta da Anthropic para testar servidores MCP:

```bash
npm run inspector
```

Isso abre uma interface web onde você pode:
- Ver todas as ferramentas disponíveis
- Testar chamadas com diferentes parâmetros
- Ver respostas em tempo real
- Debug de problemas

---

## 🎯 Exemplos Práticos

### Exemplo 1: Vendas do Dia

**Pergunta ao Claude:**
```
Quanto vendemos hoje em BOTAFOGO?
```

**Ferramenta usada:**
```json
{
  "name": "obter_vendas",
  "arguments": {
    "data_inicio": "2024-12-18",
    "data_fim": "2024-12-18",
    "loja": "BOTAFOGO"
  }
}
```

### Exemplo 2: Clientes Inativos

**Pergunta ao Claude:**
```
Liste clientes de LEBLON que não visitam há mais de 60 dias mas já gastaram mais de R$ 500
```

**Ferramenta usada:**
```json
{
  "name": "filtrar_clientes",
  "arguments": {
    "dias_sem_visita_min": 60,
    "gasto_total_min": 500,
    "loja": "LEBLON",
    "limite": 50
  }
}
```

### Exemplo 3: Análise de Performance

**Pergunta ao Claude:**
```
Compare a performance de vendas de todas as lojas em novembro e identifique a melhor
```

**Ferramentas usadas:**
```json
{
  "name": "comparar_vendas_lojas",
  "arguments": {
    "data_inicio": "2024-11-01",
    "data_fim": "2024-11-30"
  }
}
```

---

## 🔒 Segurança

### Boas Práticas

1. **Validação de Dados**: Todos os parâmetros são validados com Zod
2. **Tratamento de Erros**: Erros da API são capturados e formatados
3. **Timeout**: Requisições têm timeout de 30 segundos
4. **Retry Logic**: Falhas temporárias são retentadas 3 vezes
5. **Logs**: Todas as operações são logadas em stderr

### Dados Sensíveis

- O servidor MCP **não armazena dados**
- Todas as requisições são stateless
- Logs não contêm informações sensíveis de clientes

---

## 🐛 Troubleshooting

### Problema: Claude não vê as ferramentas

**Solução:**
1. Verifique se o caminho em `claude_desktop_config.json` está correto
2. Certifique-se de usar caminho **absoluto**
3. Reinicie completamente o Claude Desktop
4. Verifique os logs em: `~/Library/Logs/Claude/` (MacOS)

### Problema: Erro "Connection refused"

**Solução:**
1. Verifique se a API Brewteco está rodando: `curl http://localhost:3700/api/v1/health`
2. Confirme a `BREWTECO_API_URL` na configuração
3. Teste a conexão manualmente

### Problema: Ferramentas retornam erro

**Solução:**
1. Use o MCP Inspector para testar: `npm run inspector`
2. Verifique os logs do servidor MCP
3. Confirme que os parâmetros estão corretos

### Problema: Build falha

**Solução:**
```bash
# Limpar e reinstalar
rm -rf node_modules dist
npm install
npm run build
```

---

## 📚 Recursos

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop](https://claude.ai/download)

---

## 📄 Licença

Propriedade da Brewteco.

---

**Versão:** 1.0.0  
**Última Atualização:** Dezembro 2024



echo "# brew_mcp" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:apiccelli/brew_mcp.git
git push -u origin main