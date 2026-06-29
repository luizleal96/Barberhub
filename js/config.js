/* =========================================================
   CONFIG — ponto único de configuração para integração
   futura com o backend / banco de dados.

   Quando o banco estiver pronto, basta:
   1. Trocar API_CONFIG.useMock para false
   2. Apontar API_CONFIG.baseUrl para a URL real da API
   3. Garantir que os endpoints abaixo existam no backend
      (mesmo formato usado em api.js)
   ========================================================= */

const API_CONFIG = {
  // Quando false, api.js faz fetch() de verdade para baseUrl.
  // Quando true, usa storage.js (dados em memória) — útil
  // para desenvolver o front antes do banco estar pronto.
  useMock: false,

  baseUrl: 'http://localhost:3000/api', // ex: 'https://meuapp.com/api'

  endpoints: {
    clientes: '/clientes',
    barbeiros: '/barbeiros',
    servicos: '/servicos',
    agendamentos: '/agendamentos',
    pagamentos: '/pagamentos',
    produtos: '/produtos',
  },
};
