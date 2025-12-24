# 🍺 Exemplos de Uso - Brewteco MCP Server

Guia prático de como usar o servidor MCP com Claude Desktop.

---

## 📋 Índice

- [Setup Inicial](#setup-inicial)
- [Perguntas Básicas](#perguntas-básicas)
- [Análises Avançadas](#análises-avançadas)
- [Casos de Uso Reais](#casos-de-uso-reais)
- [Conversas Exemplo](#conversas-exemplo)

---

## 🚀 Setup Inicial

### 1. Iniciar a API Brewteco

```bash
cd brewteco-api
npm run dev
```

Verifique se está rodando:
```bash
curl http://localhost:3700/api/v1/health
```

### 2. Build do MCP Server

```bash
cd brewteco-mcp-server
npm install
npm run build
```

### 3. Configurar Claude Desktop

Edite `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "brewteco": {
      "command": "node",
      "args": ["/Users/seu-usuario/projetos/brewteco-mcp-server/dist/index.js"],
      "env": {
        "BREWTECO_API_URL": "http://localhost:3700/api/v1"
      }
    }
  }
}
```

### 4. Reiniciar Claude Desktop

Feche completamente e abra novamente.

---

## 💬 Perguntas Básicas

### Vendas

```
Quanto vendemos hoje?
```

```
Qual foi o faturamento de BOTAFOGO em dezembro?
```

```
Compare as vendas de todas as lojas esta semana
```

### Produtos

```
Quais os 10 produtos mais vendidos hoje?
```

```
Me mostre os produtos de Chope mais vendidos em GAVEA este mês
```

```
Quais produtos estão vendendo pouco?
```

### Equipe

```
Quem é o melhor vendedor de LEBLON?
```

```
Mostre o ranking da equipe de BOTAFOGO em dezembro
```

```
Quanto o Carlos Silva vendeu esta semana?
```

### Clientes

```
Quantos clientes VIP temos?
```

```
Liste clientes que não visitam há mais de 45 dias
```

```
Quem são os fãs de IPA?
```

---

## 🎯 Análises Avançadas

### Dashboard Executivo

```
Claude, preciso de um dashboard executivo de BOTAFOGO para dezembro de 2024:

1. Faturamento total e comparação com outras lojas
2. Top 5 produtos mais vendidos
3. Ranking dos 3 melhores vendedores
4. Quantos clientes VIP temos (gasto > R$ 1000)
5. Quantos clientes estão inativos (45+ dias)

Depois me dê insights e recomendações.
```

**Claude irá:**
- Fazer 5+ chamadas de ferramentas automaticamente
- Consolidar os dados
- Gerar análise completa com insights

### Análise de Cliente Individual

```
Preciso entender o perfil completo do cliente com CPF 12345678901:

1. Histórico de compras e frequência
2. Produtos favoritos e categorias
3. Loja preferida e última visita
4. Classificação (VIP, Regular, etc)
5. Sugestões de ações de marketing personalizadas
```

**Claude irá:**
- Buscar perfil completo via `obter_perfil_cliente`
- Analisar padrões de consumo
- Sugerir ações específicas

### Comparação Entre Lojas

```
Compare o desempenho de BOTAFOGO e GAVEA em novembro:

- Faturamento total
- Ticket médio
- Produtos mais vendidos
- Qual loja tem melhor performance de equipe

Identifique pontos fortes e fracos de cada uma.
```

---

## 🏆 Casos de Uso Reais

### Caso 1: Planejamento de Estoque

```
Claude, preciso decidir o que comprar para reposição de estoque em LEBLON.

Analise:
1. Top 20 produtos mais vendidos nos últimos 15 dias
2. Produtos que estão vendendo acima da média
3. Produtos que venderam pouco (últimos 10)

Me dê recomendações de compra priorizadas.
```

**Resultado Esperado:**
- Lista de produtos críticos para reposição
- Produtos que podem ter compra reduzida
- Estimativa de demanda baseada em histórico

### Caso 2: Campanha de Reativação

```
Vamos criar uma campanha para trazer clientes de volta:

1. Encontre clientes de BOTAFOGO que:
   - Não visitam há 45-90 dias
   - Já gastaram mais de R$ 500 no total
   - Visitaram pelo menos 3 vezes antes

2. Me dê o perfil desses clientes (produtos favoritos, etc)

3. Sugira uma mensagem de WhatsApp personalizada para cada perfil
```

**Resultado Esperado:**
- Lista de clientes qualificados
- Análise de preferências
- Templates de mensagem segmentados

### Caso 3: Evento Especial de IPA

```
Vamos fazer um evento de lançamento de IPA em GAVEA.

Me ajude a:
1. Identificar os maiores consumidores de IPA (top 50)
2. Ver o perfil desses clientes (ticket médio, frequência)
3. Quantos deles são de GAVEA vs outras lojas
4. Sugerir lista VIP para convite antecipado
5. Criar estratégia de divulgação
```

### Caso 4: Avaliação de Vendedor

```
O gerente quer avaliar a performance do vendedor "Ana Paula" em BOTAFOGO.

Análise completa:
1. Vendas totais no último mês
2. Ticket médio comparado com a equipe
3. Mix de produtos (bebida vs comida)
4. Comparação com os outros vendedores
5. Pontos fortes e áreas de melhoria
```

### Caso 5: Análise de Preço/Demanda

```
Estamos pensando em aumentar o preço do Chopp Pilsen.

Me ajude com:
1. Quantas unidades vendemos por mês
2. Qual o percentual nas vendas totais
3. Perfil dos consumidores (são VIPs? Eventuais?)
4. Se aumentarmos 10%, qual impacto estimado no faturamento
5. Risco de perder clientes
```

---

## 🗣️ Conversas Exemplo

### Conversa 1: Investigação de Queda nas Vendas

**Você:**
```
Claude, as vendas de TIJUCA caíram esta semana. Me ajude a investigar.
```

**Claude:**
```
Vou analisar TIJUCA para você. Deixe-me buscar os dados...

[Chama: obter_vendas para semana atual e anterior]
[Chama: obter_produtos para ver quais produtos caíram]
[Chama: obter_performance_equipe para ver se é problema de vendedores]

Análise de TIJUCA:

📉 VENDAS:
- Semana atual: R$ 15.200 (-18% vs semana passada)
- Transações: 145 (-22%)
- Ticket médio: R$ 104,83 (+5% - positivo)

🔍 CAUSA PRINCIPAL:
O problema não é ticket médio (até subiu), mas sim QUANTIDADE de clientes.

📦 PRODUTOS:
- Chope caiu 25% em volume
- Comida manteve estável
- IPA cresceu 10%

👥 EQUIPE:
- 2 vendedores faltaram segunda e terça
- Performance dos demais normal

💡 RECOMENDAÇÕES:
1. Investigar se houve problema operacional (falta de staff)
2. Verificar eventos concorrentes na região
3. Considerar promoção de Chope (produto que mais caiu)
```

### Conversa 2: Preparação para Final de Semana

**Você:**
```
É quinta-feira. Me ajude a preparar BOTAFOGO para o fim de semana.
```

**Claude:**
```
Ótimo! Vou analisar os dados para preparar o melhor FDS.

[Chama: obter_produtos dos últimos 3 fins de semana]
[Chama: obter_performance_equipe]
[Chama: filtrar_clientes VIPs]

📊 ANÁLISE DOS ÚLTIMOS FDS:

PRODUTOS CAMPEÕES:
1. Chopp Pilsen - média 450 un/dia
2. Hambúrguer - média 180 un/dia  
3. IPA Lata - média 220 un/dia

⚠️ PRODUTOS CRÍTICOS (Atenção ao estoque):
- Chopp Pilsen (alta demanda)
- Batata Frita (acompanhamento popular)
- Cervejas em lata (venda rápida)

👥 EQUIPE SUGERIDA:
- Escalar Carlos Silva e Ana Paula (top performers)
- Ter pelo menos 4 vendedores por turno
- Reforço na cozinha (hambúrgueres)

🎯 ESTRATÉGIA:
- 15 clientes VIP visitaram nas últimas 2 sextas
- Enviar mensagem personalizada hoje convidando
- Promoção: "Chope + Hambúrguer" pode aumentar ticket médio

💰 EXPECTATIVA:
Baseado nas últimas 4 semanas, faturamento esperado: R$ 45-50k no FDS
```

### Conversa 3: Análise Competitiva Interna

**Você:**
```
Quero entender por que GAVEA fatura mais que BOTAFOGO, sendo que BOTAFOGO tem mais movimento.
```

**Claude:**
```
Interessante! Vou comparar as duas lojas em detalhe.

[Chama: obter_vendas para ambas lojas]
[Chama: obter_produtos de ambas]
[Chama: obter_performance_equipe de ambas]
[Chama: filtrar_clientes VIPs de ambas]

🔍 ANÁLISE COMPARATIVA - NOVEMBRO:

📊 NÚMEROS GERAIS:
BOTAFOGO:
- Faturamento: R$ 87.500
- Transações: 845 👈 MAIOR
- Ticket Médio: R$ 103,55

GAVEA:
- Faturamento: R$ 92.300 👈 MAIOR
- Transações: 720
- Ticket Médio: R$ 128,19 👈 MUITO MAIOR (+24%)

🎯 CAUSA RAIZ - TICKET MÉDIO:

BOTAFOGO (R$ 103):
- 60% compra apenas chopp
- 30% chopp + 1 comida
- 10% consumo completo

GAVEA (R$ 128):
- 45% compra apenas chopp
- 40% chopp + comida 👈 MAIOR
- 15% consumo completo + sobremesa

👥 PERFIL DE CLIENTES:

BOTAFOGO:
- 180 clientes VIP (gasto > R$ 1000)
- Foco em "happy hour rápido"
- Rotatividade alta

GAVEA:
- 210 clientes VIP 👈 MAIS VIPs
- Foco em "experiência gastronômica"
- Permanência maior

💡 RECOMENDAÇÕES PARA BOTAFOGO:

1. MENU COMBINADO:
   - Criar "combos" tipo "Chopp + Hambúrguer"
   - Oferta visível e atrativa
   
2. UPSELL:
   - Treinar equipe para sugerir acompanhamento
   - "Vai querer algo para comer com o chopp?"
   
3. AMBIENTE:
   - Incentivar permanência maior
   - Música, decoração mais acolhedora
   
4. MARKETING:
   - Divulgar lado gastronômico
   - Não só "bar de chopp"

📈 POTENCIAL:
Se BOTAFOGO aumentar ticket médio em apenas 15% (de R$ 103 para R$ 118), com o mesmo volume de transações, faturaria R$ 100k/mês (+14% vs atual)
```

---

## 🎓 Dicas para Melhores Resultados

### 1. Seja Específico com Datas

❌ Ruim: "Me mostre as vendas"  
✅ Bom: "Me mostre as vendas de BOTAFOGO entre 01/12 e 15/12"

### 2. Peça Análises, Não Só Dados

❌ Ruim: "Liste os produtos"  
✅ Bom: "Analise os produtos mais vendidos e me diga se devo aumentar o estoque"

### 3. Use Contexto de Negócio

❌ Ruim: "Filtre clientes"  
✅ Bom: "Encontre clientes para campanha de final de ano - VIPs ativos que gostam de IPA"

### 4. Peça Recomendações

❌ Ruim: "Mostre vendas da equipe"  
✅ Bom: "Analise a equipe e me diga quem merece bonificação este mês"

### 5. Combine Múltiplas Análises

❌ Ruim: Uma pergunta por vez  
✅ Bom: "Me dê um dashboard completo de GAVEA: vendas, produtos, equipe e clientes VIP"

---

## 🐛 Troubleshooting

### Claude não responde sobre Brewteco

**Verifique:**
1. API está rodando? `curl http://localhost:3700/api/v1/health`
2. MCP Server configurado corretamente?
3. Claude Desktop reiniciado?
4. Veja os logs: `~/Library/Logs/Claude/`

### Respostas genéricas

Se Claude responder de forma genérica sem usar ferramentas:

❌ "Claude, me fale sobre vendas"  
✅ "Claude, use a ferramenta brewteco para buscar vendas de BOTAFOGO em dezembro"

### Erro de conexão

```
Error: Connection refused
```

A API não está rodando. Inicie:
```bash
cd brewteco-api && npm run dev
```

---

## 📚 Recursos

- [MCP Documentation](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/download)
- API Brewteco: `http://localhost:3700/api/v1`

---

**Última Atualização:** Dezembro 2024